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
    console.log('📥 Received request body:', JSON.stringify(body, null, 2));

    const { operation, data, options = {} } = body;

    // Validate required fields
    if (!operation) {
      console.error('❌ Missing operation in request body');
      return NextResponse.json(
        { error: 'Operation is required' },
        { status: 400 }
      );
    }

    if (!data) {
      console.error('❌ Missing data in request body');
      return NextResponse.json(
        { error: 'Data is required' },
        { status: 400 }
      );
    }

    console.log(`🔄 Processing operation: ${operation}`);
    console.log(`📋 Data:`, JSON.stringify(data, null, 2));
    console.log(`⚙️ Options:`, JSON.stringify(options, null, 2));

    let requestBody;
    const taskUUID = generateUUID();
    console.log(`🆔 Generated taskUUID: ${taskUUID}`);

    // Build request based on operation type
    switch (operation) {
      case 'removeBackground':
        // Validate required fields for removeBackground
        if (!data.inputImage) {
          console.error('❌ Missing inputImage for removeBackground operation');
          return NextResponse.json(
            { error: 'inputImage is required for removeBackground operation' },
            { status: 400 }
          );
        }

        // Validate inputImage format
        const inputImage = data.inputImage.trim();
        if (!inputImage) {
          console.error('❌ Empty inputImage for removeBackground operation');
          return NextResponse.json(
            { error: 'inputImage cannot be empty' },
            { status: 400 }
          );
        }

        // Check if inputImage is a valid URL or base64
        const isValidUrl = /^https?:\/\/.+/.test(inputImage);
        const isValidBase64 = /^data:image\/[a-zA-Z]+;base64,/.test(inputImage) || /^[A-Za-z0-9+/]+=*$/.test(inputImage);

        if (!isValidUrl && !isValidBase64) {
          console.error('❌ Invalid inputImage format:', inputImage.substring(0, 100) + '...');
          return NextResponse.json(
            { error: 'inputImage must be a valid URL or base64 string' },
            { status: 400 }
          );
        }

        console.log(`🖼️ Input image: ${inputImage.substring(0, 100)}${inputImage.length > 100 ? '...' : ''}`);
        console.log(`🎯 Model: ${options.model || 'runware:109@1'}`);
        console.log(`📏 Input image length: ${inputImage.length}`);
        console.log(`🔗 Is URL: ${isValidUrl}`);
        console.log(`📊 Is Base64: ${isValidBase64}`);

        const removeBackgroundTask = {
          taskType: 'imageBackgroundRemoval',
          taskUUID,
          inputImage,
          model: options.model || 'runware:109@1', // Default to runware:109@1 for mask generation
          outputFormat: options.outputFormat || 'PNG',
          outputType: options.outputType || 'URL',
          outputQuality: options.outputQuality || 95,
          includeCost: true,
        };

        // Add settings object if provided (only supported by runware:109@1)
        if (options.settings && options.model === 'runware:109@1') {
          removeBackgroundTask.settings = options.settings;
          console.log(`⚙️ Added settings for runware:109@1:`, JSON.stringify(options.settings, null, 2));
        }

        requestBody = [removeBackgroundTask];
        console.log(`📤 Built removeBackground request:`, JSON.stringify(requestBody, null, 2));
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

    // Make request to Runware API with retry logic
    let result;
    let attempts = 0;
    const maxAttempts = 3;
    const retryDelay = 2000; // 2 seconds

    while (attempts < maxAttempts) {
      attempts++;

      try {
        console.log(`Runware API attempt ${attempts}/${maxAttempts} for operation: ${operation}`);

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

          // If it's a server error (5xx) and we have attempts left, retry
          if (response.status >= 500 && attempts < maxAttempts) {
            console.log(`Server error ${response.status}, retrying in ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          }

          return NextResponse.json(
            {
              error: errorData.message || `Runware API error: ${response.status}`,
              details: errorData
            },
            { status: response.status }
          );
        }

        result = await response.json();

        // Debug log để kiểm tra response từ Runware
        console.log('Runware API response:', JSON.stringify(result, null, 2));

        // Check if result has data
        if (!result.data || !Array.isArray(result.data)) {
          throw new Error('Invalid response format from Runware API');
        }

        // If data is empty and we have attempts left, retry
        if (result.data.length === 0 && attempts < maxAttempts) {
          console.log(`Empty data response, retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }

        // If we still have empty data after all attempts
        if (result.data.length === 0) {
          return NextResponse.json(
            { error: 'Runware API trả về dữ liệu rỗng sau nhiều lần thử' },
            { status: 500 }
          );
        }

        // Success - break out of retry loop
        break;

      } catch (fetchError) {
        console.error(`Runware API fetch error (attempt ${attempts}):`, fetchError);

        // If it's the last attempt, throw the error
        if (attempts === maxAttempts) {
          return NextResponse.json(
            { error: 'Không thể kết nối đến Runware API sau nhiều lần thử' },
            { status: 500 }
          );
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    const taskResult = result.data[0];

    // Validate task result
    if (!taskResult) {
      return NextResponse.json(
        { error: 'Không có kết quả task từ Runware API' },
        { status: 500 }
      );
    }

    // Debug log để kiểm tra task result
    console.log('Task result:', JSON.stringify(taskResult, null, 2));

    // Validate required fields based on operation
    const requiredFields = ['taskUUID', 'imageUUID'];
    const missingFields = requiredFields.filter(field => !taskResult[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Thiếu các trường bắt buộc trong response: ${missingFields.join(', ')}` },
        { status: 500 }
      );
    }

    // Log usage for billing/monitoring
    console.log(`Runware API usage - User: ${authResult.user.id}, Operation: ${operation}, Cost: ${taskResult.cost || 0}`);

    // Normalize response data - ensure consistent field names
    const responseData = {
      taskUUID: taskResult.taskUUID,
      imageUUID: taskResult.imageUUID,
      imageURL: taskResult.imageURL || null,
      imageBase64Data: taskResult.imageBase64Data || null,
      imageDataURI: taskResult.imageDataURI || null,
      cost: taskResult.cost || 0,
      operation,
    };

    // Validate that we have at least one output format
    if (!responseData.imageURL && !responseData.imageBase64Data && !responseData.imageDataURI) {
      return NextResponse.json(
        { error: 'Không có URL hoặc dữ liệu hình ảnh trong response từ Runware API' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: responseData,
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
