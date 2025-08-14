'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from '../iconify';

// ----------------------------------------------------------------------

const STATUS_CONFIG = {
  idle: {
    color: 'default',
    icon: 'solar:clock-circle-bold',
    label: 'Chờ xử lý',
  },
  uploading: {
    color: 'info',
    icon: 'solar:upload-bold',
    label: 'Đang upload',
  },
  processing: {
    color: 'warning',
    icon: 'solar:settings-bold',
    label: 'Đang xử lý',
  },
  completed: {
    color: 'success',
    icon: 'solar:check-circle-bold',
    label: 'Hoàn thành',
  },
  error: {
    color: 'error',
    icon: 'solar:close-circle-bold',
    label: 'Lỗi',
  },
};

export function ProcessingStatus({
  tasks = [],
  onRetry,
  onCancel,
  onDownloadAll,
  showDetails = true,
}) {
  const [expandedTask, setExpandedTask] = useState(null);

  const completedTasks = tasks.filter((task) => task.status === 'completed');
  const errorTasks = tasks.filter((task) => task.status === 'error');
  const processingTasks = tasks.filter((task) => ['uploading', 'processing'].includes(task.status));

  const overallProgress =
    tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const hasErrors = errorTasks.length > 0;
  // const isProcessing = processingTasks.length > 0;
  const isCompleted = tasks.length > 0 && completedTasks.length === tasks.length;

  return (
    <Card sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Typography variant="h6">Trạng thái xử lý</Typography>

          {isCompleted && completedTasks.length > 0 && (
            <Button
              variant="contained"
              color="primary"
              onClick={onDownloadAll}
              startIcon={<Iconify icon="solar:download-bold" />}
            >
              Tải tất cả
            </Button>
          )}
        </Box>

        {/* Overall Progress */}
        {tasks.length > 0 && (
          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Tiến độ tổng thể
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {completedTasks.length}/{tasks.length} hoàn thành
              </Typography>
            </Box>

            <LinearProgress
              variant="determinate"
              value={overallProgress}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  bgcolor: hasErrors ? 'error.main' : isCompleted ? 'success.main' : 'primary.main',
                },
              }}
            />

            <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
              {overallProgress}% hoàn thành
            </Typography>
          </Box>
        )}
      </Box>

      {/* Summary Stats */}
      {tasks.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            {completedTasks.length > 0 && (
              <Chip
                icon={<Iconify icon="solar:check-circle-bold" />}
                label={`${completedTasks.length} thành công`}
                color="success"
                variant="outlined"
                size="small"
              />
            )}

            {processingTasks.length > 0 && (
              <Chip
                icon={<CircularProgress size={16} />}
                label={`${processingTasks.length} đang xử lý`}
                color="warning"
                variant="outlined"
                size="small"
              />
            )}

            {errorTasks.length > 0 && (
              <Chip
                icon={<Iconify icon="solar:close-circle-bold" />}
                label={`${errorTasks.length} lỗi`}
                color="error"
                variant="outlined"
                size="small"
              />
            )}
          </Box>
        </Box>
      )}

      {/* Error Summary */}
      {hasErrors && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => onRetry && onRetry(errorTasks)}
              startIcon={<Iconify icon="solar:refresh-bold" />}
            >
              Thử lại
            </Button>
          }
        >
          Có {errorTasks.length} file xử lý thất bại. Click &quot;Thử lại&quot; để xử lý lại.
        </Alert>
      )}

      {/* Task List */}
      {showDetails && tasks.length > 0 && (
        <Box>
          <Divider sx={{ mb: 2 }} />

          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Chi tiết từng file
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {tasks.map((task, index) => {
              const config = STATUS_CONFIG[task.status] || STATUS_CONFIG.idle;
              const isExpanded = expandedTask === index;

              return (
                <Card
                  key={index}
                  variant="outlined"
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() => setExpandedTask(isExpanded ? null : index)}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                      <Iconify icon={config.icon} sx={{ color: `${config.color}.main` }} />

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {task.filename}
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                          {config.label}
                          {task.progress && ` - ${task.progress}%`}
                          {task.cost && ` - $${task.cost.toFixed(4)}`}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {task.status === 'processing' && <CircularProgress size={20} />}

                      {task.status === 'error' && onRetry && (
                        <Button
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRetry([task]);
                          }}
                          startIcon={<Iconify icon="solar:refresh-bold" />}
                        >
                          Thử lại
                        </Button>
                      )}

                      <Iconify
                        icon={isExpanded ? 'solar:alt-arrow-up-bold' : 'solar:alt-arrow-down-bold'}
                        sx={{ color: 'text.secondary' }}
                      />
                    </Box>
                  </Box>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                      {task.error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                          {task.error}
                        </Alert>
                      )}

                      {task.result && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Kết quả:
                          </Typography>
                          <Typography variant="body2">
                            {JSON.stringify(task.result, null, 2)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </Card>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Empty State */}
      {tasks.length === 0 && (
        <Box
          sx={{
            textAlign: 'center',
            py: 4,
            color: 'text.secondary',
          }}
        >
          <Iconify icon="solar:file-smile-bold-duotone" width={64} sx={{ mb: 2, opacity: 0.5 }} />
          <Typography variant="body2">Chưa có file nào được xử lý</Typography>
        </Box>
      )}
    </Card>
  );
}
