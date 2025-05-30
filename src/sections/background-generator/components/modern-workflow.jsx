'use client';

import { useState, useCallback } from 'react';

import {
  Box,
  Card,
  Grid,
  Step,
  Button,
  Stepper,
  StepLabel,
  Typography,
  CardContent,
  LinearProgress,
  Stack,
  Chip,
  Fade,
  Paper,
  alpha,
  useTheme,
  useMediaQuery,
} from '@mui/material';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { ImageUploadZone } from './image-upload-zone';
import { BackgroundStyleSelector } from './background-style-selector';
import { ImagePreviewPanel } from './image-preview-panel';

// ----------------------------------------------------------------------

const WORKFLOW_STEPS = [
  {
    id: 'upload',
    label: 'Upload Ảnh',
    description: 'Tải lên hình ảnh sản phẩm',
    icon: 'solar:upload-bold-duotone',
    color: 'info',
  },
  {
    id: 'remove-bg',
    label: 'Xóa Background',
    description: 'AI tự động xóa background',
    icon: 'solar:eraser-bold-duotone',
    color: 'warning',
  },
  {
    id: 'choose-style',
    label: 'Chọn Style',
    description: 'Chọn style hoặc tùy chỉnh prompt',
    icon: 'solar:palette-bold-duotone',
    color: 'primary',
  },
  {
    id: 'generate',
    label: 'Tạo Background',
    description: 'AI tạo background mới',
    icon: 'solar:magic-stick-3-bold-duotone',
    color: 'success',
  },
];

// ----------------------------------------------------------------------

