// ----------------------------------------------------------------------
// MAIN EXPORTS FOR BACKGROUND GENERATOR APP
// Centralized export file for all services and utilities
// ----------------------------------------------------------------------

// Database & Storage
export { supabase } from './supabase';
// Schemas & Validation
export * from './schemas/runware-schemas';
// Core Services
export { RunwareService } from './runware-service';

// Utilities
export { DebugLogger } from '../utils/debug-logger';

export { ImageUploadService } from './image-upload-service';

export { BackgroundGeneratorService } from './background-generator-service';

// Session Management
export { STEP_STATUS, SessionManager, PROCESSING_STEPS } from './session-manager';

// Constants
export const APP_CONFIG = {
  // Runware API Configuration
  RUNWARE: {
    DEFAULT_MODEL: 'runware:109@1',
    ADVANCED_MODEL: 'runware:100@1',
    OUTPUT_FORMAT: 'PNG',
    OUTPUT_QUALITY: 95,
    DEFAULT_DIMENSIONS: [1024, 1024],
  },

  // Supabase Storage Configuration
  STORAGE: {
    BUCKETS: {
      IMAGES: 'images',
      PROCESSED_IMAGES: 'processed-images',
      AVATARS: 'avatars',
    },
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  },

  // Processing Configuration - Updated to match high-quality sample
  PROCESSING: {
    DEFAULT_PROMPT:
      'professional product photography studio background, super-realistic, clean minimalist white backdrop with subtle gradient, soft diffused lighting from above at 45-degree angle, key light with fill light setup reducing harsh shadows, gentle soft shadows beneath the product, bright even illumination highlighting natural texture details',
    NEGATIVE_PROMPT:
      'blurry, low quality, distorted, artifacts, noise, oversaturated, amateur, cluttered background, harsh shadows, overexposed, underexposed, distracting elements, poor lighting',
    DEFAULT_STEPS: 50,
    DEFAULT_CFG_SCALE: 60,
    DEFAULT_STRENGTH: 0.75,
  },

  // Status Configuration
  IMAGE_STATUS: {
    UPLOADED: 'uploaded',
    PROCESSING_BG_REMOVAL: 'processing_background_removal',
    BG_REMOVED: 'background_removed',
    MASK_GENERATED: 'mask_generated',
    PROCESSING_UPSCALE: 'processing_upscale',
    UPSCALED: 'upscaled',
    PROCESSING_BG_GENERATION: 'processing_background_generation',
    COMPLETED: 'completed',
    ERROR: 'error',
  },
};

// Helper Functions
export const createImageProcessingOptions = (overrides = {}) => ({
  prompt: APP_CONFIG.PROCESSING.DEFAULT_PROMPT,
  negativePrompt: APP_CONFIG.PROCESSING.NEGATIVE_PROMPT,
  steps: APP_CONFIG.PROCESSING.DEFAULT_STEPS,
  CFGScale: APP_CONFIG.PROCESSING.DEFAULT_CFG_SCALE,
  strength: APP_CONFIG.PROCESSING.DEFAULT_STRENGTH,
  outputFormat: APP_CONFIG.RUNWARE.OUTPUT_FORMAT,
  outputQuality: APP_CONFIG.RUNWARE.OUTPUT_QUALITY,
  ...overrides,
});

// Validation Helpers
export const validateImageFile = (file) => {
  const errors = [];

  if (!file) {
    errors.push('File is required');
    return { isValid: false, errors };
  }

  if (!APP_CONFIG.STORAGE.ALLOWED_TYPES.includes(file.type)) {
    errors.push(
      `File type ${file.type} is not allowed. Allowed types: ${APP_CONFIG.STORAGE.ALLOWED_TYPES.join(', ')}`
    );
  }

  if (file.size > APP_CONFIG.STORAGE.MAX_FILE_SIZE) {
    errors.push(
      `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${APP_CONFIG.STORAGE.MAX_FILE_SIZE / 1024 / 1024}MB`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Error Handling Helpers
export const createErrorResponse = (message, details = null) => ({
  success: false,
  error: message,
  details,
  timestamp: new Date().toISOString(),
});

export const createSuccessResponse = (data, message = null) => ({
  success: true,
  data,
  message,
  timestamp: new Date().toISOString(),
});

// Logging Helpers
export const logProcessingStep = (step, message, data = null) => {
  console.log(`🔄 [${step.toUpperCase()}] ${message}`);
  if (data) {
    console.log('📊 Data:', data);
  }
};

export const logError = (context, error, data = null) => {
  console.error(`❌ [${context.toUpperCase()}] ${error.message || error}`);
  if (data) {
    console.error('📊 Error Data:', data);
  }
  if (error.stack) {
    console.error('📚 Stack:', error.stack);
  }
};

export const logSuccess = (context, message, data = null) => {
  console.log(`✅ [${context.toUpperCase()}] ${message}`);
  if (data) {
    console.log('📊 Success Data:', data);
  }
};
