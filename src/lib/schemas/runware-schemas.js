import { z } from 'zod';

// ----------------------------------------------------------------------

/**
 * Base schemas for common types
 */

// UUID v4 validation
const uuidSchema = z.string().uuid('Invalid UUID format');

// Image input formats (URL, base64, data URI, UUID)
const imageInputSchema = z
  .string()
  .min(1, 'Image input cannot be empty')
  .refine((value) => {
    // UUID format
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
      return true;
    }
    // Data URI format
    if (/^data:image\/[a-zA-Z]+;base64,/.test(value)) {
      return true;
    }
    // Base64 without prefix
    if (/^[A-Za-z0-9+/]+=*$/.test(value) && value.length > 100) {
      return true;
    }
    // URL format
    if (/^https?:\/\/.+/.test(value)) {
      return true;
    }
    return false;
  }, 'Invalid image format. Must be UUID, URL, base64, or data URI');

// Model validation
const modelSchema = z.enum([
  'runware:100@1', // FLUX.1 Schnell
  'runware:101@1', // FLUX.1 Dev
  'runware:102@1', // FLUX Fill
  'runware:109@1', // Background removal with mask
  'runware:111@1', // Upscaling
  'bfl:1@2', // FLUX.1 Fill Pro
  'civitai:139562@297320', // SDXL models
  'civitai:403361@456538',
]);

// Output format validation
const outputFormatSchema = z.enum(['PNG', 'JPG', 'WEBP']).default('PNG');
const outputTypeSchema = z.enum(['URL', 'base64Data', 'dataURI']).default('URL');

/**
 * Operation-specific schemas
 */

// Remove Background operation
const removeBackgroundDataSchema = z.object({
  inputImage: imageInputSchema,
});

const removeBackgroundOptionsSchema = z.object({
  model: z.enum(['runware:109@1']).default('runware:109@1'),
  outputFormat: outputFormatSchema,
  outputType: outputTypeSchema,
  outputQuality: z.number().min(1).max(100).default(95),
  settings: z
    .object({
      returnOnlyMask: z.boolean().default(true),
      postProcessMask: z.boolean().default(true),
      alphaMatting: z.boolean().default(true),
      alphaMattingForegroundThreshold: z.number().min(0).max(255).default(240),
      alphaMattingBackgroundThreshold: z.number().min(0).max(255).default(15),
      alphaMattingErodeSize: z.number().min(0).max(32).default(8),
      rgba: z.array(z.number().min(0).max(255)).length(4).default([255, 255, 255, 0]),
    })
    .optional(),
});

// Inpainting operation (new workflow)
const inpaintingDataSchema = z.object({
  positivePrompt: z.string().min(2).max(3000),
  negativePrompt: z.string().min(2).max(3000).optional(),
  seedImage: imageInputSchema, // Original image
  maskImage: imageInputSchema, // Mask from background removal
});

const inpaintingOptionsSchema = z.object({
  model: modelSchema.default('bfl:1@2'),
  CFGScale: z.number().min(1).max(100).default(60),
  steps: z.number().min(1).max(100).default(50),
  outputType: outputTypeSchema,
  outputFormat: outputFormatSchema,
  outputQuality: z.number().min(1).max(100).default(95),
  numberResults: z.number().min(1).max(4).default(1),
  seed: z.number().int().default(206554476),
  checkNSFW: z.boolean().default(false),
  includeCost: z.boolean().default(true),
  providerSettings: z
    .object({
      bfl: z
        .object({
          promptUpsampling: z.boolean().default(true),
          safetyTolerance: z.number().default(2),
        })
        .optional(),
    })
    .optional(),
  // Legacy parameters for backward compatibility
  width: z.number().min(256).max(2048).default(1024),
  height: z.number().min(256).max(2048).default(1024),
  strength: z.number().min(0).max(1).default(0.8),
  scheduler: z
    .enum(['DPMSolverMultistepScheduler', 'Euler', 'EulerAncestralDiscreteScheduler', 'DDIM'])
    .default('Euler'),
  maskMargin: z.number().min(32).max(128).optional(),
});

// Legacy generateImage operation (for backward compatibility)
const generateImageDataSchema = z.object({
  prompt: z.string().min(2).max(3000),
  negativePrompt: z.string().min(2).max(3000).optional(),
  inputImage: imageInputSchema.optional(), // For img2img
});

