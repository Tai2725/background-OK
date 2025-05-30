'use client';

import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Box,
  Card,
  Grid,
  Stack,
  Button,
  Typography,
  CardContent,
  Alert,
  Divider,
} from '@mui/material';

import { useAuthContext } from 'src/auth/hooks';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { ImageUploadService } from 'src/lib/image-upload-service';
import { RunwareService } from 'src/lib/runware-service';

import { ImagePreviewPanel } from './image-preview-panel';
import { StyleSelectionPanel } from './style-selection-panel';
import { GenerationControls } from './generation-controls';

// ----------------------------------------------------------------------

// Schema validation với Zod
export const BackgroundGeneratorSchema = zod.object({
  image: zod.instanceof(File, { message: 'Vui lòng chọn hình ảnh!' }),
  selectedStyle: zod.object({
    id: zod.string(),
    name: zod.string(),
    prompt: zod.string(),
    category: zod.string(),
  }).nullable(),
  customPrompt: zod.string().optional(),
}).refine(
  (data) => data.selectedStyle || (data.customPrompt && data.customPrompt.trim().length >= 10),
  {
    message: 'Vui lòng chọn style hoặc nhập custom prompt (ít nhất 10 ký tự)',
    path: ['customPrompt'],
  }
);

// ----------------------------------------------------------------------

