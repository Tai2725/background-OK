'use client';

import { useState, useCallback } from 'react';

import { Container } from '@mui/material';

import { paths } from 'src/routes/paths';

import {
  logError,
  APP_CONFIG,
  logSuccess,
  RunwareService,
  logProcessingStep,
  validateImageFile,
  ImageUploadService,
} from 'src/lib';

import { toast } from 'src/components/snackbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks';

import { ModernWorkflow, ProcessingMetadataCard } from '../components';

// ----------------------------------------------------------------------

export function BackgroundGeneratorNewView() {
  const { user } = useAuthContext();

  // Workflow state
  const [currentStep, setCurrentStep] = useState(0);

  // Image states
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [removedBgImageUrl, setRemovedBgImageUrl] = useState(''); // Legacy: ảnh đã xóa BG
  const [maskImageUrl, setMaskImageUrl] = useState(''); // New: mask URL từ removeBackground
  const [finalImageUrl, setFinalImageUrl] = useState('');

  // Style/Prompt states
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');

  // Loading states
  const [isUploading, setIsUploading] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Error states
  const [uploadError, setUploadError] = useState(null);
  const [removeBgError, setRemoveBgError] = useState(null);
  const [generateError, setGenerateError] = useState(null);

  // Advanced inpainting metadata
  const [processingMetadata, setProcessingMetadata] = useState(null);

  // Data for processing
  const [imageRecordId, setImageRecordId] = useState(null);

  // Handle image upload
  const handleUploadImage = useCallback(
    async (file) => {
      if (!user?.id) {
        throw new Error('Vui lòng đăng nhập để sử dụng tính năng này');
      }

      // Validate file before upload
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      setIsUploading(true);
      setUploadError(null);

      try {
        logProcessingStep('upload', 'Starting image upload', {
          fileName: file.name,
          fileSize: file.size,
        });

        // Upload to Supabase Storage
        const uploadResult = await ImageUploadService.uploadOriginalImage(file, user.id);

        if (!uploadResult.success) {
          throw new Error(uploadResult.error);
        }

        // Update state
        setUploadedImage(file);
        setUploadedImageUrl(uploadResult.data.url);
        setImageRecordId(uploadResult.data.id);

        logSuccess('upload', 'Image uploaded successfully', { imageId: uploadResult.data.id });
        toast.success('Upload hình ảnh thành công! Bấm "Tiếp Theo" để xóa background.');
      } catch (error) {
        logError('upload', error, { fileName: file.name });
        setUploadError(error.message);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    [user]
  );

  // Handle remove background
  const handleRemoveBackground = useCallback(async () => {
    logProcessingStep('removeBackground', 'Starting background removal', {
      imageUrl: uploadedImageUrl,
      imageRecordId,
    });

    if (!uploadedImageUrl) {
      const error = new Error('Không có hình ảnh để xử lý');
      logError('removeBackground', error);
      throw error;
    }

    setIsRemovingBg(true);
    setRemoveBgError(null);

    try {
      logProcessingStep('removeBackground', 'Calling Runware API');

      // Call Runware API to remove background with optimized settings
      const removeResult = await RunwareService.removeBackground(uploadedImageUrl, {
        model: APP_CONFIG.RUNWARE.DEFAULT_MODEL,
        outputFormat: APP_CONFIG.RUNWARE.OUTPUT_FORMAT,
        outputQuality: APP_CONFIG.RUNWARE.OUTPUT_QUALITY,
        settings: {
          returnOnlyMask: true, // Generate mask for inpainting
        },
      });

      logSuccess('removeBackground', 'Background removal completed', removeResult);

      if (!removeResult.success) {
        throw new Error(removeResult.error);
      }

      // Process result: download, upload to Supabase, update database
      const processResult = await ImageUploadService.processRunwareResult(
        removeResult,
        user.id,
        imageRecordId,
        'mask'
      );

      // Debug log để kiểm tra response
      console.log('Remove background result:', removeResult);
      console.log('Process result:', processResult);

      // Update state
      setRemovedBgImageUrl(processResult.previewUrl); // For preview - use Supabase URL
      setMaskImageUrl(processResult.originalUrl); // For processing - use original Runware URL

      toast.success('Xóa background thành công! Bấm "Tiếp Theo" để chọn style.');
    } catch (error) {
      console.error('Remove background error:', error);
      setRemoveBgError(error.message);
      throw error;
    } finally {
      setIsRemovingBg(false);
    }
  }, [uploadedImageUrl, imageRecordId]);

  // Handle style selection
  const handleStyleSelect = useCallback((style) => {
    setSelectedStyle(style);
    toast.success('Đã chọn style! Bấm "Tiếp Theo" để tạo background.');
  }, []);

  // Handle custom prompt change
  const handleCustomPromptChange = useCallback((prompt) => {
    setCustomPrompt(prompt);
    // Không hiển thị toast liên tục để tránh spam thông báo
    // Toast sẽ được hiển thị khi user bấm "Tiếp Theo"
  }, []);

  // Handle generate background using new inpainting workflow
  const handleGenerateBackground = useCallback(async () => {
    if (!uploadedImageUrl) {
      const error = new Error('Không có ảnh gốc để xử lý');
      logError('generateBackground', error);
      throw error;
    }

    if (!maskImageUrl) {
      const error = new Error(
        'Không có mask image để xử lý. Vui lòng thực hiện bước xóa background trước.'
      );
      logError('generateBackground', error);
      throw error;
    }

    if (!selectedStyle && !customPrompt.trim()) {
      const error = new Error('Vui lòng chọn style hoặc nhập prompt');
      logError('generateBackground', error);
      throw error;
    }

    setIsGenerating(true);
    setGenerateError(null);

    try {
      // Prepare prompt with enhanced quality keywords
      const basePrompt =
        customPrompt.trim() || selectedStyle?.prompt || APP_CONFIG.PROCESSING.DEFAULT_PROMPT;
      const enhancedPrompt = `${basePrompt}, high quality, detailed, professional photography, perfect lighting, studio setup`;

      logProcessingStep('generateBackground', 'Starting advanced inpainting', {
        seedImage: uploadedImageUrl.substring(0, 50) + '...',
        maskImage: maskImageUrl.substring(0, 50) + '...',
        prompt: enhancedPrompt,
      });

      // Use basic inpainting workflow
      const generateResult = await RunwareService.inpainting(
        uploadedImageUrl, // seedImage: ảnh gốc
        maskImageUrl, // maskImage: mask từ removeBackground
        enhancedPrompt, // positivePrompt: mô tả background mong muốn
        {
          // BFL model doesn't support negativePrompt - removed
          model: 'bfl:1@2', // BFL model for high quality
          CFGScale: 60,
          steps: 50,
          outputType: 'URL',
          outputFormat: 'PNG',
          outputQuality: 95,
          numberResults: 1,
          seed: 206554476,
          checkNSFW: false,
          includeCost: true,
          providerSettings: {
            bfl: {
              promptUpsampling: true,
              safetyTolerance: 2,
            },
          },
        }
      );

      if (!generateResult.success) {
        throw new Error(generateResult.error);
      }

      logSuccess('generateBackground', 'Background generation completed', generateResult);

      // Process result: download, upload to Supabase, update database
      const processResult = await ImageUploadService.processRunwareResult(
        generateResult,
        user.id,
        imageRecordId,
        'final'
      );

      // Update state
      setFinalImageUrl(processResult.previewUrl);

      // Save processing metadata for display
      if (generateResult.data.processingMetadata) {
        setProcessingMetadata(generateResult.data.processingMetadata);
      }

      // Show success message
      toast.success('Tạo ảnh thành công!');
    } catch (error) {
      logError('generateBackground', error, { imageRecordId, selectedStyle });
      setGenerateError(error.message);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [uploadedImageUrl, maskImageUrl, selectedStyle, customPrompt, imageRecordId]);

  // Handle reset
  const handleReset = useCallback(() => {
    // Reset all states
    setCurrentStep(0);
    setUploadedImage(null);
    setUploadedImageUrl('');
    setRemovedBgImageUrl('');
    setMaskImageUrl(''); // Reset mask URL
    setFinalImageUrl('');
    setSelectedStyle(null);
    setCustomPrompt('');
    setImageRecordId(null);

    // Reset loading states
    setIsUploading(false);
    setIsRemovingBg(false);
    setIsGenerating(false);

    // Reset error states
    setUploadError(null);
    setRemoveBgError(null);
    setGenerateError(null);

    // Reset processing metadata
    setProcessingMetadata(null);

    toast.info('Đã reset workflow');
  }, []);

  // Navigation handlers
  const handleNextStep = useCallback(() => {
    const nextStep = currentStep + 1;
    const maxStep = 3; // 0-3 (4 steps total)

    if (nextStep <= maxStep) {
      // Validate current step before proceeding
      let canProceed = false;

      switch (currentStep) {
        case 0: // Upload step
          canProceed = Boolean(uploadedImageUrl);
          if (!canProceed) {
            toast.error('Vui lòng upload hình ảnh trước khi tiếp tục');
          }
          break;
        case 1: // Remove background step
          canProceed = Boolean(removedBgImageUrl);
          if (!canProceed) {
            toast.error('Vui lòng xóa background trước khi tiếp tục');
          }
          break;
        case 2: // Choose prompt step
          canProceed = Boolean(selectedStyle || customPrompt?.trim());
          if (!canProceed) {
            toast.error('Vui lòng chọn style hoặc nhập prompt trước khi tiếp tục');
          }
          break;
        case 3: // Generate background step
          canProceed = Boolean(finalImageUrl);
          if (!canProceed) {
            toast.error('Vui lòng tạo background trước khi hoàn thành');
          }
          break;
        default:
          canProceed = true;
      }

      if (canProceed) {
        setCurrentStep(nextStep);
        toast.success(`Chuyển đến bước ${nextStep + 1}`);
      }
    }
  }, [
    currentStep,
    uploadedImageUrl,
    removedBgImageUrl,
    selectedStyle,
    customPrompt,
    finalImageUrl,
  ]);

  const handlePreviousStep = useCallback(() => {
    const prevStep = currentStep - 1;

    if (prevStep >= 0) {
      setCurrentStep(prevStep);
      toast.info(`Quay lại bước ${prevStep + 1}`);
    }
  }, [currentStep]);

  const handleGoToStep = useCallback(
    (stepIndex) => {
      // Validate if user can go to this step
      let canGoToStep = true;
      let errorMessage = '';

      // Check if previous steps are completed
      if (stepIndex > 0 && !uploadedImageUrl) {
        canGoToStep = false;
        errorMessage = 'Vui lòng upload hình ảnh trước';
      } else if (stepIndex > 1 && !removedBgImageUrl) {
        canGoToStep = false;
        errorMessage = 'Vui lòng xóa background trước';
      } else if (stepIndex > 2 && !selectedStyle && !customPrompt?.trim()) {
        canGoToStep = false;
        errorMessage = 'Vui lòng chọn style hoặc nhập prompt trước';
      }

      if (canGoToStep) {
        setCurrentStep(stepIndex);
        toast.success(`Chuyển đến bước ${stepIndex + 1}`);
      } else {
        toast.error(errorMessage);
      }
    },
    [uploadedImageUrl, removedBgImageUrl, selectedStyle, customPrompt]
  );

  return (
    <Container maxWidth="xl">
      <CustomBreadcrumbs
        heading="Background Generator"
        links={[
          { name: 'Background Generator', href: paths.backgroundGenerator.root },
          { name: 'Generator' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ModernWorkflow
        // Handlers
        onUploadImage={handleUploadImage}
        onRemoveBackground={handleRemoveBackground}
        onStyleSelect={handleStyleSelect}
        onCustomPromptChange={handleCustomPromptChange}
        onGenerateBackground={handleGenerateBackground}
        onReset={handleReset}
        // Navigation handlers
        onNextStep={handleNextStep}
        onPreviousStep={handlePreviousStep}
        onGoToStep={handleGoToStep}
        // State
        currentStep={currentStep}
        uploadedImage={uploadedImage}
        uploadedImageUrl={uploadedImageUrl}
        removedBgImageUrl={removedBgImageUrl}
        maskImageUrl={maskImageUrl} // New: mask URL for inpainting
        finalImage={finalImageUrl}
        selectedStyle={selectedStyle}
        customPrompt={customPrompt}
        // Loading states
        isUploading={isUploading}
        isRemovingBg={isRemovingBg}
        isGenerating={isGenerating}
        // Error states
        uploadError={uploadError}
        removeBgError={removeBgError}
        generateError={generateError}
      />

      {/* Processing Metadata Card - Show when we have metadata */}
      {processingMetadata && (
        <ProcessingMetadataCard metadata={processingMetadata} sx={{ mt: 3 }} />
      )}
    </Container>
  );
}
