import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';

import { Iconify } from '../iconify';

// ----------------------------------------------------------------------

export function ImageUploadZone({
  onFilesSelected,
  onUploadProgress,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  disabled = false,
  error = null,
  helperText = '',
}) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const errors = rejectedFiles.map(file => ({
          file: file.file.name,
          errors: file.errors.map(e => e.message),
        }));
        console.error('Rejected files:', errors);
        return;
      }

      const newFiles = acceptedFiles.slice(0, maxFiles);
      setSelectedFiles(newFiles);
      
      if (onFilesSelected) {
        onFilesSelected(newFiles);
      }
    },
    [maxFiles, onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxSize,
    maxFiles,
    disabled: disabled || isUploading,
  });

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    if (onFilesSelected) {
      onFilesSelected(newFiles);
    }
  };

  const clearAll = () => {
    setSelectedFiles([]);
    if (onFilesSelected) {
      onFilesSelected([]);
    }
  };

  const hasError = error || isDragReject;
  const hasFiles = selectedFiles.length > 0;

  return (
    <Box>
      {/* Upload Zone */}
      <Card
        {...getRootProps()}
        sx={{
          p: 4,
          border: 2,
          borderStyle: 'dashed',
          borderColor: hasError
            ? 'error.main'
            : isDragActive
            ? 'primary.main'
            : 'grey.300',
          bgcolor: hasError
            ? 'error.lighter'
            : isDragActive
            ? 'primary.lighter'
            : 'background.neutral',
          cursor: disabled || isUploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: disabled || isUploading ? 'grey.300' : 'primary.main',
            bgcolor: disabled || isUploading ? 'background.neutral' : 'primary.lighter',
          },
        }}
      >
        <input {...getInputProps()} />

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
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
              color: hasError
                ? 'error.main'
                : isDragActive
                ? 'primary.main'
                : 'grey.500',
              mb: 2,
            }}
          />

          <Typography
            variant="h6"
            sx={{
              color: hasError
                ? 'error.main'
                : isDragActive
                ? 'primary.main'
                : 'text.primary',
              mb: 1,
            }}
          >
            {hasError
              ? 'File không hợp lệ'
              : isDragActive
              ? 'Thả file vào đây'
              : isUploading
              ? 'Đang upload...'
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
              : helperText || `Hỗ trợ: JPEG, PNG, WebP (tối đa ${maxFiles} file, mỗi file < 10MB)`}
          </Typography>

          {isUploading && (
            <Box sx={{ width: '100%', mt: 2 }}>
              <LinearProgress
                variant="determinate"
                value={uploadProgress}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary' }}>
                {uploadProgress}% hoàn thành
              </Typography>
            </Box>
          )}
        </Box>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Selected Files */}
      {hasFiles && (
        <Box sx={{ mt: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Typography variant="subtitle2">
              Đã chọn {selectedFiles.length} file
            </Typography>
            <Button
              size="small"
              color="error"
              onClick={clearAll}
              startIcon={<Iconify icon="solar:trash-bin-minimalistic-bold" />}
            >
              Xóa tất cả
            </Button>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            {selectedFiles.map((file, index) => (
              <Chip
                key={index}
                label={file.name}
                onDelete={() => removeFile(index)}
                deleteIcon={<Iconify icon="solar:close-circle-bold" />}
                variant="outlined"
                sx={{
                  maxWidth: 200,
                  '& .MuiChip-label': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  },
                }}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