const generateImageOptionsSchema = z.object({
  model: modelSchema.default('runware:101@1'),
  width: z.number().min(256).max(2048).default(1024),
  height: z.number().min(256).max(2048).default(1024),
  steps: z.number().min(1).max(100).default(25),
  CFGScale: z.number().min(1).max(100).default(7.5),
  strength: z.number().min(0).max(1).default(0.8),
  scheduler: z
    .enum(['DPMSolverMultistepScheduler', 'Euler', 'EulerAncestralDiscreteScheduler', 'DDIM'])
    .default('Euler'),
  seed: z.number().int().optional(),
  outputFormat: outputFormatSchema,
  outputType: outputTypeSchema,
  outputQuality: z.number().min(1).max(100).default(95),
  numberResults: z.number().min(1).max(4).default(1),
});

// Upscale operation
const upscaleDataSchema = z.object({
  inputImage: imageInputSchema,
});

const upscaleOptionsSchema = z.object({
  model: z.enum(['runware:111@1']).default('runware:111@1'),
  scale: z.number().min(1).max(8).default(2),
  outputFormat: outputFormatSchema,
  outputType: outputTypeSchema,
});

// Upload operation
const uploadDataSchema = z.object({
  base64: z.string().min(1, 'Base64 data is required'),
  filename: z.string().optional(),
});

/**
 * Main request schemas
 */

// Single request schema
export const runwareRequestSchema = z
  .object({
    operation: z.enum([
      'removeBackground',
      'inpainting',
      'generateImage',
      'upscale',
      'uploadImage',
    ]),
    data: z.union([
      removeBackgroundDataSchema,
      inpaintingDataSchema,
      generateImageDataSchema,
      upscaleDataSchema,
      uploadDataSchema,
    ]),
    options: z
      .union([
        removeBackgroundOptionsSchema,
        inpaintingOptionsSchema,
        generateImageOptionsSchema,
        upscaleOptionsSchema,
        z.object({}), // For upload operations (no options)
      ])
      .default({}),
  })
  .refine((data) => {
    // Validate data and options match the operation
    switch (data.operation) {
      case 'removeBackground':
        return (
          removeBackgroundDataSchema.safeParse(data.data).success &&
          removeBackgroundOptionsSchema.safeParse(data.options).success
        );
      case 'inpainting':
        return (
          inpaintingDataSchema.safeParse(data.data).success &&
          inpaintingOptionsSchema.safeParse(data.options).success
        );
      case 'generateImage':
        return (
          generateImageDataSchema.safeParse(data.data).success &&
          generateImageOptionsSchema.safeParse(data.options).success
        );
      case 'upscale':
        return (
          upscaleDataSchema.safeParse(data.data).success &&
          upscaleOptionsSchema.safeParse(data.options).success
        );
      case 'uploadImage':
        return uploadDataSchema.safeParse(data.data).success;
      default:
        return false;
    }
  }, 'Data and options must match the specified operation');

// Batch request schema
export const runwareBatchRequestSchema = z.object({
  files: z
    .array(
      z.object({
        filename: z.string(),
        base64: z.string().optional(),
        imageUUID: z.string().uuid().optional(),
        prompt: z.string().optional(), // For generateImage operations
      })
    )
    .min(1, 'At least one file is required'),
  operation: z.enum(['removeBackground', 'inpainting', 'generateImage', 'upscale']),
  options: z
    .union([
      removeBackgroundOptionsSchema,
      inpaintingOptionsSchema,
      generateImageOptionsSchema,
      upscaleOptionsSchema,
    ])
    .default({}),
});

/**
 * Response schemas
 */

export const runwareResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      taskUUID: uuidSchema,
      imageUUID: uuidSchema,
      imageURL: z.string().url().optional(),
      imageBase64Data: z.string().optional(),
      imageDataURI: z.string().optional(),
      cost: z.number().min(0).optional(),
      operation: z.string(),
    })
    .refine(
      (data) =>
        // At least one output format must be present
        data.imageURL || data.imageBase64Data || data.imageDataURI,
      'At least one output format (URL, base64, or dataURI) must be present'
    ),
  error: z.string().optional(),
});

export const runwareBatchResponseSchema = z.object({
  success: z.boolean(),
  results: z.array(
    z.object({
      index: z.number(),
      filename: z.string(),
      success: z.boolean(),
      data: runwareResponseSchema.shape.data.optional(),
      error: z.string().optional(),
    })
  ),
  summary: z.object({
    total: z.number(),
    successful: z.number(),
    failed: z.number(),
    totalCost: z.number().min(0),
  }),
  error: z.string().optional(),
});

/**
 * Helper functions for validation
 */

export const validateRunwareRequest = (data) => runwareRequestSchema.safeParse(data);

export const validateRunwareBatchRequest = (data) => runwareBatchRequestSchema.safeParse(data);

export const validateRunwareResponse = (data) => runwareResponseSchema.safeParse(data);

export const validateRunwareBatchResponse = (data) => runwareBatchResponseSchema.safeParse(data);