export function ModernWorkflow({
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
  uploadedImageUrl = null,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Helper functions to check step completion
  const isStepCompleted = useCallback((stepIndex) => {
    switch (stepIndex) {
      case 0: // Upload
        return Boolean(uploadedImageUrl);
      case 1: // Remove Background
        return Boolean(removedBgImageUrl);
      case 2: // Choose Style
        return Boolean(selectedStyle || customPrompt?.trim());
      case 3: // Generate Background
        return Boolean(finalImage);
      default:
        return false;
    }
  }, [uploadedImageUrl, removedBgImageUrl, selectedStyle, customPrompt, finalImage]);

  // Calculate overall progress
  const overallProgress = Math.round(
    (WORKFLOW_STEPS.filter((_, index) => isStepCompleted(index)).length / WORKFLOW_STEPS.length) * 100
  );

  // Get current processing step
  const getProcessingStep = () => {
    if (isUploading) return 'Đang upload hình ảnh...';
    if (isRemovingBg) return 'Đang xóa background...';
    if (isGenerating) return 'Đang tạo background mới...';
    return null;
  };

  const isProcessing = isUploading || isRemovingBg || isGenerating;
  const processingStep = getProcessingStep();

  // Handle file upload
  const handleFileUpload = useCallback(async (file) => {
    try {
      await onUploadImage(file);
    } catch (error) {
      toast.error(`Lỗi upload: ${error.message}`);
    }
  }, [onUploadImage]);

  // Handle remove background
  const handleRemoveBackground = useCallback(async () => {
    try {
      await onRemoveBackground();
    } catch (error) {
      toast.error(`Lỗi xóa background: ${error.message}`);
    }
  }, [onRemoveBackground]);

  // Handle generate background
  const handleGenerateBackground = useCallback(async () => {
    try {
      await onGenerateBackground();
    } catch (error) {
      toast.error(`Lỗi tạo background: ${error.message}`);
    }
  }, [onGenerateBackground]);

  return (
    <Box>
      {/* Progress Header */}
      <Card
        sx={{
          mb: 4,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box>
              <Typography variant="h5" fontWeight={700} color="primary.main">
                Background Generator
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tạo background chuyên nghiệp cho sản phẩm với AI
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h4" fontWeight={700} color="primary.main">
                {overallProgress}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Hoàn thành
              </Typography>
            </Box>
          </Box>

          <LinearProgress
            variant="determinate"
            value={overallProgress}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
              },
            }}
          />

          {/* Processing Status */}
          {isProcessing && (
            <Fade in={true}>
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: 'warning.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      animation: 'pulse 2s infinite',
                      '@keyframes pulse': {
                        '0%': { transform: 'scale(1)' },
                        '50%': { transform: 'scale(1.1)' },
                        '100%': { transform: 'scale(1)' },
                      },
                    }}
                  >
                    <Iconify icon="solar:settings-bold" width={16} sx={{ color: 'white' }} />
                  </Box>
                  <Typography variant="subtitle2" color="warning.dark" fontWeight={600}>
                    {processingStep}
                  </Typography>
                </Stack>
              </Box>
            </Fade>
          )}
        </CardContent>
      </Card>

      {/* Modern Stepper */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Stepper
            activeStep={currentStep}
            alternativeLabel={!isMobile}
            orientation={isMobile ? 'vertical' : 'horizontal'}
            sx={{
              '& .MuiStepLabel-root': {
                cursor: 'pointer',
              },
              '& .MuiStepIcon-root': {
                width: 40,
                height: 40,
                '&.Mui-active': {
                  color: theme.palette.primary.main,
                },
                '&.Mui-completed': {
                  color: theme.palette.success.main,
                },
              },
            }}
          >
            {WORKFLOW_STEPS.map((step, index) => {
              const isCompleted = isStepCompleted(index);
              const isActive = currentStep === index;
              const stepColor = step.color;

              return (
                <Step key={step.id} completed={isCompleted}>
                  <StepLabel
                    onClick={() => onGoToStep && onGoToStep(index)}
                    StepIconComponent={() => (
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: isCompleted
                            ? 'success.main'
                            : isActive
                            ? `${stepColor}.main`
                            : 'grey.300',
                          color: isCompleted || isActive ? 'white' : 'grey.600',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          '&:hover': {
                            transform: 'scale(1.1)',
                          },
                        }}
                      >
                        {isCompleted ? (
                          <Iconify icon="solar:check-circle-bold" width={20} />
                        ) : (
                          <Iconify icon={step.icon} width={20} />
                        )}
                      </Box>
                    )}
                  >
                    <Box sx={{ textAlign: isMobile ? 'left' : 'center' }}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        color={isActive ? `${stepColor}.main` : 'text.primary'}
                      >
                        {step.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {step.description}
                      </Typography>
                    </Box>
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Left Column - Controls */}
        <Grid item xs={12} md={6}>
          <Stack spacing={3}>
            {/* Step Content */}
            {currentStep === 0 && (
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Iconify icon="solar:upload-bold-duotone" width={24} sx={{ mr: 2, color: 'info.main' }} />
                    <Typography variant="h6" fontWeight={600}>
                      Upload Hình Ảnh Sản Phẩm
                    </Typography>
                  </Box>
                  <ImageUploadZone
                    onUpload={handleFileUpload}
                    disabled={isUploading}
                  />

                  {uploadError && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'error.lighter', borderRadius: 1 }}>
                      <Typography variant="body2" color="error.main">
                        {uploadError}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}

            {currentStep === 1 && (
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Iconify icon="solar:eraser-bold-duotone" width={24} sx={{ mr: 2, color: 'warning.main' }} />
                    <Typography variant="h6" fontWeight={600}>
                      Xóa Background Tự Động
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    AI sẽ tự động phát hiện và xóa background khỏi hình ảnh của bạn
                  </Typography>

                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={handleRemoveBackground}
                    disabled={isRemovingBg || !uploadedImageUrl}
                    startIcon={<Iconify icon="solar:eraser-bold" />}
                    sx={{
                      height: 56,
                      borderRadius: 2,
                      fontWeight: 600,
                      background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.warning.dark} 0%, ${theme.palette.warning.main} 100%)`,
                      },
                    }}
                  >
                    {isRemovingBg ? 'Đang xử lý...' : 'Xóa Background'}
                  </Button>

                  {removeBgError && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'error.lighter', borderRadius: 1 }}>
                      <Typography variant="body2" color="error.main">
                        {removeBgError}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Iconify icon="solar:palette-bold-duotone" width={24} sx={{ mr: 2, color: 'primary.main' }} />
                    <Typography variant="h6" fontWeight={600}>
                      Chọn Style Background
                    </Typography>
                  </Box>

                  <BackgroundStyleSelector
                    selectedStyle={selectedStyle}
                    onStyleSelect={onStyleSelect}
                    customPrompt={customPrompt}
                    onCustomPromptChange={onCustomPromptChange}
                    disabled={isProcessing}
                  />
                </CardContent>
              </Card>
            )}

            {currentStep === 3 && (
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Iconify icon="solar:magic-stick-3-bold-duotone" width={24} sx={{ mr: 2, color: 'success.main' }} />
                    <Typography variant="h6" fontWeight={600}>
                      Tạo Background Mới
                    </Typography>
                  </Box>

                  {!finalImage ? (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        AI sẽ tạo background mới dựa trên style bạn đã chọn
                      </Typography>

                      <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        onClick={handleGenerateBackground}
                        disabled={isGenerating || (!selectedStyle && !customPrompt?.trim())}
                        startIcon={<Iconify icon="solar:magic-stick-3-bold" />}
                        sx={{
                          height: 56,
                          borderRadius: 2,
                          fontWeight: 600,
                          background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                          '&:hover': {
                            background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`,
                          },
                        }}
                      >
                        {isGenerating ? 'Đang tạo...' : 'Tạo Background'}
                      </Button>
                    </>
                  ) : (
                    <Stack spacing={2}>
                      <Box
                        sx={{
                          p: 3,
                          bgcolor: 'success.lighter',
                          borderRadius: 2,
                          border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Iconify icon="solar:check-circle-bold" width={24} sx={{ color: 'success.main' }} />
                          <Typography variant="subtitle1" fontWeight={600} color="success.dark">
                            Background đã được tạo thành công!
                          </Typography>
                        </Stack>
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Button
                            variant="contained"
                            fullWidth
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
                            sx={{ height: 48 }}
                          >
                            Tải Xuống
                          </Button>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Button
                            variant="outlined"
                            fullWidth
                            onClick={onReset}
                            startIcon={<Iconify icon="solar:restart-bold" />}
                            sx={{ height: 48 }}
                          >
                            Tạo Mới
                          </Button>
                        </Grid>
                      </Grid>
                    </Stack>
                  )}

                  {generateError && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'error.lighter', borderRadius: 1 }}>
                      <Typography variant="body2" color="error.main">
                        {generateError}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Navigation Controls */}
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
                  <Button
                    variant="outlined"
                    startIcon={<Iconify icon="solar:arrow-left-bold" />}
                    onClick={onPreviousStep}
                    disabled={currentStep === 0 || isProcessing}
                    sx={{ minWidth: 120 }}
                  >
                    Quay Lại
                  </Button>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Bước {currentStep + 1} / {WORKFLOW_STEPS.length}
                    </Typography>
                    {isStepCompleted(currentStep) && (
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
                    onClick={onNextStep}
                    disabled={!isStepCompleted(currentStep) || currentStep === WORKFLOW_STEPS.length - 1 || isProcessing}
                    sx={{ minWidth: 120 }}
                  >
                    {currentStep === WORKFLOW_STEPS.length - 1 ? 'Hoàn Thành' : 'Tiếp Theo'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Right Column - Preview */}
        <Grid item xs={12} md={6}>
          <Box sx={{ position: 'sticky', top: 20 }}>
            <ImagePreviewPanel
              originalImage={uploadedImage}
              uploadedImageUrl={uploadedImageUrl}
              removedBgImageUrl={removedBgImageUrl}
              finalImageUrl={finalImage}
              isProcessing={isProcessing}
              processingStep={processingStep}
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
