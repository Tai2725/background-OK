'use client';

import {
  Box,
  Typography,
  LinearProgress,
  CircularProgress,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const STEP_CONFIGS = {
  uploading: {
    icon: 'solar:upload-bold-duotone',
    color: 'info',
    title: 'Đang Upload',
  },
  removing_bg: {
    icon: 'solar:eraser-bold-duotone',
    color: 'warning',
    title: 'Đang Xóa Background',
  },
  generating_bg: {
    icon: 'solar:magic-stick-3-bold-duotone',
    color: 'primary',
    title: 'Đang Tạo Background',
  },
  completed: {
    icon: 'solar:check-circle-bold-duotone',
    color: 'success',
    title: 'Hoàn Thành',
  },
  error: {
    icon: 'solar:close-circle-bold-duotone',
    color: 'error',
    title: 'Có Lỗi Xảy Ra',
  },
};

// ----------------------------------------------------------------------

export function ProcessingStatus({ step, progress = 0, message = '' }) {
  const config = STEP_CONFIGS[step] || STEP_CONFIGS.uploading;
  const isCompleted = step === 'completed';
  const isError = step === 'error';

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            bgcolor: `${config.color}.lighter`,
            color: `${config.color}.main`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 2,
          }}
        >
          {isCompleted || isError ? (
            <Iconify icon={config.icon} width={24} />
          ) : (
            <CircularProgress
              size={24}
              color={config.color}
              sx={{ color: `${config.color}.main` }}
            />
          )}
        </Box>
        
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" color={`${config.color}.main`}>
            {config.title}
          </Typography>
          {message && (
            <Typography variant="body2" color="text.secondary">
              {message}
            </Typography>
          )}
        </Box>

        {!isCompleted && !isError && (
          <Typography variant="h6" color={`${config.color}.main`}>
            {Math.round(progress)}%
          </Typography>
        )}
      </Box>

      {/* Progress Bar */}
      {!isCompleted && !isError && (
        <LinearProgress
          variant="determinate"
          value={progress}
          color={config.color}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: `${config.color}.lighter`,
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
            },
          }}
        />
      )}

      {/* Success Message */}
      {isCompleted && (
        <Box
          sx={{
            p: 2,
            borderRadius: 1,
            bgcolor: 'success.lighter',
            border: 1,
            borderColor: 'success.light',
          }}
        >
          <Typography variant="body2" color="success.dark">
            ✨ Background đã được tạo thành công! Bạn có thể tải xuống hoặc tạo background mới.
          </Typography>
        </Box>
      )}

      {/* Error Message */}
      {isError && (
        <Box
          sx={{
            p: 2,
            borderRadius: 1,
            bgcolor: 'error.lighter',
            border: 1,
            borderColor: 'error.light',
          }}
        >
          <Typography variant="body2" color="error.dark">
            ❌ {message || 'Có lỗi xảy ra trong quá trình xử lý. Vui lòng thử lại.'}
          </Typography>
        </Box>
      )}

      {/* Processing Steps Info */}
      {!isCompleted && !isError && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Quá trình xử lý có thể mất 30-60 giây tùy thuộc vào độ phức tạp của hình ảnh
          </Typography>
        </Box>
      )}
    </Box>
  );
}
