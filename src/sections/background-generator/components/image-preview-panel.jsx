'use client';

import { useState, useEffect } from 'react';

import {
  Box,
  Tab,
  Card,
  Tabs,
  Fade,
  Chip,
  Stack,
  Paper,
  alpha,
  Tooltip,
  Typography,
  IconButton,
  CardContent,
  CircularProgress,
  Collapse,
  useTheme,
  ButtonBase,
} from '@mui/material';

import { Image } from 'src/components/image';
import { Iconify } from 'src/components/iconify';
import { ImageZoomModal } from 'src/components/image-zoom-modal';

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
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [zoomModal, setZoomModal] = useState({ open: false, imageUrl: '', alt: '' });

  // Auto switch tabs based on processing progress
  useEffect(() => {
    // Auto switch to final result tab when background generation is complete
    if (finalImageUrl) {
      // Find the index of "Kết Quả" tab among available tabs
      const availableTabsTemp = [
        { label: 'Ảnh Gốc', available: Boolean(originalImage) },
        { label: 'Đã Xóa BG', available: Boolean(removedBgImageUrl) },
        { label: 'Kết Quả', available: Boolean(finalImageUrl) },
      ].filter((tab) => tab.available);

      const finalTabIndex = availableTabsTemp.findIndex((tab) => tab.label === 'Kết Quả');
      if (finalTabIndex !== -1) {
        setActiveTab(finalTabIndex);
      }
    }
    // Auto switch to removed background tab when background removal is complete
    else if (removedBgImageUrl && !finalImageUrl) {
      const availableTabsTemp = [
        { label: 'Ảnh Gốc', available: Boolean(originalImage) },
        { label: 'Đã Xóa BG', available: Boolean(removedBgImageUrl) },
        { label: 'Kết Quả', available: Boolean(finalImageUrl) },
      ].filter((tab) => tab.available);

      const removedBgTabIndex = availableTabsTemp.findIndex((tab) => tab.label === 'Đã Xóa BG');
      if (removedBgTabIndex !== -1) {
        setActiveTab(removedBgTabIndex);
      }
    }
  }, [finalImageUrl, removedBgImageUrl, originalImage]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Zoom modal handlers
  const handleOpenZoom = (imageUrl, alt) => {
    setZoomModal({ open: true, imageUrl, alt });
  };

  const handleCloseZoom = () => {
    setZoomModal({ open: false, imageUrl: '', alt: '' });
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

  const availableTabs = tabs.filter((tab) => tab.available);

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.grey[300], 0.5)}`,
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      {/* Compact Header với toggle */}
      <Box
        sx={{
          p: 2,
          bgcolor: alpha(theme.palette.info.main, 0.05),
          borderBottom: `1px solid ${alpha(theme.palette.grey[300], 0.3)}`,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 2,
                bgcolor: 'info.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Iconify icon="solar:gallery-bold" width={16} sx={{ color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={600} color="info.main">
                Xem Trước
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {availableTabs.length} giai đoạn
              </Typography>
            </Box>
          </Stack>

          <IconButton
            size="small"
            onClick={() => setIsCollapsed(!isCollapsed)}
            sx={{
              bgcolor: alpha(theme.palette.info.main, 0.1),
              '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.2) },
            }}
          >
            <Iconify
              icon={isCollapsed ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
              width={16}
              sx={{ color: 'info.main' }}
            />
          </IconButton>
        </Stack>
      </Box>

      {/* Collapsible Content */}
      <Collapse in={!isCollapsed}>
        <Box sx={{ p: 2 }}>
          {/* Compact Processing Status */}
          {isProcessing && (
            <Fade in>
              <Box
                sx={{
                  mb: 2,
                  p: 2,
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
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
                    <CircularProgress size={12} sx={{ color: 'white' }} />
                  </Box>
                  <Typography variant="body2" fontWeight={500} color="warning.dark">
                    {processingStep}
                  </Typography>
                </Stack>
              </Box>
            </Fade>
          )}

          {/* Compact Tab Buttons */}
          {availableTabs.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              {availableTabs.map((tab, index) => (
                <ButtonBase
                  key={tab.label}
                  onClick={() => setActiveTab(index)}
                  sx={{
                    flex: 1,
                    p: 1.5,
                    borderRadius: 2,
                    border: 1,
                    borderColor: activeTab === index ? 'primary.main' : 'grey.300',
                    bgcolor: activeTab === index ? 'primary.lighter' : 'transparent',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                    },
                  }}
                >
                  <Stack alignItems="center" spacing={0.5}>
                    <Iconify
                      icon={tab.icon}
                      width={16}
                      sx={{
                        color: activeTab === index ? 'primary.main' : 'text.secondary',
                      }}
                    />
                    <Typography
                      variant="caption"
                      fontWeight={activeTab === index ? 600 : 500}
                      color={activeTab === index ? 'primary.main' : 'text.secondary'}
                    >
                      {tab.label}
                    </Typography>
                  </Stack>
                </ButtonBase>
              ))}
            </Stack>
          )}

          {/* Compact Image Display */}
          {availableTabs.length > 0 && (
            <Box>
              {availableTabs.map((tab, index) => (
                <Box
                  key={tab.label}
                  sx={{
                    display: activeTab === index ? 'block' : 'none',
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      height: 300,
                      bgcolor: 'grey.50',
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: 1,
                      borderColor: 'grey.300',
                    }}
                  >
                    {tab.imageUrl ? (
                      <ButtonBase
                        onClick={() => handleOpenZoom(tab.imageUrl, tab.label)}
                        sx={{
                          width: '100%',
                          height: '100%',
                          display: 'block',
                          position: 'relative',
                          '&:hover .zoom-overlay': {
                            opacity: 1,
                          },
                        }}
                      >
                        <Image
                          src={tab.imageUrl}
                          alt={tab.label}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                          }}
                        />

                        {/* Zoom Overlay */}
                        <Box
                          className="zoom-overlay"
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            bgcolor: alpha(theme.palette.common.black, 0.4),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0,
                            transition: 'opacity 0.3s ease',
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 48,
                              height: 48,
                              borderRadius: '50%',
                              bgcolor: alpha(theme.palette.common.white, 0.9),
                              color: theme.palette.text.primary,
                            }}
                          >
                            <Iconify icon="solar:magnifer-zoom-in-bold" width={24} />
                          </Box>
                        </Box>
                      </ButtonBase>
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
                          <Iconify icon="solar:gallery-bold" width={32} />
                          <Typography variant="caption">Chưa có hình ảnh</Typography>
                        </Stack>
                      </Box>
                    )}

                    {/* Action Buttons */}
                    {tab.imageUrl && (
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                        }}
                      >
                        <Tooltip title="Phóng to">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenZoom(tab.imageUrl, tab.label);
                            }}
                            sx={{
                              bgcolor: alpha(theme.palette.background.paper, 0.9),
                              backdropFilter: 'blur(4px)',
                              '&:hover': {
                                bgcolor: 'background.paper',
                              },
                            }}
                          >
                            <Iconify icon="solar:magnifer-zoom-in-bold" width={16} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Tải xuống">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(tab.imageUrl, tab.filename);
                            }}
                            sx={{
                              bgcolor: alpha(theme.palette.background.paper, 0.9),
                              backdropFilter: 'blur(4px)',
                              '&:hover': {
                                bgcolor: 'background.paper',
                              },
                            }}
                          >
                            <Iconify icon="solar:download-bold" width={16} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    )}
                  </Box>

                  {/* Compact Info */}
                  {tab.imageUrl && (
                    <Box
                      sx={{
                        mt: 1.5,
                        p: 1.5,
                        bgcolor: alpha(theme.palette.grey[100], 0.5),
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" fontWeight={500}>
                        {tab.label} • PNG
                        {originalImage && tab.label === 'Ảnh Gốc' && (
                          <> • {(originalImage.size / 1024 / 1024).toFixed(1)} MB</>
                        )}
                      </Typography>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          )}

          {/* Empty State */}
          {availableTabs.length === 0 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 200,
                bgcolor: 'grey.50',
                borderRadius: 2,
                border: 1,
                borderStyle: 'dashed',
                borderColor: 'grey.300',
              }}
            >
              <Stack alignItems="center" spacing={1}>
                <Iconify icon="solar:gallery-bold" width={32} color="text.disabled" />
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Chưa có hình ảnh
                </Typography>
                <Typography variant="caption" color="text.disabled" textAlign="center">
                  Upload ảnh để bắt đầu
                </Typography>
              </Stack>
            </Box>
          )}
        </Box>
      </Collapse>

      {/* Image Zoom Modal */}
      <ImageZoomModal
        open={zoomModal.open}
        onClose={handleCloseZoom}
        imageUrl={zoomModal.imageUrl}
        alt={zoomModal.alt}
      />
    </Paper>
  );
}