export function BackgroundGeneratorForm() {
  const { user } = useAuthContext();

  // Processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);

  // Result states
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [removedBgImageUrl, setRemovedBgImageUrl] = useState('');
  const [finalImageUrl, setFinalImageUrl] = useState('');
  const [imageRecordId, setImageRecordId] = useState(null);

  // Error state
  const [processingError, setProcessingError] = useState(null);

  // Form setup
  const defaultValues = {
    image: null,
    selectedStyle: null,
    customPrompt: '',
  };

  const methods = useForm({
    resolver: zodResolver(BackgroundGeneratorSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  // Progress update helper
  const updateProgress = useCallback((step, progress) => {
    setProcessingStep(step);
    setProcessingProgress(progress);
  }, []);

  // Handle form submission - tự động xử lý toàn bộ workflow
  const onSubmit = handleSubmit(async (data) => {
    if (!user?.id) {
      toast.error('Vui lòng đăng nhập để sử dụng tính năng này');
      return;
    }

    setIsProcessing(true);
    setProcessingError(null);
    setProcessingProgress(0);

    try {
      // Step 1: Upload image to Supabase
      updateProgress('Đang upload hình ảnh...', 20);

      const uploadResult = await ImageUploadService.uploadOriginalImage(data.image, user.id);
      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      setUploadedImageUrl(uploadResult.data.url);
      setImageRecordId(uploadResult.data.id);
      updateProgress('Upload thành công!', 30);

      // Step 2: Remove background
      updateProgress('Đang xóa background...', 50);

      const removeResult = await RunwareService.removeBackground(uploadResult.data.url);
      if (!removeResult.success) {
        throw new Error(removeResult.error);
      }

      // Update database record
      await ImageUploadService.updateImageRecord(uploadResult.data.id, {
        background_removed_url: removeResult.data.imageURL,
        status: 'background_removed',
      });

      setRemovedBgImageUrl(removeResult.data.imageURL);
      updateProgress('Xóa background thành công!', 70);

      // Step 3: Generate new background
      updateProgress('Đang tạo background mới...', 80);

      // Prepare prompt
      const basePrompt = data.customPrompt?.trim() || data.selectedStyle?.prompt || 'professional studio background';
      const enhancedPrompt = `${basePrompt}, high quality, detailed, professional photography, perfect lighting`;

      const generateResult = await RunwareService.generateBackground(removeResult.data.imageURL, {
        prompt: enhancedPrompt,
        negativePrompt: 'blurry, low quality, distorted, artifacts, noise, oversaturated, amateur',
        width: 1024,
        height: 1024,
        steps: 25,
        CFGScale: 7.0,
        strength: 0.75,
        model: 'runware:101@1',
        scheduler: 'Euler',
        outputFormat: 'PNG',
        outputQuality: 95,
      });

      if (!generateResult.success) {
        throw new Error(generateResult.error);
      }

      // Update final result
      await ImageUploadService.updateImageRecord(uploadResult.data.id, {
        final_url: generateResult.data.imageURL,
        status: 'completed',
      });

      setFinalImageUrl(generateResult.data.imageURL);
      updateProgress('Hoàn thành!', 100);

      toast.success('Tạo background thành công!');
    } catch (error) {
      console.error('Processing error:', error);
      setProcessingError(error.message);
      toast.error(`Lỗi: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  });

  // Handle reset
  const handleReset = useCallback(() => {
    reset();
    setUploadedImageUrl('');
    setRemovedBgImageUrl('');
    setFinalImageUrl('');
    setImageRecordId(null);
    setProcessingError(null);
    setProcessingProgress(0);
    setProcessingStep('');
    toast.info('Đã reset form');
  }, [reset]);

  // Handle file upload
  const handleFileUpload = useCallback((files) => {
    if (files && files.length > 0) {
      setValue('image', files[0], { shouldValidate: true });
    }
  }, [setValue]);

  // Handle style selection
  const handleStyleSelect = useCallback((style) => {
    setValue('selectedStyle', style, { shouldValidate: true });
    // Auto-fill custom prompt with selected style
    if (style?.prompt) {
      setValue('customPrompt', style.prompt);
    }
  }, [setValue]);

  // Handle custom prompt change
  const handleCustomPromptChange = useCallback((prompt) => {
    setValue('customPrompt', prompt, { shouldValidate: true });
    // Clear selected style if user types custom prompt
    if (prompt?.trim() && values.selectedStyle) {
      setValue('selectedStyle', null);
    }
  }, [setValue, values.selectedStyle]);

  // Handle prompt enhancement
  const handleEnhancePrompt = useCallback((basePrompt) => {
    // Add quality enhancers to the prompt
    const enhancers = [
      'high quality',
      'detailed',
      'professional photography',
      'perfect lighting',
      '8k resolution',
      'sharp focus',
    ];

    const currentPrompt = basePrompt || values.customPrompt || '';
    const enhancedPrompt = `${currentPrompt}, ${enhancers.join(', ')}`;

    setValue('customPrompt', enhancedPrompt, { shouldValidate: true });
    return enhancedPrompt;
  }, [setValue, values.customPrompt]);

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        {/* Left Panel - Input & Controls */}
        <Grid item size={{ xs: 12, lg: 6 }}>
          <Stack spacing={3}>
            {/* Image Upload Section */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📸 Upload Hình Ảnh
                </Typography>
                <Field.Upload
                  name="image"
                  maxSize={10485760} // 10MB
                  onUpload={handleFileUpload}
                  onRemove={() => setValue('image', null)}
                  accept={{
                    'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
                  }}
                  helperText="Chọn hình ảnh để tạo background (tối đa 10MB)"
                />
              </CardContent>
            </Card>

            {/* Style Selection */}
            <StyleSelectionPanel
              selectedStyle={values.selectedStyle}
              customPrompt={values.customPrompt}
              onStyleSelect={handleStyleSelect}
              onCustomPromptChange={handleCustomPromptChange}
              onEnhancePrompt={handleEnhancePrompt}
              disabled={isProcessing}
            />

            {/* Generation Controls */}
            <GenerationControls
              isProcessing={isProcessing}
              processingStep={processingStep}
              processingProgress={processingProgress}
              onReset={handleReset}
              disabled={!values.image || (!values.selectedStyle && !values.customPrompt?.trim())}
            />

            {/* Error Display */}
            {processingError && (
              <Alert severity="error" onClose={() => setProcessingError(null)}>
                <Typography variant="body2">{processingError}</Typography>
              </Alert>
            )}
          </Stack>
        </Grid>

        {/* Right Panel - Image Preview */}
        <Grid item size={{ xs: 12, lg: 6 }}>
          <ImagePreviewPanel
            originalImage={values.image}
            uploadedImageUrl={uploadedImageUrl}
            removedBgImageUrl={removedBgImageUrl}
            finalImageUrl={finalImageUrl}
            isProcessing={isProcessing}
            processingStep={processingStep}
          />
        </Grid>
      </Grid>
    </Form>
  );
}
