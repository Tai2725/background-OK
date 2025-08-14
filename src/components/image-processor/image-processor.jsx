'use client';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';

import { RunwareService } from 'src/lib/runware-service';

import { Iconify } from '../iconify';
import { ResultGallery } from './result-gallery';
import { ImageUploadZone } from './image-upload-zone';
import { ProcessingStatus } from './processing-status';

// ----------------------------------------------------------------------

const OPERATIONS = [
  {
    value: 'removeBackground',
    label: 'Xóa background',
    icon: 'solar:eraser-bold',
    description: 'Tự động xóa background khỏi hình ảnh',
  },
  {
    value: 'upscale',
    label: 'Tăng độ phân giải',
    icon: 'solar:maximize-bold',
    description: 'Tăng kích thước và chất lượng hình ảnh',
  },
  {
    value: 'generateImage',
    label: 'Tạo ảnh từ text',
    icon: 'solar:magic-stick-3-bold',
    description: 'Tạo hình ảnh từ mô tả văn bản',
  },
];

const UPSCALE_OPTIONS = [
  { value: 2, label: '2x (Gấp đôi)' },
  { value: 4, label: '4x (Gấp 4 lần)' },
];

const BACKGROUND_MODELS = [
  { value: 'runware:110@1', label: 'Bria RMBG 2.0 (Tốt nhất)' },
  { value: 'runware:109@1', label: 'RemBG 1.4' },
  { value: 'runware:112@1', label: 'BiRefNet v1 Base' },
];

