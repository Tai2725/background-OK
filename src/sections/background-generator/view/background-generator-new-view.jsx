'use client';

import { useState, useCallback } from 'react';

import {
  Container,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useAuthContext } from 'src/auth/hooks';

import { toast } from 'src/components/snackbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ImageUploadService } from 'src/lib/image-upload-service';
import { RunwareService } from 'src/lib/runware-service';

import { ModernWorkflow } from '../components/modern-workflow';

// ----------------------------------------------------------------------

export function BackgroundGeneratorNewView() {
  const { user } = useAuthContext();

  // Workflow state
  const [currentStep, setCurrentStep] = useState(0);

  // Image states
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [removedBgImageUrl, setRemovedBgImageUrl] = useState('');
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

  // Data for processing
  const [imageRecordId, setImageRecordId] = useState(null);

  // Handle image upload
  const handleUploadImage = useCallback(async (file) => {
    if (!user?.id) {
      throw new Error('Vui lòng đăng nhập để sử dụng tính năng này');
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Upload to Supabase Storage
      const uploadResult = await ImageUploadService.uploadOriginalImage(file, user.id);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      // Update state
      setUploadedImage(file);
      setUploadedImageUrl(uploadResult.data.url);
      setImageRecordId(uploadResult.data.id);

      toast.success('Upload hình ảnh thành công! Bấm "Tiếp Theo" để xóa background.');
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.message);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [user]);

  // Handle remove background
  const handleRemoveBackground = useCallback(async () => {
    console.log('🎯 handleRemoveBackground called');
    console.log('📷 uploadedImageUrl:', uploadedImageUrl);
    console.log('🆔 imageRecordId:', imageRecordId);

    if (!uploadedImageUrl) {
      console.error('❌ No uploaded image URL');
      throw new Error('Không có hình ảnh để xử lý');
    }

    setIsRemovingBg(true);
    setRemoveBgError(null);
    console.log('⏳ Remove background processing started');

    try {
      console.log('🚀 Calling RunwareService.removeBackground...');

      // Call Runware API to remove background
      const removeResult = await RunwareService.removeBackground(uploadedImageUrl);

      console.log('✅ RunwareService.removeBackground completed:', removeResult);

      if (!removeResult.success) {
        throw new Error(removeResult.error);
      }

      // Update database record
      if (imageRecordId) {
        await ImageUploadService.updateImageRecord(imageRecordId, {
          background_removed_url: removeResult.data.imageURL,
          status: 'background_removed',
        });
      }

      // Debug log để kiểm tra response
      console.log('Remove background result:', removeResult);
      console.log('Image URL from response:', removeResult.data.imageURL);

      // Update state - use imageURL for consistency
      setRemovedBgImageUrl(removeResult.data.imageURL);

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

  // Handle generate background
  const handleGenerateBackground = useCallback(async () => {
    if (!removedBgImageUrl) {
      throw new Error('Không có hình ảnh đã xóa background để xử lý');
    }

    if (!selectedStyle && !customPrompt.trim()) {
      throw new Error('Vui lòng chọn style hoặc nhập prompt');
    }

    setIsGenerating(true);
    setGenerateError(null);

    try {
      // Prepare prompt with enhanced quality keywords
      const basePrompt = customPrompt.trim() || selectedStyle?.prompt || 'professional studio background, clean, minimalist';
      const enhancedPrompt = `${basePrompt}, high quality, detailed, professional photography, perfect lighting`;

      // Call Runware API to generate background with optimized parameters
      const generateResult = await RunwareService.generateBackground(removedBgImageUrl, {
        prompt: enhancedPrompt,
        negativePrompt: 'blurry, low quality, distorted, artifacts, noise, oversaturated, amateur',
        width: 1024,
        height: 1024,
        steps: 25, // Increased for better quality
        CFGScale: 7.0, // Optimal balance
        strength: 0.75, // Better integration
        model: 'runware:101@1', // FLUX model
        scheduler: 'Euler',
        outputFormat: 'PNG',
        outputQuality: 95,
      });

      if (!generateResult.success) {
        throw new Error(generateResult.error);
      }

      // Update database record
      if (imageRecordId) {
        await ImageUploadService.updateImageRecord(imageRecordId, {
          final_url: generateResult.data.imageURL,
          status: 'completed',
        });
      }

      // Debug log để kiểm tra response
      console.log('Generate background result:', generateResult);
      console.log('Final image URL from response:', generateResult.data.imageURL);

      // Update state
      setFinalImageUrl(generateResult.data.imageURL);

      toast.success('Tạo background thành công!');
    } catch (error) {
      console.error('Generate background error:', error);
      setGenerateError(error.message);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [removedBgImageUrl, selectedStyle, customPrompt, imageRecordId]);

  // Handle reset
  const handleReset = useCallback(() => {
    // Reset all states
    setCurrentStep(0);
    setUploadedImage(null);
    setUploadedImageUrl('');
    setRemovedBgImageUrl('');
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
  }, [currentStep, uploadedImageUrl, removedBgImageUrl, selectedStyle, customPrompt, finalImageUrl]);

  const handlePreviousStep = useCallback(() => {
    const prevStep = currentStep - 1;

    if (prevStep >= 0) {
      setCurrentStep(prevStep);
      toast.info(`Quay lại bước ${prevStep + 1}`);
    }
  }, [currentStep]);

  const handleGoToStep = useCallback((stepIndex) => {
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
  }, [uploadedImageUrl, removedBgImageUrl, selectedStyle, customPrompt]);

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
    </Container>
  );
}
