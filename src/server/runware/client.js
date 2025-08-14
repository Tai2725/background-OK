// ----------------------------------------------------------------------

/**
 * Server-side Runware API client
 * Handles all communication with Runware API with proper error handling and retry logic
 */

import { randomUUID } from 'crypto';

const RUNWARE_API_URL = process.env.RUNWARE_API_URL || 'https://api.runware.ai';
const RUNWARE_API_KEY = process.env.RUNWARE_API_KEY;

/**
 * Generate UUID v4 for task identification
 * @returns {string} UUID v4
 */
function generateUUID() {
  return randomUUID();
}

/**
 * Runware API client class
 */
export class RunwareClient {
  constructor() {
    if (!RUNWARE_API_KEY) {
      throw new Error('RUNWARE_API_KEY environment variable is required');
    }

    this.apiUrl = RUNWARE_API_URL;
    this.apiKey = RUNWARE_API_KEY;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  /**
   * Make request to Runware API with retry logic
   * @param {Array} tasks - Array of task objects
   * @param {Object} options - Request options
   * @returns {Promise<Object>} - API response
   */
  async makeRequest(tasks, options = {}) {
    const { maxRetries = 3, retryDelay = 2000, timeout = 60000 } = options;

    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Runware API attempt ${attempt}/${maxRetries}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(`${this.apiUrl}/v1`, {
          method: 'POST',
          headers: this.defaultHeaders,
          body: JSON.stringify(tasks),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          // Log detailed error information for debugging
          console.error('❌ Runware API Error Details:', {
            status: response.status,
            statusText: response.statusText,
            errorData: JSON.stringify(errorData, null, 2),
            requestBody: JSON.stringify(tasks, null, 2),
          });

          // Log specific error details if available
          if (errorData.errors && Array.isArray(errorData.errors)) {
            console.error(
              '❌ Specific Errors:',
              errorData.errors.map((err, index) => ({
                index,
                error: err,
              }))
            );
          }

          // If it's a server error (5xx) and we have attempts left, retry
          if (response.status >= 500 && attempt < maxRetries) {
            console.log(`Server error ${response.status}, retrying in ${retryDelay}ms...`);
            await this.delay(retryDelay * attempt);
            continue;
          }

          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // Validate response structure
        if (!result.data || !Array.isArray(result.data)) {
          throw new Error('Invalid response format from Runware API');
        }

        // If data is empty and we have attempts left, retry
        if (result.data.length === 0 && attempt < maxRetries) {
          console.log(`Empty data response, retrying in ${retryDelay}ms...`);
          await this.delay(retryDelay * attempt);
          continue;
        }

        // If we still have empty data after all attempts
        if (result.data.length === 0) {
          throw new Error('Runware API returned empty data after multiple attempts');
        }

        return result;
      } catch (error) {
        lastError = error;
        console.error(`Runware API attempt ${attempt} failed:`, error.message);

        // If it's the last attempt, throw the error
        if (attempt === maxRetries) {
          break;
        }

        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (error.message.includes('HTTP error! status: 4') && !error.message.includes('429')) {
          break;
        }

        // Wait before retrying
        await this.delay(retryDelay * attempt);
      }
    }

    throw new Error(
      `Runware API failed after ${maxRetries} attempts: ${lastError?.message || lastError?.toString() || 'Unknown error'}`
    );
  }

  /**
   * Remove background and generate mask
   * @param {string} inputImage - Image URL, UUID, or base64
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} - Processing result
   */
  async removeBackground(inputImage, options = {}) {
    try {
      const taskUUID = generateUUID();

      const task = {
        taskType: 'imageBackgroundRemoval',
        taskUUID,
        inputImage,
        model: options.model || 'runware:109@1',
        outputFormat: options.outputFormat || 'PNG',
        outputType: options.outputType || 'URL',
        outputQuality: options.outputQuality || 95,
        includeCost: true,
      };

      // Add settings for mask generation (only supported by runware:109@1)
      if (options.settings && (options.model === 'runware:109@1' || !options.model)) {
        task.settings = {
          returnOnlyMask: true,
          postProcessMask: true,
          alphaMatting: true,
          alphaMattingForegroundThreshold: 240,
          alphaMattingBackgroundThreshold: 15,
          alphaMattingErodeSize: 8,
          rgba: [255, 255, 255, 0],
          ...options.settings,
        };
      }

      const result = await this.makeRequest([task]);
      const normalizedData = this.normalizeResponse(result.data[0], 'removeBackground');

      // Return format expected by workflow manager
      return {
        success: true,
        data: normalizedData,
        cost: normalizedData.cost || 0,
      };
    } catch (error) {
      console.error('Background removal error:', error);
      return {
        success: false,
        error: error.message || error.toString() || 'Unknown background removal error',
        cost: 0,
      };
    }
  }

  /**
   * Inpainting with seedImage and maskImage (new workflow)
   * @param {Object} params - Inpainting parameters
   * @returns {Promise<Object>} - Processing result
   */
  async inpainting({ positivePrompt, negativePrompt, seedImage, maskImage, options = {} }) {
    try {
      // Validate required parameters
      if (!positivePrompt || !seedImage || !maskImage) {
        throw new Error(
          'Missing required parameters: positivePrompt, seedImage, and maskImage are required'
        );
      }

      const taskUUID = generateUUID();

      const task = {
        taskType: 'imageInference',
        taskUUID,
        model: options.model || 'bfl:1@2',
        positivePrompt,
        seedImage,
        maskImage,
        CFGScale: options.CFGScale || 60,
        steps: options.steps || 50,
        outputType: options.outputType || 'URL',
        outputFormat: options.outputFormat || 'PNG',
        outputQuality: options.outputQuality || 95,
        numberResults: options.numberResults || 1,
        seed: options.seed || 206554476,
        checkNSFW: options.checkNSFW || false,
        includeCost: options.includeCost !== undefined ? options.includeCost : true,
      };

      // Model-specific parameter handling
      const modelId = task.model;

      // BFL models (FLUX.1 Fill Pro) - Use exact parameters from sample request
      if (modelId === 'bfl:1@2') {
        task.providerSettings = {
          bfl: {
            promptUpsampling:
              options.providerSettings?.bfl?.promptUpsampling !== undefined
                ? options.providerSettings.bfl.promptUpsampling
                : true,
            safetyTolerance:
              options.providerSettings?.bfl?.safetyTolerance !== undefined
                ? options.providerSettings.bfl.safetyTolerance
                : 2,
          },
        };
      }

      // FLUX Fill models (runware:102@1)
      else if (modelId === 'runware:102@1') {
        // FLUX Fill model - no additional parameters needed
        // maskMargin and strength are not supported by this model
      }

      // SDXL Inpainting models
      else if (modelId === 'civitai:403361@456538') {
        // SDXL supports both strength and maskMargin
        if (options.strength !== undefined) {
          task.strength = options.strength;
        }
        if (options.maskMargin) {
          task.maskMargin = options.maskMargin;
        }
      }

      // Add optional parameters - BFL models don't support negativePrompt
      if (negativePrompt && modelId !== 'bfl:1@2') {
        task.negativePrompt = negativePrompt;
      }

      // Log the request for debugging
      console.log('🔍 Inpainting request:', {
        taskType: task.taskType,
        model: task.model,
        positivePrompt: task.positivePrompt.substring(0, 100) + '...',
        seedImage: task.seedImage.substring(0, 50) + '...',
        maskImage: task.maskImage.substring(0, 50) + '...',
        width: task.width,
        height: task.height,
        steps: task.steps,
        CFGScale: task.CFGScale,
        hasProviderSettings: !!task.providerSettings,
        hasMaskMargin: !!task.maskMargin,
        hasStrength: !!task.strength,
      });

      const result = await this.makeRequest([task]);
      const normalizedData = this.normalizeResponse(result.data[0], 'inpainting');

      // Return format expected by workflow manager
      return {
        success: true,
        data: normalizedData,
        cost: normalizedData.cost || 0,
      };
    } catch (error) {
      console.error('Inpainting error:', error);
      return {
        success: false,
        error: error.message || error.toString() || 'Unknown inpainting error',
        cost: 0,
      };
    }
  }

  /**
   * Legacy generateImage method (for backward compatibility)
   * @param {string} prompt - Text prompt
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - Processing result
   */
  async generateImage(prompt, options = {}) {
    const taskUUID = generateUUID();

    const task = {
      taskType: 'imageInference',
      taskUUID,
      positivePrompt: prompt,
      model: options.model || 'runware:101@1',
      width: options.width || 1024,
      height: options.height || 1024,
      steps: options.steps || 25,
      CFGScale: options.CFGScale || 7.5,
      outputFormat: options.outputFormat || 'PNG',
      outputType: options.outputType || 'URL',
      numberResults: options.numberResults || 1,
      includeCost: true,
    };

    // Add optional parameters
    if (options.negativePrompt) {
      task.negativePrompt = options.negativePrompt;
    }

    if (options.inputImage) {
      task.seedImage = options.inputImage;
      task.strength = options.strength || 0.8;
    }

    if (options.seed !== undefined) {
      task.seed = options.seed;
    }

    if (options.scheduler) {
      task.scheduler = options.scheduler;
    }

    const result = await this.makeRequest([task]);
    return this.normalizeResponse(result.data[0], 'generateImage');
  }

  /**
   * Upscale image
   * @param {string} inputImage - Image URL, UUID, or base64
   * @param {Object} options - Upscaling options
   * @returns {Promise<Object>} - Processing result
   */
  async upscaleImage(inputImage, options = {}) {
    const taskUUID = generateUUID();

    const task = {
      taskType: 'imageUpscaling',
      taskUUID,
      inputImage,
      model: options.model || 'runware:111@1',
      scale: options.scale || 2,
      outputFormat: options.outputFormat || 'PNG',
      outputType: options.outputType || 'URL',
      includeCost: true,
    };

    const result = await this.makeRequest([task]);
    return this.normalizeResponse(result.data[0], 'upscale');
  }

  /**
   * Upload image to Runware
   * @param {string} base64Data - Base64 image data
   * @param {string} filename - Optional filename
   * @returns {Promise<Object>} - Upload result
   */
  async uploadImage(base64Data, filename = 'uploaded-image.png') {
    const taskUUID = generateUUID();

    const task = {
      taskType: 'imageUpload',
      taskUUID,
      image: base64Data,
      filename,
    };

    const result = await this.makeRequest([task]);
    return this.normalizeResponse(result.data[0], 'uploadImage');
  }

  /**
   * Normalize API response to consistent format
   * @param {Object} taskResult - Raw task result from Runware
   * @param {string} operation - Operation type
   * @returns {Object} - Normalized response
   */
  normalizeResponse(taskResult, operation) {
    if (!taskResult) {
      throw new Error('No task result returned from Runware API');
    }

    // Validate required fields
    const requiredFields = ['taskUUID', 'imageUUID'];
    const missingFields = requiredFields.filter((field) => !taskResult[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields in response: ${missingFields.join(', ')}`);
    }

    // Ensure at least one output format is present
    if (!taskResult.imageURL && !taskResult.imageBase64Data && !taskResult.imageDataURI) {
      throw new Error('No image output format (URL, base64, or dataURI) in response');
    }

    return {
      taskUUID: taskResult.taskUUID,
      imageUUID: taskResult.imageUUID,
      imageURL: taskResult.imageURL || null,
      imageBase64Data: taskResult.imageBase64Data || null,
      imageDataURI: taskResult.imageDataURI || null,
      cost: taskResult.cost || 0,
      operation,
    };
  }

  /**
   * Utility method for delays
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} - Promise that resolves after delay
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Test API connection
   * @returns {Promise<Object>} - Connection test result
   */
  async testConnection() {
    try {
      const taskUUID = generateUUID();
      const testTask = {
        taskType: 'imageInference',
        taskUUID,
        positivePrompt: 'test connection',
        model: 'runware:100@1',
        width: 512,
        height: 512,
        steps: 1,
        numberResults: 1,
        outputType: 'URL',
      };

      await this.makeRequest([testTask]);

      return {
        success: true,
        message: 'Runware API connection successful',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

/**
 * Default export - singleton instance
 */
const runwareClient = new RunwareClient();
export default runwareClient;
