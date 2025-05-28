'use client';

import { useState, useEffect, useCallback } from 'react';

import {
  Box,
  Card,
  Step,
  Grid,
  Button,
  Stepper,
  Container,
  Typography,
  StepLabel,
  CardContent,
  LinearProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useAuthContext } from 'src/auth/hooks';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { BackgroundGeneratorService } from 'src/lib/background-generator-service';
import { ImageUploadService } from 'src/lib/image-upload-service';
import { SessionManager, STEP_STATUS, PROCESSING_STEPS } from 'src/lib/session-manager';

import { ImageUploadZone } from '../components/image-upload-zone';
import { ImagePreviewCard } from '../components/image-preview-card';
import { BackgroundStyleSelector } from '../components/background-style-selector';
import { ProcessingStatus } from '../components/processing-status';
import { StepProgressIndicator } from '../components/step-progress-indicator';
import { ErrorRetryCard } from '../components/error-retry-card';

// ----------------------------------------------------------------------

const STEPS = [
  'Upload Hình Ảnh',
  'Chọn Style Background',
  'Xử Lý & Kết Quả',
];

// ----------------------------------------------------------------------

export function BackgroundGeneratorGeneratorView() {
  const { user } = useAuthContext();

  // Session state
  const [session, setSession] = useState(null);
  const [currentProcessingStep, setCurrentProcessingStep] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState('');

  // Legacy state for compatibility
  const [activeStep, setActiveStep] = useState(0);
  const [originalImage, setOriginalImage] = useState(null);
  const [originalImageUrl, setOriginalImageUrl] = useState('');
  const [removedBgImageUrl, setRemovedBgImageUrl] = useState('');
  const [finalImageUrl, setFinalImageUrl] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [error, setError] = useState(null);

  // Initialize or restore session
  useEffect(() => {
    if (!user?.id) return;

    let currentSession = SessionManager.getCurrentSession();

    if (!currentSession || currentSession.userId !== user.id) {
      // Create new session
      currentSession = SessionManager.initializeSession(user.id);
    }

    setSession(currentSession);

    // Restore state from session
    if (currentSession.results) {
      const { results } = currentSession;
      setOriginalImageUrl(results.originalImageUrl || '');
      setRemovedBgImageUrl(results.backgroundRemovedUrl || '');
      setFinalImageUrl(results.finalImageUrl || '');
      setSelectedStyle(results.selectedStyle);
      setCustomPrompt(results.customPrompt || '');
    }

    // Set active step based on session progress
    const executableStep = SessionManager.getCurrentExecutableStep();
    if (executableStep) {
      const stepMapping = {
        [PROCESSING_STEPS.UPLOAD]: 0,
        [PROCESSING_STEPS.STYLE_SELECTION]: 1,
        [PROCESSING_STEPS.BACKGROUND_REMOVAL]: 2,
        [PROCESSING_STEPS.BACKGROUND_GENERATION]: 2,
        [PROCESSING_STEPS.FINAL_PROCESSING]: 2,
      };
      setActiveStep(stepMapping[executableStep] || 0);
    }
  }, [user]);

  // Handle image upload
  const handleImageUpload = useCallback(async (file) => {
    try {
      if (!user?.id) {
        toast.error('Vui lòng đăng nhập để sử dụng tính năng này');
        return;
      }

      // Update session step status
      SessionManager.updateStepStatus(PROCESSING_STEPS.UPLOAD, STEP_STATUS.IN_PROGRESS);
      setCurrentProcessingStep(PROCESSING_STEPS.UPLOAD);
      setProcessingMessage('Đang upload hình ảnh...');
      setProcessingProgress(20);
      setError(null);

      // Upload to Supabase Storage
      const uploadResult = await ImageUploadService.uploadOriginalImage(file, user.id);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      // Update session with results
      SessionManager.updateResults({
        originalImageUrl: uploadResult.data.url,
        originalImageFile: file,
        imageRecordId: uploadResult.data.id
      });

      // Mark step as completed
      SessionManager.updateStepStatus(PROCESSING_STEPS.UPLOAD, STEP_STATUS.COMPLETED, {
        imageUrl: uploadResult.data.url,
        imageId: uploadResult.data.id
      });

      setOriginalImage(file);
      setOriginalImageUrl(uploadResult.data.url);
      setActiveStep(1);
      setCurrentProcessingStep(null);
      setProcessingProgress(0);

      toast.success('Upload hình ảnh thành công!');
    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      SessionManager.updateStepStatus(PROCESSING_STEPS.UPLOAD, STEP_STATUS.ERROR, null, uploadError.message);
      setError(`Lỗi upload hình ảnh: ${uploadError.message}`);
      setCurrentProcessingStep(null);
      toast.error(`Lỗi upload hình ảnh: ${uploadError.message}`);
    }
  }, [user]);

  // Handle style selection
  const handleStyleSelect = useCallback((style) => {
    setSelectedStyle(style);

    // Update session
    SessionManager.updateResults({ selectedStyle: style });
    SessionManager.updateStepStatus(PROCESSING_STEPS.STYLE_SELECTION, STEP_STATUS.COMPLETED, { style });

    setActiveStep(2);
  }, []);

  // Handle custom prompt change
  const handleCustomPromptChange = useCallback((prompt) => {
    setCustomPrompt(prompt);

    // Update session
    SessionManager.updateResults({ customPrompt: prompt });
  }, []);

  // Handle image processing
  const handleProcessImage = useCallback(async () => {
    if (!originalImage || (!selectedStyle && !customPrompt)) {
      toast.error('Vui lòng chọn style hoặc nhập prompt');
      return;
    }

    if (!user?.id) {
      toast.error('Vui lòng đăng nhập để sử dụng tính năng này');
      return;
    }

    try {
      setError(null);

      // Prepare options
      const options = {
        prompt: customPrompt || selectedStyle?.prompt || 'professional studio background, clean, minimalist',
        style: selectedStyle?.style || 'photographic',
        enableUpscale: false, // Can be made configurable
        enableEnhance: false, // Can be made configurable
      };

      // Progress callback with session updates
      const onProgress = ({ step, message, progress }) => {
        setCurrentProcessingStep(step);
        setProcessingMessage(message);
        setProcessingProgress(progress);

        // Update session step status
        if (step === 'removing_bg') {
          SessionManager.updateStepStatus(PROCESSING_STEPS.BACKGROUND_REMOVAL, STEP_STATUS.IN_PROGRESS);
        } else if (step === 'generating_bg') {
          SessionManager.updateStepStatus(PROCESSING_STEPS.BACKGROUND_GENERATION, STEP_STATUS.IN_PROGRESS);
        } else if (step === 'saving') {
          SessionManager.updateStepStatus(PROCESSING_STEPS.FINAL_PROCESSING, STEP_STATUS.IN_PROGRESS);
        }
      };

      // Process image using the service
      const result = await BackgroundGeneratorService.processImage(
        originalImage,
        user.id,
        options,
        onProgress
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      // Update session with final results
      SessionManager.updateResults({
        backgroundRemovedUrl: result.data.backgroundRemovedUrl,
        finalImageUrl: result.data.finalUrl
      });

      // Mark all processing steps as completed
      SessionManager.updateStepStatus(PROCESSING_STEPS.BACKGROUND_REMOVAL, STEP_STATUS.COMPLETED);
      SessionManager.updateStepStatus(PROCESSING_STEPS.BACKGROUND_GENERATION, STEP_STATUS.COMPLETED);
      SessionManager.updateStepStatus(PROCESSING_STEPS.FINAL_PROCESSING, STEP_STATUS.COMPLETED);

      // Update state with results
      setRemovedBgImageUrl(result.data.backgroundRemovedUrl);
      setFinalImageUrl(result.data.finalUrl);
      setCurrentProcessingStep(null);
      setProcessingMessage('Hoàn thành!');
      setProcessingProgress(100);

      toast.success('Tạo background thành công!');
    } catch (processError) {
      console.error('Processing error:', processError);

      // Update session with error
      const currentStep = SessionManager.getCurrentExecutableStep();
      if (currentStep) {
        SessionManager.updateStepStatus(currentStep, STEP_STATUS.ERROR, null, processError.message);
      }

      setError(`Lỗi xử lý hình ảnh: ${processError.message}`);
      setCurrentProcessingStep(null);
      setProcessingMessage('Có lỗi xảy ra');
      toast.error(`Lỗi xử lý hình ảnh: ${processError.message}`);
    }
  }, [originalImage, selectedStyle, customPrompt, user]);

  // Handle retry step
  const handleRetryStep = useCallback((stepName) => {
    SessionManager.resetStep(stepName);
    setError(null);

    // Execute the appropriate action based on step
    if (stepName === PROCESSING_STEPS.UPLOAD && originalImage) {
      handleImageUpload(originalImage);
    } else if (stepName === PROCESSING_STEPS.STYLE_SELECTION && selectedStyle) {
      handleStyleSelect(selectedStyle);
    } else if ([PROCESSING_STEPS.BACKGROUND_REMOVAL, PROCESSING_STEPS.BACKGROUND_GENERATION, PROCESSING_STEPS.FINAL_PROCESSING].includes(stepName)) {
      handleProcessImage();
    }
  }, [originalImage, selectedStyle, handleImageUpload, handleStyleSelect, handleProcessImage]);

  // Handle reset session
  const handleResetSession = useCallback(() => {
    SessionManager.clearSession();
    setActiveStep(0);
    setOriginalImage(null);
    setOriginalImageUrl('');
    setRemovedBgImageUrl('');
    setFinalImageUrl('');
    setSelectedStyle(null);
    setCustomPrompt('');
    setCurrentProcessingStep(null);
    setProcessingProgress(0);
    setProcessingMessage('');
    setError(null);

    // Initialize new session
    if (user?.id) {
      const newSession = SessionManager.initializeSession(user.id);
      setSession(newSession);
    }
  }, [user]);

  // Handle reset (legacy)
  const handleReset = useCallback(() => {
    handleResetSession();
  }, [handleResetSession]);

  // Handle download
  const handleDownload = useCallback(() => {
    if (finalImageUrl) {
      const link = document.createElement('a');
      link.href = finalImageUrl;
      link.download = `background-generated-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Tải xuống thành công!');
    }
  }, [finalImageUrl]);

  const isProcessing = currentProcessingStep !== null;

  return (
    <Container maxWidth="xl">
      <CustomBreadcrumbs
        heading="Generator"
        links={[
          { name: 'Background Generator', href: paths.backgroundGenerator.root },
          { name: 'Generator' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* Stepper */}
      <Card sx={{ mb: 5 }}>
        <CardContent>
          <Stepper activeStep={activeStep} alternativeLabel>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Step Progress Indicator */}
      <StepProgressIndicator
        onRetryStep={handleRetryStep}
        onResetSession={handleResetSession}
        currentProcessingStep={currentProcessingStep}
        processingProgress={processingProgress}
      />

      {/* Error Retry Card */}
      <ErrorRetryCard
        onRetryStep={handleRetryStep}
        onResetAll={handleResetSession}
        sx={{ mb: 3 }}
      />

      {/* Processing Status */}
      {isProcessing && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <ProcessingStatus
              step={currentProcessingStep}
              progress={processingProgress}
              message={processingMessage}
            />
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card sx={{ mb: 3, bgcolor: 'error.lighter' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Iconify icon="solar:danger-bold" sx={{ color: 'error.main', mr: 2 }} />
              <Typography color="error.main">{error}</Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        {/* Left Column - Controls */}
        <Grid item size={{ xs: 12, lg: 6 }}>
          {/* Step 1: Upload Image */}
          {activeStep === 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Upload Hình Ảnh Sản Phẩm
                </Typography>
                <ImageUploadZone
                  onUpload={handleImageUpload}
                  disabled={isProcessing}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 2: Select Style */}
          {activeStep === 1 && (
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Chọn Style Background
                </Typography>
                <BackgroundStyleSelector
                  selectedStyle={selectedStyle}
                  onStyleSelect={handleStyleSelect}
                  customPrompt={customPrompt}
                  onCustomPromptChange={handleCustomPromptChange}
                  disabled={isProcessing}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 3: Process & Results */}
          {activeStep === 2 && (
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Xử Lý & Kết Quả
                </Typography>

                {!isProcessing && !finalImageUrl && (
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={handleProcessImage}
                    startIcon={<Iconify icon="solar:magic-stick-3-bold" />}
                    sx={{ mb: 2 }}
                    disabled={!SessionManager.canExecuteStep(PROCESSING_STEPS.BACKGROUND_REMOVAL)}
                  >
                    Bắt Đầu Xử Lý
                  </Button>
                )}

                {finalImageUrl && (
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleDownload}
                      startIcon={<Iconify icon="solar:download-bold" />}
                      sx={{ flex: 1 }}
                    >
                      Tải Xuống
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleReset}
                      startIcon={<Iconify icon="solar:restart-bold" />}
                      sx={{ flex: 1 }}
                    >
                      Tạo Mới
                    </Button>
                  </Box>
                )}

                <Button
                  variant="text"
                  onClick={() => setActiveStep(1)}
                  startIcon={<Iconify icon="solar:arrow-left-bold" />}
                  disabled={isProcessing}
                >
                  Quay Lại
                </Button>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Right Column - Preview */}
        <Grid item size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Preview
              </Typography>

              {originalImageUrl && (
                <ImagePreviewCard
                  originalImage={originalImageUrl}
                  removedBgImage={removedBgImageUrl}
                  finalImage={finalImageUrl}
                  processingStep={currentProcessingStep}
                />
              )}

              {!originalImageUrl && (
                <Box
                  sx={{
                    height: 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.100',
                    borderRadius: 1,
                    border: '2px dashed',
                    borderColor: 'grey.300',
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <Iconify
                      icon="solar:gallery-bold-duotone"
                      width={64}
                      sx={{ color: 'grey.400', mb: 2 }}
                    />
                    <Typography variant="body1" color="text.secondary">
                      Upload hình ảnh để xem preview
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
