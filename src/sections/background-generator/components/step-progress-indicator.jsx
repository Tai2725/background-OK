'use client';

import { useState, useEffect } from 'react';

import {
  Box,
  Card,
  Step,
  Stepper,
  StepLabel,
  StepContent,
  Typography,
  LinearProgress,
  Button,
  Chip,
  Alert,
  Collapse,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

import { SessionManager, STEP_STATUS, PROCESSING_STEPS } from 'src/lib/session-manager';

// ----------------------------------------------------------------------

const STEP_CONFIGS = {
  [PROCESSING_STEPS.UPLOAD]: {
    label: 'Upload Hình Ảnh',
    description: 'Tải lên hình ảnh sản phẩm của bạn',
    icon: 'solar:upload-bold-duotone',
    color: 'primary'
  },
  [PROCESSING_STEPS.STYLE_SELECTION]: {
    label: 'Chọn Style Background',
    description: 'Lựa chọn phong cách background phù hợp',
    icon: 'solar:palette-bold-duotone',
    color: 'secondary'
  },
  [PROCESSING_STEPS.BACKGROUND_REMOVAL]: {
    label: 'Xóa Background',
    description: 'Tự động loại bỏ background cũ',
    icon: 'solar:eraser-bold-duotone',
    color: 'warning'
  },
  [PROCESSING_STEPS.BACKGROUND_GENERATION]: {
    label: 'Tạo Background Mới',
    description: 'AI tạo background mới theo style đã chọn',
    icon: 'solar:magic-stick-3-bold-duotone',
    color: 'info'
  },
  [PROCESSING_STEPS.FINAL_PROCESSING]: {
    label: 'Hoàn Thiện',
    description: 'Xử lý cuối cùng và tối ưu hóa',
    icon: 'solar:check-circle-bold-duotone',
    color: 'success'
  }
};

const STATUS_CONFIGS = {
  [STEP_STATUS.PENDING]: {
    color: 'default',
    icon: 'solar:clock-circle-bold',
    label: 'Chờ xử lý'
  },
  [STEP_STATUS.IN_PROGRESS]: {
    color: 'primary',
    icon: 'solar:refresh-bold',
    label: 'Đang xử lý'
  },
  [STEP_STATUS.COMPLETED]: {
    color: 'success',
    icon: 'solar:check-circle-bold',
    label: 'Hoàn thành'
  },
  [STEP_STATUS.ERROR]: {
    color: 'error',
    icon: 'solar:danger-bold',
    label: 'Lỗi'
  }
};

// ----------------------------------------------------------------------

export function StepProgressIndicator({ 
  onRetryStep, 
  onResetSession,
  currentProcessingStep = null,
  processingProgress = 0 
}) {
  const [session, setSession] = useState(null);
  const [expandedError, setExpandedError] = useState(null);

  useEffect(() => {
    const updateSession = () => {
      const currentSession = SessionManager.getCurrentSession();
      setSession(currentSession);
    };

    updateSession();
    
    // Cập nhật session mỗi giây khi đang xử lý
    const interval = setInterval(updateSession, 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (!session) {
    return null;
  }

  const stepOrder = [
    PROCESSING_STEPS.UPLOAD,
    PROCESSING_STEPS.STYLE_SELECTION,
    PROCESSING_STEPS.BACKGROUND_REMOVAL,
    PROCESSING_STEPS.BACKGROUND_GENERATION,
    PROCESSING_STEPS.FINAL_PROCESSING
  ];

  const getActiveStep = () => {
    for (let i = 0; i < stepOrder.length; i++) {
      const stepName = stepOrder[i];
      const step = session.steps[stepName];
      
      if (step.status === STEP_STATUS.IN_PROGRESS) {
        return i;
      }
      if (step.status !== STEP_STATUS.COMPLETED) {
        return i;
      }
    }
    return stepOrder.length; // Tất cả hoàn thành
  };

  const activeStep = getActiveStep();
  const overallProgress = SessionManager.getOverallProgress();

  const handleRetryStep = (stepName) => {
    SessionManager.resetStep(stepName);
    setSession(SessionManager.getCurrentSession());
    if (onRetryStep) {
      onRetryStep(stepName);
    }
  };

  const handleResetAll = () => {
    SessionManager.clearSession();
    if (onResetSession) {
      onResetSession();
    }
  };

  return (
    <Card>
      <Box sx={{ p: 3 }}>
        {/* Header với progress tổng thể */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Tiến Trình Xử Lý
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {overallProgress}%
              </Typography>
              {overallProgress < 100 && (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={handleResetAll}
                  startIcon={<Iconify icon="solar:restart-bold" />}
                >
                  Reset
                </Button>
              )}
            </Box>
          </Box>
          
          <LinearProgress 
            variant="determinate" 
            value={overallProgress} 
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} orientation="vertical">
          {stepOrder.map((stepName, index) => {
            const stepConfig = STEP_CONFIGS[stepName];
            const stepData = session.steps[stepName];
            const statusConfig = STATUS_CONFIGS[stepData.status];
            const isCurrentProcessing = currentProcessingStep === stepName;

            return (
              <Step key={stepName}>
                <StepLabel
                  StepIconComponent={() => (
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: `${statusConfig.color}.lighter`,
                        color: `${statusConfig.color}.main`,
                        border: isCurrentProcessing ? 2 : 0,
                        borderColor: 'primary.main',
                      }}
                    >
                      <Iconify 
                        icon={isCurrentProcessing ? 'solar:refresh-bold' : statusConfig.icon} 
                        width={20}
                        sx={{ 
                          animation: isCurrentProcessing ? 'spin 1s linear infinite' : 'none',
                          '@keyframes spin': {
                            '0%': { transform: 'rotate(0deg)' },
                            '100%': { transform: 'rotate(360deg)' }
                          }
                        }}
                      />
                    </Box>
                  )}
                >
                  <Box sx={{ ml: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle1">
                        {stepConfig.label}
                      </Typography>
                      <Chip
                        size="small"
                        label={statusConfig.label}
                        color={statusConfig.color}
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {stepConfig.description}
                    </Typography>
                  </Box>
                </StepLabel>

                <StepContent>
                  {/* Progress bar cho bước hiện tại */}
                  {isCurrentProcessing && (
                    <Box sx={{ mb: 2 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={processingProgress} 
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {processingProgress}% hoàn thành
                      </Typography>
                    </Box>
                  )}

                  {/* Error handling */}
                  {stepData.status === STEP_STATUS.ERROR && (
                    <Box sx={{ mb: 2 }}>
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
                        sx={{ mb: 1 }}
                      >
                        <Typography variant="body2">
                          Có lỗi xảy ra ở bước này
                        </Typography>
                      </Alert>

                      <Button
                        size="small"
                        variant="text"
                        onClick={() => setExpandedError(expandedError === stepName ? null : stepName)}
                        startIcon={<Iconify icon="solar:info-circle-bold" />}
                      >
                        Chi tiết lỗi
                      </Button>

                      <Collapse in={expandedError === stepName}>
                        <Box sx={{ mt: 1, p: 2, bgcolor: 'error.lighter', borderRadius: 1 }}>
                          <Typography variant="caption" color="error.main">
                            {stepData.error || 'Lỗi không xác định'}
                          </Typography>
                          {stepData.attempts > 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                              Đã thử {stepData.attempts} lần
                            </Typography>
                          )}
                        </Box>
                      </Collapse>
                    </Box>
                  )}

                  {/* Success info */}
                  {stepData.status === STEP_STATUS.COMPLETED && stepData.completedAt && (
                    <Typography variant="caption" color="success.main" sx={{ display: 'block', mb: 1 }}>
                      Hoàn thành lúc {new Date(stepData.completedAt).toLocaleTimeString('vi-VN')}
                    </Typography>
                  )}
                </StepContent>
              </Step>
            );
          })}
        </Stepper>
      </Box>
    </Card>
  );
}
