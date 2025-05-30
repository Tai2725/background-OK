'use client';

import { useState, useCallback } from 'react';

import {
  Box,
  Card,
  Step,
  Button,
  Stepper,
  StepLabel,
  Typography,
  CardContent,
  Alert,
  Collapse,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  Stack,
} from '@mui/material';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { DebugLogger } from 'src/utils/debug-logger';

import { ImageUploadZone } from './image-upload-zone';
import { BackgroundStyleSelector } from './background-style-selector';
import { ImagePreviewCard } from './image-preview-card';

// ----------------------------------------------------------------------

const WORKFLOW_STEPS = [
  {
    id: 'upload',
    label: 'Upload Hình Ảnh',
    description: 'Tải lên hình ảnh sản phẩm của bạn',
    icon: 'solar:upload-bold',
  },
  {
    id: 'remove-bg',
    label: 'Xóa Background',
    description: 'Tự động xóa background khỏi hình ảnh',
    icon: 'solar:eraser-bold',
  },
  {
    id: 'choose-prompt',
    label: 'Chọn Prompt',
    description: 'Chọn style hoặc nhập prompt tùy chỉnh',
    icon: 'solar:palette-bold',
  },
  {
    id: 'generate-bg',
    label: 'Tạo Background',
    description: 'AI tạo background mới cho hình ảnh',
    icon: 'solar:magic-stick-3-bold',
  },
];

// ----------------------------------------------------------------------

