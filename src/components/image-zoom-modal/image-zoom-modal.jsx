'use client';

import { useState, useCallback } from 'react';
import { m, AnimatePresence } from 'framer-motion';

import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import IconButton from '@mui/material/IconButton';
import { alpha, useTheme } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const imageVariants = {
  hidden: { 
    scale: 0.8, 
    opacity: 0,
    y: 50,
  },
  visible: { 
    scale: 1, 
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300,
      duration: 0.4,
    },
  },
  exit: { 
    scale: 0.8, 
    opacity: 0,
    y: 50,
    transition: {
      duration: 0.3,
    },
  },
};

export function ImageZoomModal({ 
  open, 
  onClose, 
  imageUrl, 
  alt = 'Zoomed image',
  ...other 
}) {
  const theme = useTheme();
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleBackdropClick = useCallback((event) => {
    // Chỉ đóng modal khi click vào backdrop, không phải vào hình ảnh
    if (event.target === event.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: theme.zIndex.modal + 1,
      }}
      {...other}
    >
      <AnimatePresence mode="wait">
        {open && (
          <m.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleBackdropClick}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: alpha(theme.palette.common.black, 0.8),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: theme.spacing(2),
              outline: 'none',
            }}
          >
            {/* Close Button */}
            <IconButton
              onClick={onClose}
              sx={{
                position: 'fixed',
                top: 16,
                right: 16,
                color: 'white',
                bgcolor: alpha(theme.palette.common.black, 0.5),
                '&:hover': {
                  bgcolor: alpha(theme.palette.common.black, 0.7),
                },
                zIndex: 1,
              }}
            >
              <Iconify icon="mingcute:close-line" width={24} />
            </IconButton>

            {/* Image Container */}
            <m.div
              variants={imageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{
                maxWidth: '90vw',
                maxHeight: '90vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box
                component="img"
                src={imageUrl}
                alt={alt}
                onLoad={handleImageLoad}
                sx={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  borderRadius: 1,
                  boxShadow: theme.customShadows?.z24 || '0 24px 48px rgba(0,0,0,0.24)',
                  cursor: 'default',
                  opacity: imageLoaded ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                }}
              />
            </m.div>

            {/* Loading indicator */}
            {!imageLoaded && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: 'white',
                }}
              >
                <m.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Iconify icon="mingcute:loading-line" width={32} />
                </m.div>
              </Box>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
