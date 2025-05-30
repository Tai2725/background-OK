'use client';

import {
  Box,
  Card,
  Stack,
  Button,
  Typography,
  CardContent,
  LinearProgress,
  Divider,
  Chip,
  Alert,
  Paper,
  alpha,
  Fade,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function GenerationControls({
  isProcessing,
  processingStep,
  processingProgress,
  onReset,
  disabled = false,
}) {
  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: (theme) => `0 8px 32px ${alpha(theme.palette.warning.main, 0.08)}`,
        border: (theme) => `1px solid ${alpha(theme.palette.warning.main, 0.08)}`,
        overflow: 'hidden',
      }}
    >
      <CardContent sx={{ p: 0 }}>
        {/* Header */}
        <Box
          sx={{
            background: (theme) => `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
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
              <Iconify icon="solar:rocket-bold-duotone" width={24} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Tạo Background
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Xử lý tự động với AI chất lượng cao
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
                  background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
                  border: 2,
                  borderColor: 'primary.main',
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
                    left: `-${100 - processingProgress}%`,
                    width: '100%',
                    height: '100%',
                    background: (theme) => `linear-gradient(90deg, transparent 0%, ${alpha(theme.palette.primary.main, 0.05)} 50%, transparent 100%)`,
                    transition: 'left 0.5s ease',
                  }}
                />

                <Stack spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        color: 'white',
                        animation: 'pulse 2s infinite',
                        '@keyframes pulse': {
                          '0%': { transform: 'scale(1)' },
                          '50%': { transform: 'scale(1.1)' },
                          '100%': { transform: 'scale(1)' },
                        },
                      }}
                    >
                      <Iconify icon="solar:settings-bold-duotone" width={20} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600} color="primary.main">
                        {processingStep}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Đang xử lý, vui lòng chờ...
                      </Typography>
                    </Box>
                    <Chip
                      label={`${processingProgress}%`}
                      size="medium"
                      color="primary"
                      variant="filled"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        borderRadius: 2,
                      }}
                    />
                  </Stack>

                  <LinearProgress
                    variant="determinate"
                    value={processingProgress}
                    sx={{
                      height: 12,
                      borderRadius: 6,
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 6,
                        background: (theme) => `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                      },
                    }}
                  />
                </Stack>
              </Paper>
            </Fade>
          )}

          {/* Instructions */}
          {!isProcessing && (
            <Paper
              elevation={0}
              sx={{
                mb: 3,
                p: 3,
                bgcolor: (theme) => alpha(theme.palette.info.main, 0.05),
                border: 1,
                borderColor: (theme) => alpha(theme.palette.info.main, 0.2),
                borderRadius: 2,
              }}
            >
              <Stack direction="row" spacing={2}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: 'info.lighter',
                    color: 'info.main',
                    flexShrink: 0,
                  }}
                >
                  <Iconify icon="solar:info-circle-bold" width={20} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'info.main' }}>
                    Hướng Dẫn Sử Dụng
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upload hình ảnh và chọn style, sau đó bấm <strong>"Tạo Background"</strong> để bắt đầu xử lý tự động.
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Action Buttons */}
          <Stack spacing={3}>
            {/* Generate Button */}
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={disabled || isProcessing}
              loading={isProcessing}
              startIcon={<Iconify icon="solar:magic-stick-3-bold" />}
              sx={{
                py: 2,
                fontWeight: 700,
                fontSize: '1.1rem',
                borderRadius: 3,
                background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                  transform: 'translateY(-2px)',
                  boxShadow: (theme) => `0 12px 32px ${alpha(theme.palette.primary.main, 0.4)}`,
                },
                '&:disabled': {
                  background: 'grey.300',
                  color: 'grey.500',
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {isProcessing ? 'Đang Xử Lý...' : '✨ Tạo Background'}
            </Button>

            {/* Reset Button */}
            <Button
              variant="outlined"
              color="inherit"
              onClick={onReset}
              disabled={isProcessing}
              startIcon={<Iconify icon="solar:restart-bold" />}
              sx={{
                py: 1.5,
                fontWeight: 600,
                borderRadius: 2,
                borderColor: 'grey.300',
                color: 'text.secondary',
                '&:hover': {
                  borderColor: 'error.main',
                  color: 'error.main',
                  bgcolor: 'error.lighter',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              🔄 Reset Form
            </Button>
          </Stack>

          {/* Processing Steps Info */}
          <Paper
            elevation={0}
            sx={{
              mt: 4,
              p: 3,
              bgcolor: (theme) => alpha(theme.palette.grey[500], 0.05),
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              📋 Quy Trình Xử Lý Tự Động
            </Typography>
            <Stack spacing={2}>
              {[
                { step: 1, text: 'Upload hình ảnh lên Supabase', icon: 'solar:upload-bold', color: 'info' },
                { step: 2, text: 'Xóa background tự động', icon: 'solar:eraser-bold', color: 'warning' },
                { step: 3, text: 'Tạo background mới với AI', icon: 'solar:magic-stick-3-bold', color: 'primary' },
                { step: 4, text: 'Hoàn thành và lưu kết quả', icon: 'solar:check-circle-bold', color: 'success' },
              ].map((item) => (
                <Stack key={item.step} direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: `${item.color}.lighter`,
                      color: `${item.color}.main`,
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      border: 2,
                      borderColor: `${item.color}.main`,
                    }}
                  >
                    {item.step}
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: `${item.color}.lighter`,
                      color: `${item.color}.main`,
                    }}
                  >
                    <Iconify icon={item.icon} width={16} />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {item.text}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>

          {/* Tips */}
          <Paper
            elevation={0}
            sx={{
              mt: 3,
              p: 3,
              background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.success.light, 0.02)} 100%)`,
              border: 1,
              borderColor: (theme) => alpha(theme.palette.success.main, 0.2),
              borderRadius: 2,
            }}
          >
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: 'success.lighter',
                  color: 'success.main',
                  flexShrink: 0,
                }}
              >
                <Iconify icon="solar:lightbulb-bold" width={20} />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'success.main' }}>
                  💡 Mẹo Để Có Kết Quả Tốt Nhất
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Những lời khuyên giúp tối ưu hóa chất lượng background
                </Typography>
              </Box>
            </Stack>
            <Stack spacing={1.5}>
              {[
                { icon: 'solar:gallery-bold', text: 'Sử dụng hình ảnh có độ phân giải cao (ít nhất 512x512px)', color: 'info' },
                { icon: 'solar:eye-bold', text: 'Đối tượng chính nên rõ ràng, không bị che khuất', color: 'warning' },
                { icon: 'solar:palette-bold', text: 'Chọn style phù hợp với mục đích sử dụng', color: 'primary' },
                { icon: 'solar:pen-bold', text: 'Custom prompt chi tiết sẽ cho kết quả tốt hơn', color: 'secondary' },
              ].map((tip, index) => (
                <Stack key={index} direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: `${tip.color}.lighter`,
                      color: `${tip.color}.main`,
                    }}
                  >
                    <Iconify icon={tip.icon} width={12} />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {tip.text}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>
        </Box>
      </CardContent>
    </Card>
  );
}