export function StepWorkflow({
  onUploadImage,
  onRemoveBackground,
  onStyleSelect,
  onCustomPromptChange,
  onGenerateBackground,
  onReset,
  // Navigation handlers
  onNextStep,
  onPreviousStep,
  onGoToStep,
  // State
  currentStep = 0,
  uploadedImage = null,
  uploadedImageUrl = null, // Thêm URL từ Supabase
  removedBgImageUrl = null,
  finalImage = null,
  selectedStyle = null,
  customPrompt = '',
  // Loading states
  isUploading = false,
  isRemovingBg = false,
  isGenerating = false,
  // Error states
  uploadError = null,
  removeBgError = null,
  generateError = null,
}) {
  const [showUploadError, setShowUploadError] = useState(false);
  const [showRemoveBgError, setShowRemoveBgError] = useState(false);
  const [showGenerateError, setShowGenerateError] = useState(false);

  // Helper functions to check step completion
  const isStepCompleted = useCallback((stepIndex) => {
    switch (stepIndex) {
      case 0: // Upload
        return Boolean(uploadedImageUrl);
      case 1: // Remove Background
        return Boolean(removedBgImageUrl);
      case 2: // Choose Prompt
        return Boolean(selectedStyle || customPrompt?.trim());
      case 3: // Generate Background
        return Boolean(finalImage);
      default:
        return false;
    }
  }, [uploadedImageUrl, removedBgImageUrl, selectedStyle, customPrompt, finalImage]);

  const canProceedToStep = useCallback((stepIndex) => {
    // Can always go to step 0
    if (stepIndex === 0) return true;

    // For other steps, check if previous steps are completed
    for (let i = 0; i < stepIndex; i++) {
      if (!isStepCompleted(i)) return false;
    }
    return true;
  }, [isStepCompleted]);

  const isCurrentStepCompleted = isStepCompleted(currentStep);
  const canGoNext = currentStep < WORKFLOW_STEPS.length - 1 && isCurrentStepCompleted;
  const canGoPrevious = currentStep > 0;

  // Handle file upload
  const handleFileUpload = useCallback(async (file) => {
    setShowUploadError(false);
    try {
      await onUploadImage(file);
    } catch (error) {
      setShowUploadError(true);
      toast.error(`Lỗi upload: ${error.message}`);
    }
  }, [onUploadImage]);

  // Handle remove background
  const handleRemoveBackground = useCallback(async () => {
    setShowRemoveBgError(false);
    try {
      await onRemoveBackground();
    } catch (error) {
      setShowRemoveBgError(true);
      toast.error(`Lỗi xóa background: ${error.message}`);
    }
  }, [onRemoveBackground]);

  // Handle generate background
  const handleGenerateBackground = useCallback(async () => {
    setShowGenerateError(false);
    try {
      await onGenerateBackground();
    } catch (error) {
      setShowGenerateError(true);
      toast.error(`Lỗi tạo background: ${error.message}`);
    }
  }, [onGenerateBackground]);

  // Handle retry for each step
  const handleRetry = useCallback((stepId) => {
    switch (stepId) {
      case 'upload':
        setShowUploadError(false);
        // User needs to upload again manually
        break;
      case 'remove-bg':
        handleRemoveBackground();
        break;
      case 'generate-bg':
        handleGenerateBackground();
        break;
      default:
        break;
    }
  }, [handleRemoveBackground, handleGenerateBackground]);

  // Navigation Controls Component
  const NavigationControls = () => {
    const handlePrevious = () => {
      DebugLogger.navigation.previousStep(currentStep, currentStep - 1);
      if (onPreviousStep) {
        onPreviousStep();
      } else {
        DebugLogger.warn('onPreviousStep handler not provided');
      }
    };

    const handleNext = () => {
      DebugLogger.navigation.nextStep(currentStep, currentStep + 1, canGoNext);
      DebugLogger.info('Step completion status', { isCurrentStepCompleted, canGoNext });
      if (onNextStep) {
        onNextStep();
      } else {
        DebugLogger.warn('onNextStep handler not provided');
      }
    };

    return (
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:arrow-left-bold" />}
              onClick={handlePrevious}
              disabled={!canGoPrevious || isUploading || isRemovingBg || isGenerating}
            >
              Quay Lại
            </Button>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Bước {currentStep + 1} / {WORKFLOW_STEPS.length}
              </Typography>
              {isCurrentStepCompleted && (
                <Chip
                  size="small"
                  label="Hoàn thành"
                  color="success"
                  icon={<Iconify icon="solar:check-circle-bold" width={16} />}
                />
              )}
            </Box>

            <Button
              variant="contained"
              endIcon={<Iconify icon="solar:arrow-right-bold" />}
              onClick={() => {
                // Xử lý đặc biệt cho bước chọn prompt
                if (currentStep === 2 && (selectedStyle || customPrompt?.trim())) {
                  toast.success('Đã cập nhật prompt và chuyển đến bước tiếp theo');
                }
                handleNext();
              }}
              disabled={!canGoNext || isUploading || isRemovingBg || isGenerating}
            >
              {currentStep === 2 ? 'Xác Nhận Prompt & Tiếp Theo' :
               currentStep === WORKFLOW_STEPS.length - 1 ? 'Hoàn Thành' : 'Tiếp Theo'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  // Unified Step Layout Component
  const StepLayout = ({ step, children, isActive = false }) => (
    <Card sx={{ mb: 3, border: isActive ? 2 : 1, borderColor: isActive ? 'primary.main' : 'divider' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: isActive ? 'primary.main' : 'grey.300',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
            }}
          >
            <Iconify
              icon={step.icon}
              width={20}
              sx={{ color: isActive ? 'white' : 'grey.600' }}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ color: isActive ? 'primary.main' : 'text.primary' }}>
              {step.label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {step.description}
            </Typography>
          </Box>
          {isStepCompleted(WORKFLOW_STEPS.findIndex(s => s.id === step.id)) && (
            <Chip
              size="small"
              label="Hoàn thành"
              color="success"
              icon={<Iconify icon="solar:check-circle-bold" width={16} />}
            />
          )}
        </Box>
        {children}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Progress Stepper */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={currentStep} alternativeLabel>
            {WORKFLOW_STEPS.map((step, index) => {
              const isCompleted = isStepCompleted(index);
              const hasError =
                (index === 0 && uploadError) ||
                (index === 1 && removeBgError) ||
                (index === 3 && generateError);
              const isClickable = canProceedToStep(index);

              return (
                <Step key={step.id} completed={isCompleted}>
                  <StepLabel
                    error={hasError}
                    onClick={() => {
                      DebugLogger.navigation.stepClick(index, step.label, isClickable);
                      if (isClickable && onGoToStep) {
                        DebugLogger.info('Navigating to step', { from: currentStep, to: index });
                        onGoToStep(index);
                      } else {
                        DebugLogger.warn('Cannot navigate to step', {
                          isClickable,
                          hasHandler: !!onGoToStep,
                          canProceed: canProceedToStep(index)
                        });
                      }
                    }}
                    sx={{
                      cursor: isClickable ? 'pointer' : 'default',
                      '& .MuiStepLabel-label': {
                        color: isClickable ? 'primary.main' : 'text.disabled',
                        '&:hover': {
                          color: isClickable ? 'primary.dark' : 'text.disabled',
                        },
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Iconify icon={step.icon} width={20} />
                      <Typography variant="subtitle2">{step.label}</Typography>
                      {isCompleted && (
                        <Iconify icon="solar:check-circle-bold" width={16} color="success.main" />
                      )}
                    </Box>
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </CardContent>
      </Card>

      {/* Step 1: Upload Image */}
      {currentStep === 0 && (
        <StepLayout step={WORKFLOW_STEPS[0]} isActive={true}>
          <ImageUploadZone
            onUpload={handleFileUpload}
            disabled={isUploading}
          />

            {/* Upload Success - Show Supabase URL */}
            {uploadedImageUrl && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'success.lighter', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Iconify icon="solar:check-circle-bold" sx={{ color: 'success.main', mr: 1 }} />
                  <Typography variant="subtitle2" color="success.dark">
                    Upload thành công!
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="caption" color="text.secondary">
                    URL Supabase:
                  </Typography>
                  <Chip
                    label={uploadedImageUrl.length > 50 ? `${uploadedImageUrl.substring(0, 50)}...` : uploadedImageUrl}
                    size="small"
                    variant="outlined"
                    sx={{
                      maxWidth: '100%',
                      '& .MuiChip-label': {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }
                    }}
                  />
                  <Tooltip title="Copy URL">
                    <IconButton
                      size="small"
                      onClick={() => {
                        navigator.clipboard.writeText(uploadedImageUrl);
                        toast.success('Đã copy URL!');
                      }}
                    >
                      <Iconify icon="solar:copy-bold" width={16} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Mở trong tab mới">
                    <IconButton
                      size="small"
                      onClick={() => window.open(uploadedImageUrl, '_blank')}
                    >
                      <Iconify icon="solar:external-link-bold" width={16} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            )}

            {/* Upload Error */}
            <Collapse in={showUploadError || Boolean(uploadError)}>
              <Alert
                severity="error"
                sx={{ mt: 2 }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => handleRetry('upload')}
                  >
                    Thử Lại
                  </Button>
                }
              >
                {uploadError || 'Có lỗi xảy ra khi upload hình ảnh'}
              </Alert>
            </Collapse>
        </StepLayout>
      )}

      {/* Step 2: Remove Background */}
      {currentStep === 1 && (
        <StepLayout step={WORKFLOW_STEPS[1]} isActive={true}>
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleRemoveBackground}
            disabled={isRemovingBg}
            startIcon={<Iconify icon="solar:eraser-bold" />}
            sx={{ mb: 2 }}
          >
            {isRemovingBg ? 'Đang xóa background...' : 'Xóa Background'}
          </Button>

            {/* Remove Background Error */}
            <Collapse in={showRemoveBgError || Boolean(removeBgError)}>
              <Alert
                severity="error"
                sx={{ mt: 2 }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => handleRetry('remove-bg')}
                  >
                    Thử Lại
                  </Button>
                }
              >
                {removeBgError || 'Có lỗi xảy ra khi xóa background'}
              </Alert>
            </Collapse>
        </StepLayout>
      )}

      {/* Step 3: Choose Prompt */}
      {currentStep === 2 && (
        <StepLayout step={WORKFLOW_STEPS[2]} isActive={true}>
          <BackgroundStyleSelector
            selectedStyle={selectedStyle}
            onStyleSelect={onStyleSelect}
            customPrompt={customPrompt}
            onCustomPromptChange={onCustomPromptChange}
          />

            {/* Selected Prompt Editor - Now integrated into BackgroundStyleSelector */}
        </StepLayout>
      )}

      {/* Step 4: Generate Background */}
      {currentStep === 3 && (
        <StepLayout step={WORKFLOW_STEPS[3]} isActive={true}>
          {!finalImage && (
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleGenerateBackground}
              disabled={isGenerating || (!selectedStyle && !customPrompt)}
              startIcon={<Iconify icon="solar:magic-stick-3-bold" />}
              sx={{ mb: 2 }}
            >
              {isGenerating ? 'Đang tạo background...' : 'Tạo Background'}
            </Button>
          )}

            {finalImage && (
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = finalImage;
                    link.download = `background-generated-${Date.now()}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast.success('Tải xuống thành công!');
                  }}
                  startIcon={<Iconify icon="solar:download-bold" />}
                  sx={{ flex: 1 }}
                >
                  Tải Xuống
                </Button>
                <Button
                  variant="outlined"
                  onClick={onReset}
                  startIcon={<Iconify icon="solar:restart-bold" />}
                  sx={{ flex: 1 }}
                >
                  Tạo Mới
                </Button>
              </Box>
            )}

            {/* Generate Background Error */}
            <Collapse in={showGenerateError || Boolean(generateError)}>
              <Alert
                severity="error"
                sx={{ mt: 2 }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => handleRetry('generate-bg')}
                  >
                    Thử Lại
                  </Button>
                }
              >
                {generateError || 'Có lỗi xảy ra khi tạo background'}
              </Alert>
            </Collapse>
        </StepLayout>
      )}

      {/* Navigation Controls */}
      <NavigationControls />

      {/* Unified Preview Card - Always Visible */}
      <Card sx={{ mt: 3, position: 'sticky', top: 20 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Iconify icon="solar:gallery-bold" sx={{ mr: 2, color: 'info.main' }} />
            <Typography variant="h6">
              Preview - Bước {currentStep + 1}: {WORKFLOW_STEPS[currentStep].label}
            </Typography>
          </Box>

          <ImagePreviewCard
            originalImage={uploadedImage}
            originalImageUrl={uploadedImageUrl}
            removedBgImage={removedBgImageUrl}
            finalImage={finalImage}
            processingStep={
              isUploading ? 'uploading' :
              isRemovingBg ? 'removing_bg' :
              isGenerating ? 'generating_bg' :
              null
            }
          />

          {/* Step-specific preview info */}
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {currentStep === 0 && 'Upload hình ảnh để bắt đầu quá trình xử lý'}
              {currentStep === 1 && 'Xem kết quả sau khi xóa background'}
              {currentStep === 2 && 'Chọn style để preview background mới'}
              {currentStep === 3 && 'Kết quả cuối cùng với background mới'}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
