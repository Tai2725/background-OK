import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ----------------------------------------------------------------------

const RUNWARE_API_URL = process.env.RUNWARE_API_URL || 'https://api.runware.ai';
const RUNWARE_API_KEY = process.env.RUNWARE_API_KEY;

// Initialize Supabase client for authentication
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Verify user authentication
 */
async function verifyAuth(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'Missing or invalid authorization header' };
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { error: 'Invalid or expired token' };
    }

    return { user };
  } catch (error) {
    return { error: 'Authentication failed' };
  }
}

/**
 * Convert File/Blob to base64 string
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Remove data:image/...;base64, prefix
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Process single file
 */
async function processSingleFile(fileData, operation, options, user) {
  try {
    let result;

    // First upload the file if it's not already uploaded
    let imageUUID = fileData.imageUUID;

    if (!imageUUID && fileData.base64) {
      const uploadResponse = await fetch(`${RUNWARE_API_URL}/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RUNWARE_API_KEY}`,
        },
        body: JSON.stringify([{
          taskType: 'imageUpload',
          taskUUID: `upload-${Date.now()}`,
          image: fileData.base64,
          filename: fileData.filename || 'uploaded-image.png',
        }]),
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      const uploadResult = await uploadResponse.json();
      if (!uploadResult.data || uploadResult.data.length === 0) {
        throw new Error('Upload failed: No data returned');
      }

      imageUUID = uploadResult.data[0].imageUUID;
    }

    // Now process the image
    const taskUUID = `${operation}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let requestBody;

    switch (operation) {
      case 'removeBackground':
        const removeBackgroundTask = {
          taskType: 'imageBackgroundRemoval',
          taskUUID,
          inputImage: imageUUID,
          model: options.model || 'runware:109@1', // Default to runware:109@1 for mask generation
          outputFormat: options.outputFormat || 'PNG',
          outputType: options.outputType || 'URL',
          outputQuality: options.outputQuality || 95,
          includeCost: true,
        };

        // Add settings object if provided (only supported by runware:109@1)
        if (options.settings && options.model === 'runware:109@1') {
          removeBackgroundTask.settings = options.settings;
        }

        requestBody = [removeBackgroundTask];
        break;

      case 'upscale':
        requestBody = [{
          taskType: 'imageUpscaling',
          taskUUID,
          inputImage: imageUUID,
          model: options.model || 'runware:111@1',
          scale: options.scale || 2,
          outputFormat: options.outputFormat || 'PNG',
          outputType: options.outputType || 'URL',
          includeCost: true,
        }];
        break;

      case 'generateImage':
        requestBody = [{
          taskType: 'imageInference',
          taskUUID,
          positivePrompt: fileData.prompt || fileData.filename,
          model: options.model || 'runware:100@1',
          width: options.width || 1024,
          height: options.height || 1024,
          steps: options.steps || 20,
          CFGScale: options.CFGScale || 7.5,
          outputFormat: options.outputFormat || 'PNG',
          outputType: options.outputType || 'URL',
          includeCost: true,
          numberResults: options.numberResults || 1,
        }];
        break;

      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }

    const response = await fetch(`${RUNWARE_API_URL}/v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RUNWARE_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const processResult = await response.json();

    if (!processResult.data || processResult.data.length === 0) {
      throw new Error('No result data returned from Runware API');
    }

    const taskResult = processResult.data[0];

    // Log usage
    console.log(`Runware batch processing - User: ${user.id}, Operation: ${operation}, File: ${fileData.filename}, Cost: ${taskResult.cost || 0}`);

    return {
      success: true,
      data: {
        taskUUID: taskResult.taskUUID,
        imageUUID: taskResult.imageUUID,
        imageURL: taskResult.imageURL,
        imageBase64Data: taskResult.imageBase64Data,
        imageDataURI: taskResult.imageDataURI,
        cost: taskResult.cost,
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
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    // Check if API key is configured
    if (!RUNWARE_API_KEY) {
      return NextResponse.json(
        { error: 'Runware API key chưa được cấu hình' },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { files, operation, options = {} } = body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: 'Files array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (!operation) {
      return NextResponse.json(
        { error: 'Operation is required' },
        { status: 400 }
      );
    }

    // Process files sequentially to avoid overwhelming the API
    const results = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        const result = await processSingleFile(file, operation, options, authResult.user);
        results.push({
          index: i,
          filename: file.filename,
          success: result.success,
          data: result.data,
          error: result.error,
        });

        // Add a small delay between requests to be respectful to the API
        if (i < files.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
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
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
