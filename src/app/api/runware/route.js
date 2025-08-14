// ----------------------------------------------------------------------

/**
 * Main Runware API Route
 * Handles basic operations like removeBackground, inpainting, generateImage, upscale
 */

import { z } from 'zod';
import { NextResponse } from 'next/server';

import runwareClient from '../../../server/runware/client.js';
import { verifyAuth } from '../../../server/auth/verify-auth.js';

// Validation schemas
const removeBackgroundSchema = z.object({
  operation: z.literal('removeBackground'),
  data: z.object({
    inputImage: z.string().min(1, 'Input image is required'),
  }),
  options: z
    .object({
      model: z.string().default('runware:109@1'),
      outputFormat: z.string().default('PNG'),
      outputType: z.string().default('URL'),
      outputQuality: z.number().min(1).max(100).default(95),
      settings: z
        .object({
          returnOnlyMask: z.boolean().default(true),
        })
        .optional(),
    })
    .optional(),
});

const inpaintingSchema = z.object({
  operation: z.literal('inpainting'),
  data: z.object({
    positivePrompt: z.string().min(1, 'Positive prompt is required'),
    negativePrompt: z.string().optional(),
    seedImage: z.string().min(1, 'Seed image is required'),
    maskImage: z.string().min(1, 'Mask image is required'),
  }),
  options: z
    .object({
      model: z.string().default('bfl:1@2'),
      CFGScale: z.number().min(1).max(100).default(60),
      steps: z.number().min(1).max(100).default(50),
      outputType: z.string().default('URL'),
      outputFormat: z.string().default('PNG'),
      outputQuality: z.number().min(1).max(100).default(95),
      numberResults: z.number().min(1).max(4).default(1),
      seed: z.number().default(206554476),
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
    })
    .optional(),
});

const generateImageSchema = z.object({
  operation: z.literal('generateImage'),
  data: z.object({
    prompt: z.string().min(1, 'Prompt is required'),
    negativePrompt: z.string().optional(),
    inputImage: z.string().optional(),
  }),
  options: z
    .object({
      model: z.string().default('runware:100@1'),
      width: z.number().default(1024),
      height: z.number().default(1024),
      steps: z.number().min(1).max(100).default(20),
      CFGScale: z.number().min(1).max(100).default(7.5),
      strength: z.number().min(0).max(1).default(0.8),
      outputFormat: z.string().default('PNG'),
      outputType: z.string().default('URL'),
      outputQuality: z.number().min(1).max(100).default(95),
      numberResults: z.number().min(1).max(4).default(1),
      scheduler: z.string().optional(),
      seed: z.number().optional(),
    })
    .optional(),
});

const upscaleSchema = z.object({
  operation: z.literal('upscale'),
  data: z.object({
    inputImage: z.string().min(1, 'Input image is required'),
  }),
  options: z
    .object({
      model: z.string().default('runware:109@1'),
      scale: z.number().min(1).max(4).default(2),
      outputFormat: z.string().default('PNG'),
      outputType: z.string().default('URL'),
    })
    .optional(),
});

const requestSchema = z.union([
  removeBackgroundSchema,
  inpaintingSchema,
  generateImageSchema,
  upscaleSchema,
]);

/**
 * POST /api/runware
 * Handle basic Runware operations
 */
export async function POST(request) {
  try {
    console.log('🚀 Main Runware API called');

    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.id);

    // Parse and validate request
    const body = await request.json();
    console.log('📋 Request body:', JSON.stringify(body, null, 2));

    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      console.error('❌ Request validation failed:', validation.error.errors);
      return NextResponse.json(
        {
          error: 'Invalid request format',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { operation, data, options = {} } = validation.data;
    console.log(`🎯 Operation: ${operation} for user: ${user.id}`);

    let result;

    switch (operation) {
      case 'removeBackground':
        console.log('🔧 Executing removeBackground...');
        result = await runwareClient.removeBackground(data.inputImage, options);
        break;

      case 'inpainting':
        console.log('🎨 Executing inpainting...');
        result = await runwareClient.inpainting({
          positivePrompt: data.positivePrompt,
          negativePrompt: data.negativePrompt,
          seedImage: data.seedImage,
          maskImage: data.maskImage,
          options,
        });
        break;

      case 'generateImage':
        console.log('🖼️ Executing generateImage...');
        result = await runwareClient.generateImage(data.prompt, {
          ...options,
          negativePrompt: data.negativePrompt,
          inputImage: data.inputImage,
        });
        break;

      case 'upscale':
        console.log('📈 Executing upscale...');
        result = await runwareClient.upscaleImage(data.inputImage, options);
        break;

      default:
        console.error('❌ Unsupported operation:', operation);
        return NextResponse.json({ error: `Unsupported operation: ${operation}` }, { status: 400 });
    }

    console.log('✅ Operation completed successfully');
    console.log('📤 Result:', JSON.stringify(result, null, 2));

    // runwareClient already returns { success: true, data: {...} } format
    // So we return it directly without double wrapping
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Main Runware API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/runware
 * Get API status and available operations
 */
export async function GET(request) {
  try {
    console.log('📊 Runware API status check');

    // Verify authentication
    const { error: authError } = await verifyAuth(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      data: {
        status: 'active',
        supportedOperations: ['removeBackground', 'inpainting', 'generateImage', 'upscale'],
        endpoints: {
          main: '/api/runware',
          batch: '/api/runware/batch',
        },
      },
    });
  } catch (error) {
    console.error('❌ Runware API status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
