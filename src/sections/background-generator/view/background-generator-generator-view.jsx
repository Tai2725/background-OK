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
import { StepWorkflow } from '../components/step-workflow';
import { DebugLogger } from 'src/utils/debug-logger';

// ----------------------------------------------------------------------

const STEPS = [
  'Upload Hình Ảnh',
  'Xóa Background',
  'Chọn Style Background',
  'Tạo Background',
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
      // Don't auto-advance step - let user click Next
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

    // Don't auto-advance step - let user click Next
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

  // Navigation handlers
  const handleNextStep = useCallback(() => {
    DebugLogger.navigation.nextStep(activeStep, activeStep + 1, activeStep < STEPS.length - 1);
    if (activeStep < STEPS.length - 1) {
      const newStep = activeStep + 1;
      DebugLogger.info('Moving to next step', { from: activeStep, to: newStep });
      setActiveStep(newStep);
    } else {
      DebugLogger.warn('Already at last step', { activeStep, maxSteps: STEPS.length });
    }
  }, [activeStep]);

  const handlePreviousStep = useCallback(() => {
    DebugLogger.navigation.previousStep(activeStep, activeStep - 1);
    if (activeStep > 0) {
      const newStep = activeStep - 1;
      DebugLogger.info('Moving to previous step', { from: activeStep, to: newStep });
      setActiveStep(newStep);
    } else {
      DebugLogger.warn('Already at first step', { activeStep });
    }
  }, [activeStep]);

  const handleGoToStep = useCallback((stepIndex) => {
    DebugLogger.navigation.stepClick(stepIndex, STEPS[stepIndex], true);
    if (stepIndex >= 0 && stepIndex < STEPS.length) {
      DebugLogger.info('Going to specific step', { from: activeStep, to: stepIndex });
      setActiveStep(stepIndex);
    } else {
      DebugLogger.error('Invalid step index', { stepIndex, maxSteps: STEPS.length });
    }
  }, [activeStep]);

  // Separate handlers for individual steps
  const handleRemoveBackground = useCallback(async () => {
    if (!originalImageUrl) {
      toast.error('Vui lòng upload hình ảnh trước');
      return;
    }

    try {
      setError(null);
      setCurrentProcessingStep('removing_bg');
      setProcessingMessage('Đang xóa background...');
      setProcessingProgress(30);

      SessionManager.updateStepStatus(PROCESSING_STEPS.BACKGROUND_REMOVAL, STEP_STATUS.IN_PROGRESS);

      const result = await BackgroundGeneratorService.removeBackgroundOnly(originalImage, user.id, ({ step, message, progress }) => {
        setCurrentProcessingStep(step);
        setProcessingMessage(message);
        setProcessingProgress(progress);
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setRemovedBgImageUrl(result.data.backgroundRemovedUrl);
      SessionManager.updateStepStatus(PROCESSING_STEPS.BACKGROUND_REMOVAL, STEP_STATUS.COMPLETED);
      SessionManager.updateResults({ backgroundRemovedUrl: result.data.backgroundRemovedUrl });

      setCurrentProcessingStep(null);
      setProcessingProgress(0);
      toast.success('Xóa background thành công!');
    } catch (error) {
      console.error('Remove background error:', error);
      SessionManager.updateStepStatus(PROCESSING_STEPS.BACKGROUND_REMOVAL, STEP_STATUS.ERROR, null, error.message);
      setError(`Lỗi xóa background: ${error.message}`);
      setCurrentProcessingStep(null);
      toast.error(`Lỗi xóa background: ${error.message}`);
    }
  }, [originalImage, originalImageUrl, user]);

  const handleGenerateBackground = useCallback(async () => {
    if (!removedBgImageUrl || (!selectedStyle && !customPrompt)) {
      toast.error('Vui lòng hoàn thành các bước trước');
      return;
    }

    try {
      setError(null);
      setCurrentProcessingStep('generating_bg');
      setProcessingMessage('Đang tạo background...');
      setProcessingProgress(60);

      SessionManager.updateStepStatus(PROCESSING_STEPS.BACKGROUND_GENERATION, STEP_STATUS.IN_PROGRESS);

      const prompt = customPrompt || selectedStyle?.prompt || 'professional studio background, clean, minimalist';

      const result = await BackgroundGeneratorService.generateBackground(removedBgImageUrl, {
        prompt,
        style: selectedStyle?.style || 'photographic',
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setFinalImageUrl(result.data.finalUrl);
      SessionManager.updateStepStatus(PROCESSING_STEPS.BACKGROUND_GENERATION, STEP_STATUS.COMPLETED);
      SessionManager.updateResults({ finalImageUrl: result.data.finalUrl });

      setCurrentProcessingStep(null);
      setProcessingProgress(0);
      toast.success('Tạo background thành công!');
    } catch (error) {
      console.error('Generate background error:', error);
      SessionManager.updateStepStatus(PROCESSING_STEPS.BACKGROUND_GENERATION, STEP_STATUS.ERROR, null, error.message);
      setError(`Lỗi tạo background: ${error.message}`);
      setCurrentProcessingStep(null);
      toast.error(`Lỗi tạo background: ${error.message}`);
    }
  }, [removedBgImageUrl, selectedStyle, customPrompt]);

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
        {/* Main Workflow */}
        <Grid item size={{ xs: 12, lg: 8 }}>
          <StepWorkflow
            // Handlers
            onUploadImage={handleImageUpload}
            onRemoveBackground={handleRemoveBackground}
            onStyleSelect={handleStyleSelect}
            onCustomPromptChange={handleCustomPromptChange}
            onGenerateBackground={handleGenerateBackground}
            onReset={handleReset}
            // Navigation handlers
            onNextStep={handleNextStep}
            onPreviousStep={handlePreviousStep}
            onGoToStep={handleGoToStep}
            // State
            currentStep={activeStep}
            uploadedImage={originalImage}
            uploadedImageUrl={originalImageUrl}
            removedBgImageUrl={removedBgImageUrl}
            finalImage={finalImageUrl}
            selectedStyle={selectedStyle}
            customPrompt={customPrompt}
            // Loading states
            isUploading={currentProcessingStep === 'uploading'}
            isRemovingBg={currentProcessingStep === 'removing_bg'}
            isGenerating={currentProcessingStep === 'generating_bg'}
            // Error states
            uploadError={error && currentProcessingStep === 'uploading' ? error : null}
            removeBgError={error && currentProcessingStep === 'removing_bg' ? error : null}
            generateError={error && currentProcessingStep === 'generating_bg' ? error : null}
          />
        </Grid>

        {/* Side Panel - Session Info & Quick Actions */}
        <Grid item size={{ xs: 12, lg: 4 }}>
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
            sx={{ mt: 3 }}
          />

          {/* Quick Actions */}
          {finalImageUrl && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Thao Tác Nhanh
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleDownload}
                    startIcon={<Iconify icon="solar:download-bold" />}
                    fullWidth
                  >
                    Tải Xuống
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleReset}
                    startIcon={<Iconify icon="solar:restart-bold" />}
                    fullWidth
                  >
                    Tạo Mới
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}
