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
 * Tạo UUID v4
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

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
 * POST /api/runware
 * Proxy requests to Runware API with authentication
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
    const { operation, data, options = {} } = body;

    let requestBody;
    const taskUUID = generateUUID();

    // Build request based on operation type
    switch (operation) {
      case 'removeBackground':
        const removeBackgroundTask = {
          taskType: 'imageBackgroundRemoval',
          taskUUID,
          inputImage: data.inputImage,
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
          inputImage: data.inputImage,
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
          positivePrompt: data.prompt,
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

        // Add inputImage for img2img generation if provided
        if (data.inputImage) {
          requestBody[0].inputImage = data.inputImage;
          requestBody[0].strength = options.strength || 0.8;
        }
        break;

      case 'uploadImage':
        requestBody = [{
          taskType: 'imageUpload',
          taskUUID,
          image: data.base64,
          filename: data.filename || 'uploaded-image.png',
        }];
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported operation: ${operation}` },
          { status: 400 }
        );
    }

    // Make request to Runware API
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
      return NextResponse.json(
        {
          error: errorData.message || `Runware API error: ${response.status}`,
          details: errorData
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Debug log để kiểm tra response từ Runware
    console.log('Runware API response:', JSON.stringify(result, null, 2));

    if (!result.data || result.data.length === 0) {
      return NextResponse.json(
        { error: 'Không nhận được kết quả từ Runware API' },
        { status: 500 }
      );
    }

    const taskResult = result.data[0];

    // Debug log để kiểm tra task result
    console.log('Task result:', JSON.stringify(taskResult, null, 2));

    // Log usage for billing/monitoring
    console.log(`Runware API usage - User: ${authResult.user.id}, Operation: ${operation}, Cost: ${taskResult.cost || 0}`);

    return NextResponse.json({
      success: true,
      data: {
        taskUUID: taskResult.taskUUID,
        imageUUID: taskResult.imageUUID,
        imageURL: taskResult.imageURL,
        imageBase64Data: taskResult.imageBase64Data,
        imageDataURI: taskResult.imageDataURI,
        cost: taskResult.cost,
        operation,
      },
    });

  } catch (error) {
    console.error('Runware API proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/runware
 * Test connection to Runware API
 */
export async function GET(request) {
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

    // Test with a simple request
    const taskUUID = generateUUID();
    const requestBody = [{
      taskType: 'imageInference',
      taskUUID,
      positivePrompt: 'test connection',
      model: 'runware:100@1',
      width: 512,
      height: 512,
      steps: 1,
      numberResults: 1,
      outputType: 'URL',
    }];

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
      return NextResponse.json(
        {
          success: false,
          error: errorData.message || `HTTP error! status: ${response.status}`
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Kết nối Runware API thành công',
    });

  } catch (error) {
    console.error('Test connection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Không thể kết nối đến Runware API'
      },
      { status: 500 }
    );
  }
}
