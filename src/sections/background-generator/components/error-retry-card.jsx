'use client';

import { useState } from 'react';

import {
  Box,
  Card,
  Button,
  Typography,
  Alert,
  Collapse,
  Divider,
  Chip,
  Stack,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

import { SessionManager, STEP_STATUS, PROCESSING_STEPS } from 'src/lib/session-manager';

// ----------------------------------------------------------------------

const ERROR_MESSAGES = {
  [PROCESSING_STEPS.UPLOAD]: {
    title: 'Lỗi Upload Hình Ảnh',
    description: 'Không thể tải lên hình ảnh của bạn',
    suggestions: [
      'Kiểm tra kết nối internet',
      'Đảm bảo file ảnh không quá 20MB',
      'Thử với định dạng ảnh khác (JPG, PNG, WebP)'
    ]
  },
  [PROCESSING_STEPS.STYLE_SELECTION]: {
    title: 'Lỗi Chọn Style',
    description: 'Không thể lưu lựa chọn style background',
    suggestions: [
      'Thử chọn lại style khác',
      'Kiểm tra prompt tùy chỉnh có hợp lệ không',
      'Làm mới trang và thử lại'
    ]
  },
  [PROCESSING_STEPS.BACKGROUND_REMOVAL]: {
    title: 'Lỗi Xóa Background',
    description: 'AI không thể xóa background từ hình ảnh',
    suggestions: [
      'Đảm bảo hình ảnh có chất lượng tốt',
      'Thử với hình ảnh có background đơn giản hơn',
      'Kiểm tra kết nối API Runware'
    ]
  },
  [PROCESSING_STEPS.BACKGROUND_GENERATION]: {
    title: 'Lỗi Tạo Background',
    description: 'AI không thể tạo background mới',
    suggestions: [
      'Thử với prompt đơn giản hơn',
      'Chọn style background khác',
      'Kiểm tra credit API còn lại'
    ]
  },
  [PROCESSING_STEPS.FINAL_PROCESSING]: {
    title: 'Lỗi Xử Lý Cuối',
    description: 'Không thể hoàn thiện hình ảnh',
    suggestions: [
      'Kiểm tra dung lượng lưu trữ',
      'Thử lại sau vài phút',
      'Liên hệ hỗ trợ nếu lỗi tiếp tục'
    ]
  }
};

// ----------------------------------------------------------------------

export function ErrorRetryCard({ onRetryStep, onResetAll, className }) {
  const [expandedErrors, setExpandedErrors] = useState({});

  const session = SessionManager.getCurrentSession();
  const errorSteps = SessionManager.getErrorSteps();

  if (!session || errorSteps.length === 0) {
    return null;
  }

  const toggleErrorExpansion = (stepName) => {
    setExpandedErrors(prev => ({
      ...prev,
      [stepName]: !prev[stepName]
    }));
  };

  const handleRetryStep = (stepName) => {
    SessionManager.resetStep(stepName);
    if (onRetryStep) {
      onRetryStep(stepName);
    }
  };

  const handleRetryAll = () => {
    errorSteps.forEach(({ stepName }) => {
      SessionManager.resetStep(stepName);
    });
    if (onRetryStep) {
      onRetryStep(errorSteps[0].stepName);
    }
  };

  const handleResetSession = () => {
    SessionManager.clearSession();
    if (onResetAll) {
      onResetAll();
    }
  };

  return (
    <Card className={className} sx={{ border: '1px solid', borderColor: 'error.light' }}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Iconify 
            icon="solar:danger-triangle-bold-duotone" 
            width={32} 
            sx={{ color: 'error.main', mr: 2 }} 
          />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" color="error.main">
              Có {errorSteps.length} lỗi cần xử lý
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vui lòng thử lại các bước bị lỗi hoặc bắt đầu lại từ đầu
            </Typography>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Button
            variant="contained"
            color="error"
            onClick={handleRetryAll}
            startIcon={<Iconify icon="solar:refresh-bold" />}
            size="small"
          >
            Thử Lại Tất Cả
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={handleResetSession}
            startIcon={<Iconify icon="solar:restart-bold" />}
            size="small"
          >
            Bắt Đầu Lại
          </Button>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {/* Error Details */}
        <Stack spacing={2}>
          {errorSteps.map(({ stepName, error, attempts }) => {
            const errorConfig = ERROR_MESSAGES[stepName];
            const isExpanded = expandedErrors[stepName];

            return (
              <Box key={stepName}>
                <Alert
                  severity="error"
                  action={
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleRetryStep(stepName)}
                      startIcon={<Iconify icon="solar:refresh-bold" />}
                    >
                      Thử Lại
                    </Button>
                  }
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                        {errorConfig.title}
                      </Typography>
                      <Typography variant="body2">
                        {errorConfig.description}
                      </Typography>
                      {attempts > 1 && (
                        <Chip
                          size="small"
                          label={`Đã thử ${attempts} lần`}
                          color="error"
                          variant="outlined"
                          sx={{ mt: 1 }}
                        />
                      )}
                    </Box>
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => toggleErrorExpansion(stepName)}
                      endIcon={
                        <Iconify 
                          icon={isExpanded ? "solar:alt-arrow-up-bold" : "solar:alt-arrow-down-bold"} 
                        />
                      }
                    >
                      Chi tiết
                    </Button>
                  </Box>
                </Alert>

                <Collapse in={isExpanded}>
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'error.lighter', borderRadius: 1 }}>
                    {/* Technical Error */}
                    {error && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="error.main" sx={{ fontWeight: 'bold' }}>
                          Lỗi kỹ thuật:
                        </Typography>
                        <Typography variant="caption" color="error.main" sx={{ display: 'block', fontFamily: 'monospace', mt: 0.5 }}>
                          {error}
                        </Typography>
                      </Box>
                    )}

                    {/* Suggestions */}
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', mb: 1, display: 'block' }}>
                      Gợi ý khắc phục:
                    </Typography>
                    <Stack spacing={0.5}>
                      {errorConfig.suggestions.map((suggestion, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start' }}>
                          <Iconify 
                            icon="solar:check-circle-bold" 
                            width={12} 
                            sx={{ color: 'success.main', mr: 1, mt: 0.25 }} 
                          />
                          <Typography variant="caption" color="text.secondary">
                            {suggestion}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Collapse>
              </Box>
            );
          })}
        </Stack>

        {/* Help Section */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Iconify icon="solar:info-circle-bold" width={16} sx={{ color: 'info.main', mr: 1 }} />
            <Typography variant="caption" color="info.main" sx={{ fontWeight: 'bold' }}>
              Cần hỗ trợ?
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Nếu lỗi vẫn tiếp tục xảy ra, vui lòng liên hệ hỗ trợ kỹ thuật với mã session: 
            <Box component="span" sx={{ fontFamily: 'monospace', bgcolor: 'grey.200', px: 0.5, borderRadius: 0.5, ml: 0.5 }}>
              {session.id}
            </Box>
          </Typography>
        </Box>
      </Box>
    </Card>
  );
}
