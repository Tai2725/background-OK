'use client';

import { useCallback, useState } from 'react';

import {
  Box,
  Card,
  Grid,
  Step,
  Chip,
  Fade,
  Stack,
  alpha,
  Button,
  Stepper,
  useTheme,
  StepLabel,
  Typography,
  CardContent,
  useMediaQuery,
  LinearProgress,
  Collapse,
  IconButton,
  Container,
  Paper,
  CircularProgress,
} from '@mui/material';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { ImageUploadZone } from './image-upload-zone';
import { ImagePreviewPanel } from './image-preview-panel';
import { BackgroundStyleSelector } from './background-style-selector';

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
  const isStepCompleted = useCallback(
    (stepIndex) => {
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
    },
    [uploadedImageUrl, removedBgImageUrl, selectedStyle, customPrompt, finalImage]
  );

  // Calculate overall progress
  const overallProgress = Math.round(
    (WORKFLOW_STEPS.filter((_, index) => isStepCompleted(index)).length / WORKFLOW_STEPS.length) *
      100
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
  const handleFileUpload = useCallback(
    async (file) => {
      try {
        await onUploadImage(file);
        // Sau khi upload thành công, hiển thị preview và thay đổi nút
        toast.success('Upload thành công! Bấm "Xóa Background" để tiếp tục.');
      } catch (error) {
        toast.error(`Lỗi upload: ${error.message}`);
      }
    },
    [onUploadImage]
  );

  // Handle remove background
  const handleRemoveBackground = useCallback(async () => {
    try {
      // Auto navigate to step 2 immediately when starting the process
      if (onNextStep) onNextStep();

      // Then start the background removal process
      await onRemoveBackground();
    } catch (error) {
      toast.error(`Lỗi xóa background: ${error.message}`);
    }
  }, [onRemoveBackground, onNextStep]);

  // Handle generate background
  const handleGenerateBackground = useCallback(async () => {
    try {
      await onGenerateBackground();
    } catch (error) {
      toast.error(`Lỗi tạo background: ${error.message}`);
    }
  }, [onGenerateBackground]);

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* Compact Header với Z-pattern layout */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 2,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.light, 0.03)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
          borderRadius: 3,
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
        >
          {/* Left: Title */}
          <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            <Typography variant="h6" fontWeight={600} color="primary.main" sx={{ mb: 0.5 }}>
              Background Generator
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Tạo background chuyên nghiệp với AI
            </Typography>
          </Box>

          {/* Center: Compact Progress */}
          <Box sx={{ flex: { md: 1 }, mx: { md: 3 }, maxWidth: { md: 200 } }}>
            <Stack direction="row" alignItems="center" justifyContent={{ xs: 'center', md: 'flex-start' }} spacing={1} sx={{ mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Bước {currentStep + 1}/{WORKFLOW_STEPS.length}
              </Typography>
              <Typography variant="caption" fontWeight={600} color="primary.main">
                {overallProgress}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={overallProgress}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                },
              }}
            />
          </Box>

          {/* Right: Processing Status */}
          <Box sx={{ minWidth: { md: 200 }, textAlign: { xs: 'center', md: 'right' } }}>
            {isProcessing ? (
              <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
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
                  <Iconify icon="solar:settings-bold" width={12} sx={{ color: 'white' }} />
                </Box>
                <Typography variant="caption" color="warning.dark" fontWeight={500}>
                  {processingStep}
                </Typography>
              </Stack>
            ) : (
              <Typography variant="caption" color="success.main" fontWeight={500}>
                {overallProgress === 100 ? '✓ Hoàn thành' : 'Sẵn sàng'}
              </Typography>
            )}
          </Box>
        </Stack>
      </Paper>

      {/* Compact Step Navigation */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 2,
          border: `1px solid ${alpha(theme.palette.grey[300], 0.5)}`,
          borderRadius: 3,
        }}
      >
        <Grid container spacing={1}>
          {WORKFLOW_STEPS.map((step, index) => {
            const isCompleted = isStepCompleted(index);
            const isActive = currentStep === index;
            const stepColor = step.color;

            return (
              <Grid item xs={6} sm={6} md={3} key={step.id}>
                <Box
                  onClick={() => onGoToStep && onGoToStep(index)}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    bgcolor: isActive
                      ? `${stepColor}.lighter`
                      : isCompleted
                        ? 'success.lighter'
                        : 'transparent',
                    border: 1,
                    borderColor: isActive
                      ? `${stepColor}.main`
                      : isCompleted
                        ? 'success.main'
                        : 'transparent',
                    '&:hover': {
                      bgcolor: isActive
                        ? `${stepColor}.lighter`
                        : isCompleted
                          ? 'success.lighter'
                          : 'grey.50',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    {/* Step Icon */}
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
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
                        flexShrink: 0,
                      }}
                    >
                      {isCompleted ? (
                        <Iconify icon="solar:check-circle-bold" width={16} />
                      ) : (
                        <Iconify icon={step.icon} width={16} />
                      )}
                    </Box>

                    {/* Step Info */}
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        color={isActive ? `${stepColor}.main` : isCompleted ? 'success.main' : 'text.primary'}
                        sx={{ lineHeight: 1.2, mb: 0.5 }}
                      >
                        {step.label}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {step.description}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Main Content - Responsive Layout */}
      <Grid container spacing={3}>
        {/* Left Column - Primary Actions */}
        <Grid item xs={12} md={8} lg={8}>
          <Stack spacing={3}>
            {/* Step Content - Optimized for F-pattern */}
            {currentStep === 0 && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.info.main, 0.02),
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: 'info.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Iconify icon="solar:upload-bold" width={20} sx={{ color: 'white' }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={600} color="info.main">
                      Upload Hình Ảnh
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Chọn hình ảnh sản phẩm để bắt đầu
                    </Typography>
                  </Box>
                </Stack>

                <ImageUploadZone onUpload={handleFileUpload} disabled={isUploading} />

                {uploadError && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'error.lighter', borderRadius: 2 }}>
                    <Typography variant="body2" color="error.main">
                      {uploadError}
                    </Typography>
                  </Box>
                )}
              </Paper>
            )}

            {currentStep === 1 && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.warning.main, 0.02),
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: 'warning.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Iconify icon="solar:eraser-bold" width={20} sx={{ color: 'white' }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={600} color="warning.main">
                      Xóa Background
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      AI tự động phát hiện và xóa background
                    </Typography>
                  </Box>
                </Stack>

                {!removedBgImageUrl ? (
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={handleRemoveBackground}
                    disabled={isRemovingBg || !uploadedImageUrl}
                    startIcon={
                      isRemovingBg ? (
                        <CircularProgress size={20} sx={{ color: 'white' }} />
                      ) : (
                        <Iconify icon="solar:eraser-bold" />
                      )
                    }
                    sx={{
                      height: 56,
                      borderRadius: 3,
                      fontWeight: 600,
                      fontSize: '1rem',
                      background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
                      boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.3)}`,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.warning.dark} 0%, ${theme.palette.warning.main} 100%)`,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 6px 16px ${alpha(theme.palette.warning.main, 0.4)}`,
                      },
                      '&:disabled': {
                        background: 'grey.300',
                        color: 'grey.600',
                      },
                    }}
                  >
                    {isRemovingBg ? 'Đang xóa background...' : 'Xóa Background'}
                  </Button>
                ) : (
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        p: 2.5,
                        bgcolor: 'success.lighter',
                        borderRadius: 3,
                        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Iconify
                          icon="solar:check-circle-bold"
                          width={24}
                          sx={{ color: 'success.main' }}
                        />
                        <Typography variant="subtitle1" fontWeight={600} color="success.dark">
                          Background đã được xóa thành công!
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>
                )}

                {/* Loading animation when removing background */}
                {isRemovingBg && (
                  <Fade in={isRemovingBg}>
                    <Box
                      sx={{
                        mt: 3,
                        p: 3,
                        bgcolor: alpha(theme.palette.warning.main, 0.05),
                        borderRadius: 3,
                        border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                        textAlign: 'center',
                      }}
                    >
                      <Stack spacing={2} alignItems="center">
                        <Box
                          sx={{
                            position: 'relative',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <CircularProgress
                            size={60}
                            thickness={4}
                            sx={{
                              color: 'warning.main',
                              animationDuration: '2s',
                            }}
                          />
                          <Box
                            sx={{
                              position: 'absolute',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Iconify
                              icon="solar:eraser-bold"
                              width={24}
                              sx={{ color: 'warning.main' }}
                            />
                          </Box>
                        </Box>
                        <Typography variant="h6" fontWeight={600} color="warning.main">
                          AI đang xóa background...
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
                          Quá trình này có thể mất 15-30 giây. Vui lòng đợi trong giây lát.
                        </Typography>
                      </Stack>
                    </Box>
                  </Fade>
                )}

                {removeBgError && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'error.lighter', borderRadius: 2 }}>
                    <Typography variant="body2" color="error.main">
                      {removeBgError}
                    </Typography>
                  </Box>
                )}
              </Paper>
            )}

            {currentStep === 2 && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.primary.main, 0.02),
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Iconify icon="solar:palette-bold" width={20} sx={{ color: 'white' }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={600} color="primary.main">
                      Chọn Style
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Chọn style có sẵn hoặc tùy chỉnh
                    </Typography>
                  </Box>
                </Stack>

                <BackgroundStyleSelector
                  selectedStyle={selectedStyle}
                  onStyleSelect={onStyleSelect}
                  customPrompt={customPrompt}
                  onCustomPromptChange={onCustomPromptChange}
                  disabled={isProcessing}
                />
              </Paper>
            )}

            {currentStep === 3 && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.success.main, 0.02),
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: 'success.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Iconify icon="solar:magic-stick-3-bold" width={20} sx={{ color: 'white' }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={600} color="success.main">
                      Tạo Background
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      AI tạo background theo style đã chọn
                    </Typography>
                  </Box>
                </Stack>

                {!finalImage ? (
                  <Stack spacing={3}>
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      onClick={handleGenerateBackground}
                      disabled={isGenerating || (!selectedStyle && !customPrompt?.trim())}
                      startIcon={
                        isGenerating ? (
                          <CircularProgress size={20} sx={{ color: 'white' }} />
                        ) : (
                          <Iconify icon="solar:magic-stick-3-bold" />
                        )
                      }
                      sx={{
                        height: 56,
                        borderRadius: 3,
                        fontWeight: 600,
                        fontSize: '1rem',
                        background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                        boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.3)}`,
                        '&:hover': {
                          background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`,
                          transform: 'translateY(-2px)',
                          boxShadow: `0 6px 16px ${alpha(theme.palette.success.main, 0.4)}`,
                        },
                        '&:disabled': {
                          background: 'grey.300',
                          color: 'grey.600',
                        },
                      }}
                    >
                      {isGenerating ? 'Đang tạo background...' : 'Tạo Background'}
                    </Button>

                    {/* Beautiful loading animation when generating */}
                    {isGenerating && (
                      <Fade in={isGenerating}>
                        <Box
                          sx={{
                            p: 3,
                            bgcolor: alpha(theme.palette.success.main, 0.05),
                            borderRadius: 3,
                            border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                            textAlign: 'center',
                          }}
                        >
                          <Stack spacing={2} alignItems="center">
                            <Box
                              sx={{
                                position: 'relative',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <CircularProgress
                                size={60}
                                thickness={4}
                                sx={{
                                  color: 'success.main',
                                  animationDuration: '2s',
                                }}
                              />
                              <Box
                                sx={{
                                  position: 'absolute',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Iconify
                                  icon="solar:magic-stick-3-bold"
                                  width={24}
                                  sx={{ color: 'success.main' }}
                                />
                              </Box>
                            </Box>
                            <Typography variant="h6" fontWeight={600} color="success.main">
                              AI đang tạo background...
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
                              Quá trình này có thể mất 30-60 giây. Vui lòng đợi trong giây lát.
                            </Typography>
                          </Stack>
                        </Box>
                      </Fade>
                    )}
                  </Stack>
                ) : (
                  <Stack spacing={3}>
                    <Box
                      sx={{
                        p: 2.5,
                        bgcolor: 'success.lighter',
                        borderRadius: 3,
                        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Iconify
                          icon="solar:check-circle-bold"
                          width={24}
                          sx={{ color: 'success.main' }}
                        />
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
                          sx={{
                            height: 48,
                            borderRadius: 2,
                            fontWeight: 600,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                          }}
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
                          sx={{
                            height: 48,
                            borderRadius: 2,
                            fontWeight: 600,
                            borderColor: 'primary.main',
                            color: 'primary.main',
                            '&:hover': {
                              borderColor: 'primary.dark',
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                            },
                          }}
                        >
                          Tạo Mới
                        </Button>
                      </Grid>
                    </Grid>
                  </Stack>
                )}

                {generateError && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'error.lighter', borderRadius: 2 }}>
                    <Typography variant="body2" color="error.main">
                      {generateError}
                    </Typography>
                  </Box>
                )}
              </Paper>
            )}

            {/* Simplified Navigation */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                border: `1px solid ${alpha(theme.palette.grey[300], 0.5)}`,
                borderRadius: 3,
                bgcolor: 'background.paper',
              }}
            >
              <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
                <Button
                  variant="outlined"
                  startIcon={<Iconify icon="solar:arrow-left-bold" />}
                  onClick={onPreviousStep}
                  disabled={currentStep === 0 || isProcessing}
                  sx={{
                    minWidth: 120,
                    height: 44,
                    borderRadius: 2,
                    fontWeight: 500,
                  }}
                >
                  Quay Lại
                </Button>

                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    {currentStep + 1} / {WORKFLOW_STEPS.length}
                  </Typography>
                  {isStepCompleted(currentStep) && (
                    <Chip
                      size="small"
                      label="✓"
                      color="success"
                      sx={{ height: 24, minWidth: 24, '& .MuiChip-label': { px: 0.5 } }}
                    />
                  )}
                </Stack>

                {/* Dynamic button based on current step and completion status */}
                {currentStep === 0 && uploadedImageUrl ? (
                  // Step 0: After upload success, show "Xóa Background" button
                  <Button
                    variant="contained"
                    color="warning"
                    endIcon={<Iconify icon="solar:eraser-bold" />}
                    onClick={handleRemoveBackground}
                    disabled={isProcessing}
                    sx={{
                      minWidth: 140,
                      height: 44,
                      borderRadius: 2,
                      fontWeight: 600,
                      background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.warning.dark} 0%, ${theme.palette.warning.main} 100%)`,
                      },
                    }}
                  >
                    Xóa Background
                  </Button>
                ) : currentStep === 2 && (selectedStyle || customPrompt?.trim()) ? (
                  // Step 2: After selecting prompt/style, show "Tạo Background" button
                  <Button
                    variant="contained"
                    color="success"
                    endIcon={<Iconify icon="solar:magic-stick-3-bold" />}
                    onClick={() => {
                      // Auto navigate to step 4 first
                      if (onNextStep) {
                        onNextStep();
                        // Start generating after navigation
                        setTimeout(() => {
                          handleGenerateBackground();
                        }, 200);
                      }
                    }}
                    disabled={isProcessing}
                    sx={{
                      minWidth: 140,
                      height: 44,
                      borderRadius: 2,
                      fontWeight: 600,
                      background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`,
                      },
                    }}
                  >
                    Tạo Background
                  </Button>
                ) : (
                  // Default "Tiếp Theo" button for other cases
                  <Button
                    variant="contained"
                    endIcon={<Iconify icon="solar:arrow-right-bold" />}
                    onClick={onNextStep}
                    disabled={
                      !isStepCompleted(currentStep) ||
                      currentStep === WORKFLOW_STEPS.length - 1 ||
                      isProcessing
                    }
                    sx={{
                      minWidth: 120,
                      height: 44,
                      borderRadius: 2,
                      fontWeight: 600,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                      },
                    }}
                  >
                    {currentStep === WORKFLOW_STEPS.length - 1 ? 'Hoàn Thành' : 'Tiếp Theo'}
                  </Button>
                )}
              </Stack>
            </Paper>
          </Stack>
        </Grid>

        {/* Right Column - Compact Preview */}
        <Grid item xs={12} md={4} lg={4}>
          <Box sx={{ position: { xs: 'static', md: 'sticky' }, top: 20 }}>
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
    </Container>
  );
}
