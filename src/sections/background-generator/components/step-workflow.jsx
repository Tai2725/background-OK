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
} from '@mui/material';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

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

  return (
    <Box>
      {/* Progress Stepper */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={currentStep} alternativeLabel>
            {WORKFLOW_STEPS.map((step, index) => (
              <Step key={step.id}>
                <StepLabel
                  error={
                    (index === 0 && uploadError) ||
                    (index === 1 && removeBgError) ||
                    (index === 3 && generateError)
                  }
                >
                  {step.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Step 1: Upload Image */}
      {currentStep === 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Iconify icon="solar:upload-bold" sx={{ mr: 2, color: 'primary.main' }} />
              <Box>
                <Typography variant="h6">Upload Hình Ảnh</Typography>
                <Typography variant="body2" color="text.secondary">
                  Tải lên hình ảnh sản phẩm của bạn để bắt đầu
                </Typography>
              </Box>
            </Box>

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
          </CardContent>
        </Card>
      )}

      {/* Step 2: Remove Background */}
      {currentStep === 1 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Iconify icon="solar:eraser-bold" sx={{ mr: 2, color: 'warning.main' }} />
              <Box>
                <Typography variant="h6">Xóa Background</Typography>
                <Typography variant="body2" color="text.secondary">
                  AI sẽ tự động xóa background khỏi hình ảnh của bạn
                </Typography>
              </Box>
            </Box>

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
          </CardContent>
        </Card>
      )}

      {/* Step 3: Choose Prompt */}
      {currentStep === 2 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Iconify icon="solar:palette-bold" sx={{ mr: 2, color: 'info.main' }} />
              <Box>
                <Typography variant="h6">Chọn Style Background</Typography>
                <Typography variant="body2" color="text.secondary">
                  Chọn style có sẵn hoặc nhập prompt tùy chỉnh
                </Typography>
              </Box>
            </Box>

            <BackgroundStyleSelector
              selectedStyle={selectedStyle}
              onStyleSelect={onStyleSelect}
              customPrompt={customPrompt}
              onCustomPromptChange={onCustomPromptChange}
            />

            {/* Selected Prompt Editor */}
            {(selectedStyle || customPrompt) && (
              <Card sx={{ mt: 3, bgcolor: 'grey.50' }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Iconify icon="solar:edit-bold" width={20} />
                    Chỉnh Sửa Prompt
                  </Typography>

                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={customPrompt || selectedStyle?.prompt || ''}
                    onChange={(e) => onCustomPromptChange?.(e.target.value)}
                    placeholder="Chỉnh sửa prompt để tùy chỉnh background theo ý muốn..."
                    helperText="Bạn có thể chỉnh sửa prompt để tạo ra background phù hợp hơn với nhu cầu"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'background.paper',
                      },
                    }}
                  />

                  <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        if (selectedStyle) {
                          onCustomPromptChange?.(selectedStyle.prompt);
                        }
                      }}
                      disabled={!selectedStyle}
                    >
                      Reset về gốc
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => {
                        // Move to next step when prompt is ready
                        if (customPrompt?.trim() || selectedStyle?.prompt) {
                          // This will be handled by parent component
                        }
                      }}
                      disabled={!customPrompt?.trim() && !selectedStyle?.prompt}
                    >
                      Xác Nhận Prompt
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Generate Background */}
      {currentStep === 3 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Iconify icon="solar:magic-stick-3-bold" sx={{ mr: 2, color: 'success.main' }} />
              <Box>
                <Typography variant="h6">Tạo Background</Typography>
                <Typography variant="body2" color="text.secondary">
                  AI sẽ tạo background mới dựa trên style bạn đã chọn
                </Typography>
              </Box>
            </Box>

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
          </CardContent>
        </Card>
      )}

      {/* Preview Card */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Preview
          </Typography>

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
        </CardContent>
      </Card>
    </Box>
  );
}
