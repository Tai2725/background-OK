'use client';

import { useState } from 'react';

import {
  Box,
  Card,
  Stack,
  Button,
  Typography,
  CardContent,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Fade,
  Paper,
  alpha,
  Chip,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';
import { Image } from 'src/components/image';

// ----------------------------------------------------------------------

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`image-tabpanel-${index}`}
      aria-labelledby={`image-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

// ----------------------------------------------------------------------

export function ImagePreviewPanel({
  originalImage,
  uploadedImageUrl,
  removedBgImageUrl,
  finalImageUrl,
  isProcessing,
  processingStep,
}) {
  const [activeTab, setActiveTab] = useState(0);

  // Auto switch tabs based on processing progress
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Download image handler
  const handleDownload = async (imageUrl, filename) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  // Get preview URL for original image
  const originalImageUrl = originalImage ? URL.createObjectURL(originalImage) : null;

  // Determine which tabs to show
  const tabs = [
    {
      label: 'Ảnh Gốc',
      icon: 'solar:gallery-bold',
      available: Boolean(originalImage),
      imageUrl: originalImageUrl,
      filename: 'original-image.png',
    },
    {
      label: 'Đã Xóa BG',
      icon: 'solar:eraser-bold',
      available: Boolean(removedBgImageUrl),
      imageUrl: removedBgImageUrl,
      filename: 'removed-background.png',
    },
    {
      label: 'Kết Quả',
      icon: 'solar:magic-stick-3-bold',
      available: Boolean(finalImageUrl),
      imageUrl: finalImageUrl,
      filename: 'final-result.png',
    },
  ];

  const availableTabs = tabs.filter(tab => tab.available);

  return (
    <Card
      sx={{
        height: 'fit-content',
        minHeight: 600,
        borderRadius: 3,
        boxShadow: (theme) => `0 8px 32px ${alpha(theme.palette.info.main, 0.08)}`,
        border: (theme) => `1px solid ${alpha(theme.palette.info.main, 0.08)}`,
        overflow: 'hidden',
      }}
    >
      <CardContent sx={{ p: 0 }}>
        {/* Header */}
        <Box
          sx={{
            background: (theme) => `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
            p: 3,
            color: 'white',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Iconify icon="solar:gallery-bold-duotone" width={24} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Xem Trước Kết Quả
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Theo dõi quá trình xử lý và xem kết quả
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Processing Status */}
          {isProcessing && (
            <Fade in={true}>
              <Paper
                elevation={0}
                sx={{
                  mb: 3,
                  p: 3,
                  background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.light, 0.05)} 100%)`,
                  border: 2,
                  borderColor: 'warning.main',
                  borderRadius: 3,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Animated Background */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: (theme) => `linear-gradient(45deg, transparent 30%, ${alpha(theme.palette.warning.main, 0.05)} 50%, transparent 70%)`,
                    animation: 'shimmer 2s infinite',
                    '@keyframes shimmer': {
                      '0%': { transform: 'translateX(-100%)' },
                      '100%': { transform: 'translateX(100%)' },
                    },
                  }}
                />

                <Stack direction="row" alignItems="center" spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: 'warning.main',
                      color: 'white',
                      animation: 'pulse 2s infinite',
                      '@keyframes pulse': {
                        '0%': { transform: 'scale(1)' },
                        '50%': { transform: 'scale(1.1)' },
                        '100%': { transform: 'scale(1)' },
                      },
                    }}
                  >
                    <CircularProgress size={20} sx={{ color: 'white' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600} color="warning.main">
                      {processingStep}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Đang xử lý, vui lòng chờ...
                    </Typography>
                  </Box>
                  <Chip
                    label="Đang xử lý"
                    size="small"
                    color="warning"
                    variant="filled"
                    sx={{
                      fontWeight: 600,
                      borderRadius: 2,
                      animation: 'blink 1.5s infinite',
                      '@keyframes blink': {
                        '0%, 50%': { opacity: 1 },
                        '51%, 100%': { opacity: 0.7 },
                      },
                    }}
                  />
                </Stack>
              </Paper>
            </Fade>
          )}

          {/* Tabs */}
          {availableTabs.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                mb: 3,
                borderRadius: 2,
                overflow: 'hidden',
                border: 1,
                borderColor: 'divider',
              }}
            >
              <Tabs
                value={Math.min(activeTab, availableTabs.length - 1)}
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{
                  '& .MuiTabs-indicator': {
                    height: 3,
                    borderRadius: '3px 3px 0 0',
                  },
                }}
              >
                {availableTabs.map((tab, index) => (
                  <Tab
                    key={tab.label}
                    label={tab.label}
                    icon={<Iconify icon={tab.icon} width={20} />}
                    iconPosition="start"
                    sx={{
                      minHeight: 56,
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      '&.Mui-selected': {
                        color: 'primary.main',
                        fontWeight: 700,
                      },
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  />
                ))}
              </Tabs>
            </Paper>
          )}

          {/* Tab Panels */}
        {availableTabs.map((tab, index) => (
          <TabPanel key={tab.label} value={Math.min(activeTab, availableTabs.length - 1)} index={index}>
            <Stack spacing={2}>
              {/* Image Display */}
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: 400,
                  bgcolor: 'grey.100',
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: 1,
                  borderColor: 'divider',
                }}
              >
                {tab.imageUrl ? (
                  <Image
                    src={tab.imageUrl}
                    alt={tab.label}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: 'text.secondary',
                    }}
                  >
                    <Stack alignItems="center" spacing={1}>
                      <Iconify icon="solar:gallery-bold" width={48} />
                      <Typography variant="body2">Chưa có hình ảnh</Typography>
                    </Stack>
                  </Box>
                )}

                {/* Download Button */}
                {tab.imageUrl && (
                  <Tooltip title="Tải xuống">
                    <IconButton
                      onClick={() => handleDownload(tab.imageUrl, tab.filename)}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'background.paper',
                        boxShadow: 1,
                        '&:hover': {
                          bgcolor: 'background.paper',
                          boxShadow: 2,
                        },
                      }}
                    >
                      <Iconify icon="solar:download-bold" width={20} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>

              {/* Image Info */}
              {tab.imageUrl && (
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                    border: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    📋 Thông Tin Ảnh
                  </Typography>
                  <Stack spacing={0.5}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Loại:</strong> {tab.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Định dạng:</strong> PNG
                    </Typography>
                    {originalImage && tab.label === 'Ảnh Gốc' && (
                      <>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Kích thước:</strong> {(originalImage.size / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Tên file:</strong> {originalImage.name}
                        </Typography>
                      </>
                    )}
                  </Stack>
                </Box>
              )}
            </Stack>
          </TabPanel>
        ))}

          {/* Empty State */}
          {availableTabs.length === 0 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 400,
                bgcolor: 'grey.50',
                borderRadius: 2,
                border: 2,
                borderStyle: 'dashed',
                borderColor: 'grey.300',
              }}
            >
              <Stack alignItems="center" spacing={2}>
                <Iconify icon="solar:gallery-bold" width={64} color="text.disabled" />
                <Typography variant="h6" color="text.secondary">
                  Chưa có hình ảnh
                </Typography>
                <Typography variant="body2" color="text.disabled" textAlign="center">
                  Upload hình ảnh và chọn style để bắt đầu tạo background
                </Typography>
              </Stack>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
