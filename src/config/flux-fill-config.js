// Cấu hình cho Flux Fill model
export const FLUX_FILL_CONFIG = {
  // Model chính cho inpainting - Updated to BFL for high quality
  PRIMARY_MODEL: 'bfl:1@2',

  // Model cho background removal
  BACKGROUND_REMOVAL_MODEL: 'runware:109@1',

  // Model cao cấp cho boundary refinement
  PREMIUM_MODEL: 'bfl:1@2',

  // Cấu hình mặc định cho Flux Fill - Updated to match sample request
  DEFAULT_PARAMS: {
    steps: 50,
    CFGScale: 60,
    outputFormat: 'PNG',
    outputType: 'URL',
    outputQuality: 95,
    numberResults: 1,
    seed: 206554476,
    checkNSFW: false,
    includeCost: true,
  },

  // Cấu hình cho BFL models - Exact match with sample request
  BFL_PARAMS: {
    steps: 50,
    CFGScale: 60,
    outputFormat: 'PNG',
    outputType: 'URL',
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
  },

  // Cấu hình cho background removal
  BACKGROUND_REMOVAL_PARAMS: {
    outputFormat: 'PNG',
    outputType: 'URL',
    outputQuality: 95,
    settings: {
      returnOnlyMask: true,
      postProcessMask: true,
      alphaMatting: true,
      alphaMattingForegroundThreshold: 240,
      alphaMattingBackgroundThreshold: 15,
      alphaMattingErodeSize: 8,
      rgba: [255, 255, 255, 0],
    },
  },

  // Prompts tối ưu cho từng loại background - Enhanced quality
  OPTIMIZED_PROMPTS: {
    studio: {
      positive:
        'professional product photography studio background, super-realistic, clean minimalist white backdrop with subtle gradient, soft diffused lighting from above at 45-degree angle, key light with fill light setup reducing harsh shadows, gentle soft shadows beneath the product, bright even illumination highlighting natural texture details',
      negative:
        'blurry, low quality, distorted, artifacts, noise, oversaturated, amateur, cluttered background, harsh shadows, overexposed, underexposed, distracting elements, poor lighting',
    },
    office: {
      positive:
        'modern professional office environment background, super-realistic, clean organized workspace with natural lighting, contemporary furniture, subtle depth of field, professional business setting, bright even illumination, minimalist design elements',
      negative:
        'messy, cluttered, unprofessional, poor lighting, distracting elements, blurry, low quality, harsh shadows, overexposed, underexposed',
    },
    outdoor: {
      positive:
        'natural outdoor background, super-realistic, beautiful landscape with professional photography lighting, soft natural illumination, perfect depth of field, serene environment, high-quality nature setting with balanced exposure',
      negative:
        'overexposed, underexposed, blurry, low quality, distracting elements, harsh shadows, noise, artificial lighting, poor composition',
    },
    abstract: {
      positive:
        'clean abstract background, super-realistic, modern minimalist design with smooth gradients, professional artistic composition, subtle color transitions, high-quality digital art, perfect lighting balance',
      negative:
        'busy, cluttered, distracting, low quality, harsh patterns, noise, artifacts, oversaturated, poor color balance',
    },
  },

  // Basic workflow settings
  WORKFLOW_SETTINGS: {
    // Retry settings
    maxRetries: 3,
    retryDelay: 2000,
  },

  // Cost optimization
  COST_SETTINGS: {
    budgetLimits: {
      low: 0.03,
      medium: 0.08,
      high: 0.15,
      premium: 0.25,
    },

    modelCosts: {
      'runware:102@1': 0.05,
      'bfl:1@2': 0.12,
      'runware:109@1': 0.02,
      'civitai:403361@456538': 0.02,
    },
  },
};

// Helper functions
export function getOptimalModel(requirements = {}) {
  const { qualityTier = 'medium', budget = 0.08 } = requirements;

  if (qualityTier === 'premium' && budget >= FLUX_FILL_CONFIG.COST_SETTINGS.budgetLimits.high) {
    return FLUX_FILL_CONFIG.PREMIUM_MODEL;
  }

  return FLUX_FILL_CONFIG.PRIMARY_MODEL;
}

export function getOptimalParams(model, imageAnalysis = {}) {
  const baseParams =
    model === FLUX_FILL_CONFIG.PREMIUM_MODEL
      ? FLUX_FILL_CONFIG.BFL_PARAMS
      : FLUX_FILL_CONFIG.DEFAULT_PARAMS;

  // Điều chỉnh parameters dựa trên image analysis
  const adjustedParams = { ...baseParams };

  if (imageAnalysis.complexity === 'high') {
    adjustedParams.steps = Math.min(adjustedParams.steps + 10, 50);
    adjustedParams.CFGScale = Math.min(adjustedParams.CFGScale + 2, 15);
  }

  return adjustedParams;
}

export function getOptimalPrompt(backgroundType, customPrompt) {
  if (customPrompt) {
    return {
      positive: customPrompt,
      negative: FLUX_FILL_CONFIG.OPTIMIZED_PROMPTS.studio.negative,
    };
  }

  const promptConfig =
    FLUX_FILL_CONFIG.OPTIMIZED_PROMPTS[backgroundType] || FLUX_FILL_CONFIG.OPTIMIZED_PROMPTS.studio;

  return promptConfig;
}

export default FLUX_FILL_CONFIG;
