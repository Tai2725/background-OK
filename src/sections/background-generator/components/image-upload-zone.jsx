'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

import { Box, alpha, Typography } from '@mui/material';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function ImageUploadZone({ onUpload, disabled = false }) {
  const onDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file && onUpload) {
        onUpload(file);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled,
  });

  const hasError = isDragReject;

  return (
    <Box
      {...getRootProps()}
      sx={{
        width: '100%',
        height: 320,
        display: 'flex',
        cursor: disabled ? 'default' : 'pointer',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        borderRadius: 2,
        border: '2px dashed',
        borderColor: hasError ? 'error.main' : isDragActive ? 'primary.main' : 'grey.300',
        bgcolor: hasError
          ? alpha('#FF5630', 0.08)
          : isDragActive
            ? alpha('#00AB55', 0.08)
            : alpha('#919EAB', 0.04),
        transition: 'all 0.3s ease',
        '&:hover': {
          opacity: disabled ? 1 : 0.8,
          borderColor: disabled ? 'grey.300' : 'primary.main',
        },
      }}
    >
      <input {...getInputProps()} />

      <Iconify
        icon={
          hasError
            ? 'solar:close-circle-bold'
            : isDragActive
              ? 'solar:upload-bold-duotone'
              : 'solar:cloud-upload-bold-duotone'
        }
        width={64}
        sx={{
          color: hasError ? 'error.main' : isDragActive ? 'primary.main' : 'grey.500',
          mb: 2,
        }}
      />

      <Typography
        variant="h6"
        sx={{
          color: hasError ? 'error.main' : isDragActive ? 'primary.main' : 'text.primary',
          mb: 1,
        }}
      >
        {hasError
          ? 'File không hợp lệ'
          : isDragActive
            ? 'Thả file vào đây'
            : 'Kéo thả hoặc click để upload'}
      </Typography>

      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          textAlign: 'center',
          px: 2,
        }}
      >
        {hasError
          ? 'Chỉ hỗ trợ file ảnh (JPEG, PNG, WebP) dưới 10MB'
          : 'Hỗ trợ: JPEG, PNG, WebP (tối đa 10MB)'}
      </Typography>

      {disabled && (
        <Typography
          variant="caption"
          sx={{
            color: 'text.disabled',
            mt: 1,
          }}
        >
          Đang xử lý...
        </Typography>
      )}
    </Box>
  );
}
