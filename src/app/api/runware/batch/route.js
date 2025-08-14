import { NextResponse } from 'next/server';

import runwareClient from '../../../../server/runware/client.js';
import { verifyAuth } from '../../../../server/auth/verify-auth.js';
import { validateRunwareBatchRequest } from '../../../../lib/schemas/runware-schemas.js';

// ----------------------------------------------------------------------

/**
 * Process single file using new Runware client
 */
async function processSingleFile(fileData, operation, options, user) {
  try {
    // First upload the file if it's not already uploaded
    let inputImage = fileData.imageUUID;

    if (!inputImage && fileData.base64) {
      const uploadResult = await runwareClient.uploadImage(
        fileData.base64,
        fileData.filename || 'uploaded-image.png'
      );
      inputImage = uploadResult.imageUUID;
    }

    // Now process the image using new client
    let result;

    switch (operation) {
      case 'removeBackground':
        result = await runwareClient.removeBackground(inputImage, options);
        break;

      case 'inpainting':
        if (!fileData.seedImage || !fileData.maskImage) {
          throw new Error('Inpainting requires both seedImage and maskImage');
        }
        result = await runwareClient.inpainting({
          positivePrompt: fileData.prompt || 'professional background',
          negativePrompt: options.negativePrompt,
          seedImage: fileData.seedImage,
          maskImage: fileData.maskImage,
          options,
        });
        break;

      case 'upscale':
        result = await runwareClient.upscaleImage(inputImage, options);
        break;

      case 'generateImage':
        result = await runwareClient.generateImage(
          fileData.prompt || fileData.filename || 'professional image',
          {
            ...options,
            inputImage, // For img2img if needed
          }
        );
        break;

      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }

    // Log usage
    console.log(
      `Runware batch processing - User: ${user.id}, Operation: ${operation}, File: ${fileData.filename}, Cost: ${result.cost || 0}`
    );

    return {
      success: true,
      data: {
        ...result,
        operation,
        filename: fileData.filename,
      },
    };
  } catch (error) {
    console.error(`Processing error for file ${fileData.filename}:`, error);
    return {
      success: false,
      error: error.message,
      filename: fileData.filename,
    };
  }
}

/**
 * POST /api/runware/batch
 * Process multiple files in batch
 */
export async function POST(request) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = validateRunwareBatchRequest(body);

    if (!validation.success) {
      console.error('❌ Batch request validation failed:', validation.error.errors);
      return NextResponse.json(
        {
          error: 'Invalid request format',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { files, operation, options = {} } = validation.data;

    console.log(`🔄 Processing batch operation: ${operation} for ${files.length} files`);

    // Process files sequentially to avoid overwhelming the API
    const results = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        const result = await processSingleFile(file, operation, options, user);
        results.push({
          index: i,
          filename: file.filename,
          success: result.success,
          data: result.data,
          error: result.error,
        });

        // Add a small delay between requests to be respectful to the API
        if (i < files.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        results.push({
          index: i,
          filename: file.filename,
          success: false,
          error: error.message,
        });
      }
    }

    // Calculate summary
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);
    const totalCost = successful.reduce((sum, r) => sum + (r.data?.cost || 0), 0);

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: files.length,
        successful: successful.length,
        failed: failed.length,
        totalCost,
      },
    });
  } catch (error) {
    console.error('Batch processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