export function ImageProcessor() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [operation, setOperation] = useState('removeBackground');
  const [tasks, setTasks] = useState([]);
  const [results, setResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Operation-specific options
  const [upscaleScale, setUpscaleScale] = useState(2);
  const [backgroundModel, setBackgroundModel] = useState('runware:110@1');
  const [textPrompt, setTextPrompt] = useState('');

  const handleFilesSelected = useCallback((files) => {
    setSelectedFiles(files);
    setError(null);
  }, []);

  const handleStartProcessing = async () => {
    if (operation === 'generateImage' && !textPrompt.trim()) {
      setError('Vui lòng nhập mô tả để tạo ảnh');
      return;
    }

    if (operation !== 'generateImage' && selectedFiles.length === 0) {
      setError('Vui lòng chọn ít nhất một file ảnh');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Test connection first
      const connectionTest = await RunwareService.testConnection();
      if (!connectionTest.success) {
        throw new Error(`Không thể kết nối Runware API: ${connectionTest.error}`);
      }

      let filesToProcess = selectedFiles;

      // For text-to-image, create a dummy file array
      if (operation === 'generateImage') {
        filesToProcess = [{ name: 'generated-image.png', prompt: textPrompt }];
      }

      // Initialize tasks
      const initialTasks = filesToProcess.map((file, index) => ({
        id: `task-${Date.now()}-${index}`,
        filename: file.name,
        status: 'idle',
        progress: 0,
        operation,
      }));

      setTasks(initialTasks);

      // Process with batch processing
      const options = {
        ...(operation === 'upscale' && { scale: upscaleScale }),
        ...(operation === 'removeBackground' && { model: backgroundModel }),
      };

      const batchResults = await RunwareService.batchProcess(
        filesToProcess,
        operation,
        options,
        (progress) => {
          // Update task status based on progress
          setTasks((prevTasks) =>
            prevTasks.map((task, index) => {
              if (index === progress.completed - 1) {
                return {
                  ...task,
                  status: progress.result.success ? 'completed' : 'error',
                  progress: 100,
                  result: progress.result.data,
                  error: progress.result.error,
                  cost: progress.result.data?.cost,
                };
              } else if (index < progress.completed - 1) {
                return {
                  ...task,
                  status: 'completed',
                  progress: 100,
                };
              } else if (index === progress.completed) {
                return {
                  ...task,
                  status: 'processing',
                  progress: 50,
                };
              }
              return task;
            })
          );
        }
      );

      // Update results
      const successfulResults = batchResults
        .filter((result) => result.success)
        .map((result) => ({
          ...result.data,
          filename: result.filename,
          operation,
          cost: result.data?.cost,
        }));

      setResults((prev) => [...prev, ...successfulResults]);
    } catch (err) {
      console.error('Processing error:', err);
      setError(err.message);

      // Mark all tasks as error
      setTasks((prevTasks) =>
        prevTasks.map((task) => ({
          ...task,
          status: 'error',
          error: err.message,
        }))
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = async (failedTasks) => {
    // Implement retry logic for failed tasks
    console.log('Retrying tasks:', failedTasks);
    // You can implement specific retry logic here
  };

  const handleDownloadAll = async () => {
    for (const result of results) {
      try {
        const response = await fetch(result.imageURL);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `processed-${result.filename}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (downloadError) {
        console.error('Download error:', downloadError);
      }
    }
  };

  const selectedOperation = OPERATIONS.find((op) => op.value === operation);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4, textAlign: 'center' }}>
        Xử lý ảnh với AI
      </Typography>

      <Grid container spacing={4}>
        {/* Left Panel - Controls */}
        <Grid item size={{ xs: 12, md: 6 }}>
          {/* Operation Selection */}
          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Chọn loại xử lý
            </Typography>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Loại xử lý</InputLabel>
              <Select
                value={operation}
                label="Loại xử lý"
                onChange={(e) => setOperation(e.target.value)}
              >
                {OPERATIONS.map((op) => (
                  <MenuItem key={op.value} value={op.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Iconify icon={op.icon} />
                      {op.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedOperation && (
              <Typography variant="body2" color="text.secondary">
                {selectedOperation.description}
              </Typography>
            )}

            {/* Operation-specific options */}
            {operation === 'upscale' && (
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Mức độ phóng to</InputLabel>
                <Select
                  value={upscaleScale}
                  label="Mức độ phóng to"
                  onChange={(e) => setUpscaleScale(e.target.value)}
                >
                  {UPSCALE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {operation === 'removeBackground' && (
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Model AI</InputLabel>
                <Select
                  value={backgroundModel}
                  label="Model AI"
                  onChange={(e) => setBackgroundModel(e.target.value)}
                >
                  {BACKGROUND_MODELS.map((model) => (
                    <MenuItem key={model.value} value={model.value}>
                      {model.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {operation === 'generateImage' && (
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Mô tả hình ảnh"
                placeholder="Ví dụ: A beautiful sunset over the ocean with palm trees"
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
                sx={{ mt: 2 }}
                helperText="Mô tả chi tiết hình ảnh bạn muốn tạo bằng tiếng Anh"
              />
            )}
          </Card>

          {/* Upload Zone */}
          {operation !== 'generateImage' && (
            <ImageUploadZone
              onFilesSelected={handleFilesSelected}
              error={error}
              disabled={isProcessing}
            />
          )}

          {/* Process Button */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleStartProcessing}
              disabled={
                isProcessing ||
                (operation !== 'generateImage' && selectedFiles.length === 0) ||
                (operation === 'generateImage' && !textPrompt.trim())
              }
              startIcon={
                isProcessing ? (
                  <Iconify
                    icon="solar:settings-bold"
                    sx={{ animation: 'spin 1s linear infinite' }}
                  />
                ) : (
                  <Iconify icon={selectedOperation?.icon} />
                )
              }
              sx={{
                minWidth: 200,
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
              }}
            >
              {isProcessing ? 'Đang xử lý...' : `Bắt đầu ${selectedOperation?.label}`}
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Grid>

        {/* Right Panel - Status & Results */}
        <Grid item size={{ xs: 12, md: 6 }}>
          {/* Processing Status */}
          <ProcessingStatus tasks={tasks} onRetry={handleRetry} onDownloadAll={handleDownloadAll} />

          {results.length > 0 && (
            <>
              <Divider sx={{ my: 3 }} />

              {/* Results Gallery */}
              <ResultGallery results={results} onDownloadAll={handleDownloadAll} />
            </>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
