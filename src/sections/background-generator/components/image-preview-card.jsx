'use client';

import {
  Box,
  Tab,
  Tabs,
  Card,
  Badge,
  CardContent,
  Typography,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
} from '@mui/material';
import { useState } from 'react';

import { Image } from 'src/components/image';
import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

export function ImagePreviewCard({
  originalImage,
  originalImageUrl, // Thêm URL từ Supabase
  removedBgImage,
  finalImage,
  processingStep,
}) {
  const [activeTab, setActiveTab] = useState(0);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [imageScale, setImageScale] = useState(1);

  // Debug log để kiểm tra props
  console.log('ImagePreviewCard props:', {
    originalImage: !!originalImage,
    originalImageUrl,
    removedBgImage,
    finalImage,
    processingStep,
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFullscreenOpen = () => {
    setFullscreenOpen(true);
  };

  const handleFullscreenClose = () => {
    setFullscreenOpen(false);
    setImageScale(1);
  };

  const handleZoomIn = () => {
    setImageScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setImageScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setImageScale(1);
  };

  const tabs = [
    {
      label: 'Ảnh Gốc',
      value: 0,
      image: originalImageUrl || (originalImage ? URL.createObjectURL(originalImage) : null),
      icon: 'solar:gallery-bold-duotone',
      available: !!(originalImageUrl || originalImage),
    },
    {
      label: 'Đã Xóa BG',
      value: 1,
      image: removedBgImage,
      icon: 'solar:eraser-bold-duotone',
      available: !!removedBgImage,
      processing: processingStep === 'removing_bg',
    },
    {
      label: 'Kết Quả',
      value: 2,
      image: finalImage,
      icon: 'solar:magic-stick-3-bold-duotone',
      available: !!finalImage,
      processing: processingStep === 'generating_bg',
    },
  ];

  // Debug log cho tabs
  console.log('ImagePreviewCard tabs:', tabs.map(tab => ({
    label: tab.label,
    available: tab.available,
    hasImage: !!tab.image,
    imageUrl: tab.image,
  })));

  const currentTab = tabs[activeTab];
  const currentImage = currentTab?.image;

  return (
    <Card>
      <CardContent sx={{ p: 0 }}>
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ minHeight: 48 }}
          >
            {tabs.map((tab) => (
              <Tab
                key={tab.value}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {tab.processing ? (
                      <CircularProgress size={16} />
                    ) : (
                      <Iconify
                        icon={tab.icon}
                        width={16}
                        sx={{
                          color: tab.available ? 'primary.main' : 'text.disabled'
                        }}
                      />
                    )}
                    <Typography
                      variant="caption"
                      sx={{
                        color: tab.available ? 'text.primary' : 'text.disabled',
                        fontWeight: tab.available ? 600 : 400,
                      }}
                    >
                      {tab.label}
                    </Typography>
                    {tab.available && (
                      <Badge
                        color="success"
                        variant="dot"
                        sx={{
                          '& .MuiBadge-dot': {
                            width: 6,
                            height: 6,
                          },
                        }}
                      />
                    )}
                  </Box>
                }
                disabled={!tab.available && !tab.processing}
                sx={{
                  minHeight: 48,
                  textTransform: 'none',
                }}
              />
            ))}
          </Tabs>
        </Box>

        {/* Image Display */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: 'auto',
            minHeight: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'grey.50',
            backgroundImage: currentTab?.value === 1 || currentTab?.value === 2
              ? 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)'
              : 'none',
            backgroundSize: currentTab?.value === 1 || currentTab?.value === 2 ? '20px 20px' : 'auto',
            backgroundPosition: currentTab?.value === 1 || currentTab?.value === 2 ? '0 0, 0 10px, 10px -10px, -10px 0px' : 'auto',
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          {/* Fullscreen Button */}
          {currentImage && (
            <IconButton
              onClick={handleFullscreenOpen}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 2,
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 1)',
                },
              }}
            >
              <Iconify icon="solar:maximize-bold" width={20} />
            </IconButton>
          )}

          {currentImage ? (
            <Box
              sx={{
                width: '100%',
                minHeight: 300,
                maxHeight: '70vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 1,
                position: 'relative',
              }}
            >
              <img
                src={currentImage}
                alt={currentTab.label}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  display: 'block',
                }}
                onClick={handleFullscreenOpen}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.02)';
                  e.target.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onLoad={(e) => {
                  // Điều chỉnh container height theo aspect ratio của hình ảnh
                  const img = e.target;
                  const container = img.parentElement;
                  if (container && img.naturalWidth && img.naturalHeight) {
                    const aspectRatio = img.naturalHeight / img.naturalWidth;
                    const containerWidth = container.offsetWidth - 16; // trừ padding
                    const calculatedHeight = containerWidth * aspectRatio;

                    // Giới hạn chiều cao tối đa
                    const maxHeight = window.innerHeight * 0.7; // 70vh
                    const finalHeight = Math.min(calculatedHeight, maxHeight, 800);

                    container.style.height = `${Math.max(finalHeight, 300)}px`;
                  }
                }}
              />
            </Box>
          ) : currentTab?.processing ? (
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={48} sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Đang xử lý {currentTab.label.toLowerCase()}...
              </Typography>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center' }}>
              <Iconify
                icon={currentTab.icon}
                width={64}
                sx={{ color: 'grey.400', mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                {currentTab.label} chưa có
              </Typography>
            </Box>
          )}

          {/* Processing Overlay */}
          {currentTab?.processing && currentImage && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: 'rgba(255, 255, 255, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1,
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress size={48} sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Đang xử lý...
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        {/* Image Info */}
        {currentImage && (
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              {currentTab.label}
              {currentTab.value === 1 && ' (Nền trong suốt)'}
              {currentTab.value === 2 && ' (Background mới)'}
            </Typography>

            {/* Show Supabase URL for original image */}
            {currentTab.value === 0 && originalImageUrl && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  URL Supabase:
                </Typography>
                <Chip
                  label={originalImageUrl.length > 40 ? `${originalImageUrl.substring(0, 40)}...` : originalImageUrl}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontSize: '0.7rem',
                    height: 20,
                    '& .MuiChip-label': {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      px: 1,
                    }
                  }}
                />
                <Tooltip title="Copy URL">
                  <IconButton
                    size="small"
                    onClick={() => {
                      navigator.clipboard.writeText(originalImageUrl);
                      toast.success('Đã copy URL!');
                    }}
                    sx={{ p: 0.5 }}
                  >
                    <Iconify icon="solar:copy-bold" width={12} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Mở trong tab mới">
                  <IconButton
                    size="small"
                    onClick={() => window.open(originalImageUrl, '_blank')}
                    sx={{ p: 0.5 }}
                  >
                    <Iconify icon="solar:external-link-bold" width={12} />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
        )}
      </CardContent>

      {/* Fullscreen Dialog */}
      <Dialog
        open={fullscreenOpen}
        onClose={handleFullscreenClose}
        maxWidth={false}
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            maxWidth: '95vw',
            maxHeight: '95vh',
            margin: 1,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box component="span" sx={{ fontSize: '1.25rem', fontWeight: 600 }}>
            {currentTab?.label} - Xem Toàn Màn Hình
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Thu nhỏ">
              <IconButton onClick={handleZoomOut} disabled={imageScale <= 0.5}>
                <Iconify icon="solar:minus-circle-bold" />
              </IconButton>
            </Tooltip>
            <Typography variant="body2" sx={{ minWidth: 50, textAlign: 'center' }}>
              {Math.round(imageScale * 100)}%
            </Typography>
            <Tooltip title="Phóng to">
              <IconButton onClick={handleZoomIn} disabled={imageScale >= 3}>
                <Iconify icon="solar:add-circle-bold" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Kích thước gốc">
              <IconButton onClick={handleResetZoom}>
                <Iconify icon="solar:restart-bold" />
              </IconButton>
            </Tooltip>
            <IconButton onClick={handleFullscreenClose}>
              <Iconify icon="solar:close-circle-bold" />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto' }}>
          {currentImage && (
            <Box
              sx={{
                width: '100%',
                height: '75vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: currentTab?.value === 1 || currentTab?.value === 2 ? 'grey.100' : 'transparent',
                backgroundImage: currentTab?.value === 1 || currentTab?.value === 2
                  ? 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)'
                  : 'none',
                backgroundSize: currentTab?.value === 1 || currentTab?.value === 2 ? '20px 20px' : 'auto',
                backgroundPosition: currentTab?.value === 1 || currentTab?.value === 2 ? '0 0, 0 10px, 10px -10px, -10px 0px' : 'auto',
                borderRadius: 1,
                overflow: 'auto',
                position: 'relative',
              }}
            >
              <img
                src={currentImage}
                alt={currentTab?.label}
                style={{
                  maxWidth: imageScale === 1 ? '100%' : 'none',
                  maxHeight: imageScale === 1 ? '100%' : 'none',
                  width: imageScale === 1 ? 'auto' : `${imageScale * 100}%`,
                  height: 'auto',
                  objectFit: 'contain',
                  borderRadius: '4px',
                  transform: `scale(${imageScale === 1 ? 1 : 1})`,
                  transformOrigin: 'center',
                  transition: 'transform 0.3s ease, width 0.3s ease',
                }}
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => window.open(currentImage, '_blank')} startIcon={<Iconify icon="solar:external-link-bold" />}>
            Mở trong Tab Mới
          </Button>
          <Button onClick={handleFullscreenClose} variant="contained">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
