// ----------------------------------------------------------------------

import { createClient } from '@supabase/supabase-js';

import { CONFIG } from 'src/global-config';

/**
 * Service để tích hợp với Runware API thông qua Next.js API routes
 * Bảo mật API key ở phía server
 */
export class RunwareService {
  static API_BASE_URL = '/api/runware';

  // Initialize Supabase client
  static supabase = createClient(CONFIG.supabase.url, CONFIG.supabase.key);

  // Error tracking để tránh spam logs
  static errorTracker = new Map();

  /**
   * Log error một cách thông minh, tránh spam
   * @param {string} operation - Tên operation
   * @param {string} errorKey - Key để track error
   * @param {Object} errorData - Dữ liệu error
   */
  static logError(operation, errorKey, errorData) {
    const now = Date.now();
    const lastLogged = this.errorTracker.get(errorKey);

    // Chỉ log nếu chưa log trong 30 giây qua
    if (!lastLogged || now - lastLogged > 30000) {
      console.error(`❌ [${operation}] ${errorKey}:`, errorData);
      this.errorTracker.set(errorKey, now);
    }
  }

  /**
   * Log success một cách tóm tắt
   * @param {string} operation - Tên operation
   * @param {Object} data - Dữ liệu success
   */
  static logSuccess(operation, data) {
    console.log(`✅ [${operation}] Success:`, data);
  }

  /**
   * Log request start
   * @param {string} operation - Tên operation
   * @param {Object} data - Dữ liệu request
   */
  static logRequestStart(operation, data) {
    console.log(`🔧 [${operation}] Request initiated:`, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Tạo error message thông minh dựa trên HTTP status code
   * @param {number} status - HTTP status code
   * @param {Object} errorData - Error data từ response
   * @returns {Object} - Error details
   */
  static createErrorDetails(status, errorData = {}) {
    // Handle server errors (5xx)
    if (status >= 500) {
      return {
        message: 'Lỗi server - Vui lòng thử lại sau',
        type: 'SERVER_ERROR',
        details: 'Internal server error',
        status,
      };
    }

    const errorMap = {
      400: {
        message: 'Yêu cầu không hợp lệ - Kiểm tra lại tham số đầu vào',
        type: 'VALIDATION_ERROR',
        details: errorData.message || errorData.error || 'Invalid request parameters',
      },
      401: {
        message: 'Không có quyền truy cập - Kiểm tra API key',
        type: 'AUTH_ERROR',
        details: 'Unauthorized access',
      },
      403: {
        message: 'Bị từ chối truy cập - Tài khoản có thể bị giới hạn',
        type: 'FORBIDDEN_ERROR',
        details: errorData.message || 'Access forbidden',
      },
      404: {
        message: 'API endpoint không tồn tại',
        type: 'ENDPOINT_ERROR',
        details: 'API endpoint not found',
        solution: 'Kiểm tra file src/app/api/runware/route.js',
      },
      429: {
        message: 'Quá nhiều yêu cầu - Vui lòng thử lại sau',
        type: 'RATE_LIMIT_ERROR',
        details: 'Rate limit exceeded',
      },
    };

    return (
      errorMap[status] || {
        message: `Lỗi HTTP ${status}`,
        type: 'HTTP_ERROR',
        details: errorData.message || errorData.error || 'Unknown error',
        status,
      }
    );
  }

  /**
   * Tạo UUID v4 cho task
   * @returns {string} UUID v4
   */
  static generateUUID() {
    // Use crypto.randomUUID() if available, fallback to manual generation
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    // Fallback for environments without crypto.randomUUID()
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function generateUUIDChar(c) {
      const r = Math.floor(Math.random() * 16);
      const v = c === 'x' ? r : (r & 0x3) | 0x8; // eslint-disable-line no-bitwise
      return v.toString(16);
    });
  }

  /**
   * Lấy access token từ Supabase session
   * @returns {Promise<string|null>} Access token
   */
  static async getAccessToken() {
    try {
      const {
        data: { session },
      } = await this.supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Tạo headers cho API request
   * @returns {Promise<Object>} Headers object
   */
  static async createHeaders() {
    const token = await this.getAccessToken();
    if (!token) {
      throw new Error('Bạn cần đăng nhập để sử dụng tính năng này');
    }

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Tạo mask từ hình ảnh (thay vì xóa background)
   * @param {string} inputImage - URL hoặc base64 của hình ảnh
   * @param {Object} options - Tùy chọn xử lý
   * @returns {Promise<Object>} - Kết quả xử lý
   */
  static async removeBackground(inputImage, options = {}) {
    try {
      if (!inputImage) {
        throw new Error('Hình ảnh đầu vào là bắt buộc');
      }

      const startTime = Date.now();

      this.logRequestStart('REMOVE_BG', {
        model: options.model || 'runware:109@1',
        hasInputImage: !!inputImage,
        outputFormat: options.outputFormat || 'PNG',
        outputQuality: options.outputQuality || 95,
        returnOnlyMask: options.settings?.returnOnlyMask || true,
      });

      const headers = await this.createHeaders();

      // Optimized settings for mask generation with runware:109@1 model
      const settings = {
        returnOnlyMask: true, // Trả về mask thay vì ảnh đã xóa background
        postProcessMask: true, // Cải thiện chất lượng mask
        alphaMatting: true, // Sử dụng alpha matting để làm mịn edges
        alphaMattingForegroundThreshold: 240, // Threshold cho foreground (cao hơn = chính xác hơn)
        alphaMattingBackgroundThreshold: 15, // Threshold cho background (thấp hơn = ít tính toán hơn)
        alphaMattingErodeSize: 8, // Kích thước erosion để làm mịn edges
        rgba: [255, 255, 255, 0], // Màu background trong suốt
        ...options.settings, // Cho phép override settings nếu cần
      };

      const requestPayload = {
        operation: 'removeBackground',
        data: { inputImage },
        options: {
          model: 'runware:109@1', // Bắt buộc sử dụng model này để có returnOnlyMask
          outputFormat: options.outputFormat || 'PNG',
          outputType: options.outputType || 'URL',
          outputQuality: options.outputQuality || 95,
          settings, // Truyền settings object
        },
      };

      const response = await fetch(this.API_BASE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestPayload),
      });

      console.log(
        `📡 [REMOVE_BG] Response: ${response.status} ${response.statusText} (${Date.now() - startTime}ms)`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Tạo error message dựa trên status code
        let errorMessage = '';
        let errorDetails = {};

        switch (response.status) {
          case 400:
            errorMessage = 'Yêu cầu không hợp lệ - Kiểm tra lại hình ảnh đầu vào';
            errorDetails = {
              type: 'VALIDATION_ERROR',
              status: response.status,
              details: errorData.message || errorData.error || 'Invalid image or parameters',
            };
            break;
          case 401:
            errorMessage = 'Không có quyền truy cập - Kiểm tra API key';
            errorDetails = {
              type: 'AUTH_ERROR',
              status: response.status,
              details: 'Unauthorized access',
            };
            break;
          case 404:
            errorMessage = 'API endpoint không tồn tại';
            errorDetails = {
              type: 'ENDPOINT_ERROR',
              status: response.status,
              details: 'API endpoint /api/runware not found',
              solution: 'Kiểm tra file src/app/api/runware/route.js',
            };
            break;
          case 429:
            errorMessage = 'Quá nhiều yêu cầu - Vui lòng thử lại sau';
            errorDetails = {
              type: 'RATE_LIMIT_ERROR',
              status: response.status,
              details: 'Rate limit exceeded',
            };
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            errorMessage = 'Lỗi server - Vui lòng thử lại sau';
            errorDetails = {
              type: 'SERVER_ERROR',
              status: response.status,
              details: 'Internal server error',
            };
            break;
          default:
            errorMessage = `Lỗi HTTP ${response.status} - ${response.statusText}`;
            errorDetails = {
              type: 'HTTP_ERROR',
              status: response.status,
              details: errorData.message || errorData.error || response.statusText,
            };
        }

        this.logError('REMOVE_BG', `API_ERROR_${response.status}`, errorDetails);
        throw new Error(errorMessage);
      }

      const result = await response.json();

      this.logSuccess('REMOVE_BG', {
        hasData: !!result.data,
        hasImageURL: !!result.data?.imageURL,
        cost: result.data?.cost || 0,
        processingTime: `${Date.now() - startTime}ms`,
      });

      // Validate response data
      if (!result.success) {
        const serverError = result.error || 'Server trả về trạng thái không thành công';
        this.logError('REMOVE_BG', 'SERVER_ERROR', serverError);
        throw new Error(`Server Error: ${serverError}`);
      }

      if (!result.data) {
        this.logError('REMOVE_BG', 'NO_DATA', 'Response không chứa dữ liệu');
        throw new Error('Response không chứa dữ liệu hình ảnh');
      }

      if (!result.data.imageURL) {
        this.logError('REMOVE_BG', 'NO_IMAGE_URL', 'Response không chứa URL hình ảnh');
        throw new Error('Không thể lấy URL hình ảnh từ server');
      }

      return {
        success: true,
        data: {
          ...result.data,
          // Ensure consistent field naming for backward compatibility
          imageUrl: result.data.imageURL,
          maskURL: result.data.imageURL, // Alias cho mask URL để dùng trong inpainting
        },
      };
    } catch (error) {
      if (error.name !== 'AbortError') {
        this.logError('REMOVE_BG', 'FINAL_ERROR', {
          message: error.message,
          type: error.constructor.name,
        });
      }

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Inpainting - Tạo background mới với seedImage và maskImage (workflow mới)
   * @param {string} seedImage - URL ảnh gốc (original image)
   * @param {string} maskImage - URL mask từ removeBackground
   * @param {string} positivePrompt - Prompt mô tả background mong muốn
   * @param {Object} options - Tùy chọn xử lý
   * @returns {Promise<Object>} Kết quả xử lý
   */
  static async inpainting(seedImage, maskImage, positivePrompt, options = {}) {
    try {
      if (!seedImage) {
        throw new Error('Seed image (ảnh gốc) là bắt buộc');
      }

      if (!maskImage) {
        throw new Error('Mask image là bắt buộc');
      }

      if (!positivePrompt) {
        throw new Error('Positive prompt là bắt buộc');
      }

      const startTime = Date.now();

      console.log('🔧 [INPAINTING] Request initiated:', {
        model: options.model || 'bfl:1@2',
        promptLength: positivePrompt?.length || 0,
        hasSeeedImage: !!seedImage,
        hasMaskImage: !!maskImage,
        CFGScale: options.CFGScale || 60,
        steps: options.steps || 50,
        timestamp: new Date().toISOString(),
      });

      const headers = await this.createHeaders();

      const requestPayload = {
        operation: 'inpainting',
        data: {
          seedImage,
          maskImage,
          positivePrompt,
        },
        options: {
          model: options.model || 'bfl:1@2', // BFL model for high quality
          CFGScale: options.CFGScale || 60,
          steps: options.steps || 50,
          outputType: options.outputType || 'URL',
          outputFormat: options.outputFormat || 'PNG',
          outputQuality: options.outputQuality || 95,
          numberResults: options.numberResults || 1,
          seed: options.seed || 206554476,
          checkNSFW: options.checkNSFW || false,
          includeCost: options.includeCost !== undefined ? options.includeCost : true,
          providerSettings: options.providerSettings || {
            bfl: {
              promptUpsampling: true,
              safetyTolerance: 2,
            },
          },
          // Legacy parameters for backward compatibility
          width: options.width || 1024,
          height: options.height || 1024,
          strength: options.strength || 0.8,
          scheduler: options.scheduler || 'Euler',
          maskMargin: options.maskMargin,
        },
      };

      // Log request summary (không log full payload để tránh spam)
      console.log('📤 [INPAINTING] Starting request:', {
        model: requestPayload.options?.model || 'unknown',
        promptLength: requestPayload.data?.positivePrompt?.length || 0,
        hasSeeedImage: !!requestPayload.data?.seedImage,
        hasMaskImage: !!requestPayload.data?.maskImage,
        timestamp: new Date().toISOString(),
      });

      const response = await fetch(this.API_BASE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestPayload),
      });

      // Log response status với thông tin cần thiết
      console.log(
        `📡 [INPAINTING] Response: ${response.status} ${response.statusText} (${Date.now() - startTime}ms)`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Tạo error message tối ưu dựa trên status code
        let errorMessage = '';
        let errorDetails = {};

        switch (response.status) {
          case 400:
            errorMessage = 'Yêu cầu không hợp lệ - Kiểm tra lại tham số đầu vào';
            errorDetails = {
              type: 'VALIDATION_ERROR',
              status: response.status,
              details: errorData.message || errorData.error || 'Invalid request parameters',
            };
            break;
          case 401:
            errorMessage = 'Không có quyền truy cập - Kiểm tra API key';
            errorDetails = {
              type: 'AUTH_ERROR',
              status: response.status,
              details: 'Unauthorized access',
            };
            break;
          case 403:
            errorMessage = 'Bị từ chối truy cập - Tài khoản có thể bị giới hạn';
            errorDetails = {
              type: 'FORBIDDEN_ERROR',
              status: response.status,
              details: errorData.message || 'Access forbidden',
            };
            break;
          case 429:
            errorMessage = 'Quá nhiều yêu cầu - Vui lòng thử lại sau';
            errorDetails = {
              type: 'RATE_LIMIT_ERROR',
              status: response.status,
              details: 'Rate limit exceeded',
              retryAfter: response.headers.get('Retry-After') || 'unknown',
            };
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            errorMessage = 'Lỗi server - Vui lòng thử lại sau';
            errorDetails = {
              type: 'SERVER_ERROR',
              status: response.status,
              details: 'Internal server error',
            };
            break;
          default:
            errorMessage = `Lỗi HTTP ${response.status} - ${response.statusText}`;
            errorDetails = {
              type: 'HTTP_ERROR',
              status: response.status,
              details: errorData.message || errorData.error || response.statusText,
            };
        }

        // Log lỗi một cách có cấu trúc và không spam
        console.error('❌ [INPAINTING] API Error:', errorDetails);

        // Chỉ log chi tiết khi có lỗi validation hoặc cần debug
        if (response.status === 400 && errorData.errors) {
          console.error('❌ [INPAINTING] Validation Details:', errorData.errors);
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();

      // Log kết quả thành công một cách tóm tắt
      console.log('✅ [INPAINTING] Success:', {
        hasData: !!result.data,
        hasImageURL: !!result.data?.imageURL,
        cost: result.data?.cost || 0,
        processingTime: `${Date.now() - startTime}ms`,
      });

      // Validate response data với error messages rõ ràng
      if (!result.success) {
        const serverError = result.error || 'Server trả về trạng thái không thành công';
        console.error('❌ [INPAINTING] Server Error:', serverError);
        throw new Error(`Server Error: ${serverError}`);
      }

      if (!result.data) {
        console.error('❌ [INPAINTING] No Data:', 'Response không chứa dữ liệu');
        throw new Error('Response không chứa dữ liệu hình ảnh');
      }

      if (!result.data.imageURL) {
        console.error('❌ [INPAINTING] No Image URL:', 'Response không chứa URL hình ảnh');
        throw new Error('Không thể lấy URL hình ảnh từ server');
      }

      return {
        success: true,
        data: {
          ...result.data,
          // Ensure consistent field naming for backward compatibility
          imageUrl: result.data.imageURL,
        },
      };
    } catch (error) {
      // Chỉ log error một lần với thông tin đầy đủ
      if (error.name !== 'AbortError') {
        // Không log timeout errors
        console.error('❌ [INPAINTING] Final Error:', {
          message: error.message,
          type: error.constructor.name,
          timestamp: new Date().toISOString(),
        });
      }

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Tạo ảnh từ text prompt (Image Generation)
   * @param {string} prompt - Text prompt để tạo ảnh
   * @param {Object} options - Tùy chọn tạo ảnh
   * @returns {Promise<Object>} - Kết quả xử lý
   */
  static async generateImage(prompt, options = {}) {
    const startTime = Date.now();

    try {
      if (!prompt) {
        throw new Error('Text prompt là bắt buộc');
      }

      console.log('🖼️ [GENERATE_IMAGE] Request initiated:', {
        model: options.model || 'runware:100@1',
        promptLength: prompt.length,
        dimensions: `${options.width || 1024}x${options.height || 1024}`,
        steps: options.steps || 20,
        CFGScale: options.CFGScale || 7.5,
        timestamp: new Date().toISOString(),
      });

      const headers = await this.createHeaders();
      const requestPayload = {
        operation: 'generateImage',
        data: { prompt },
        options: {
          model: options.model || 'runware:100@1',
          width: options.width || 1024,
          height: options.height || 1024,
          steps: options.steps || 20,
          CFGScale: options.CFGScale || 7.5,
          outputFormat: options.outputFormat || 'PNG',
          outputType: options.outputType || 'URL',
          numberResults: options.numberResults || 1,
        },
      };

      const response = await fetch(this.API_BASE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestPayload),
      });

      console.log(
        `📡 [GENERATE_IMAGE] Response: ${response.status} ${response.statusText} (${Date.now() - startTime}ms)`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Tạo error message dựa trên status code
        let errorMessage = '';
        switch (response.status) {
          case 400:
            errorMessage = 'Yêu cầu không hợp lệ - Kiểm tra lại prompt và tham số';
            break;
          case 401:
            errorMessage = 'Không có quyền truy cập - Kiểm tra API key';
            break;
          case 429:
            errorMessage = 'Quá nhiều yêu cầu - Vui lòng thử lại sau';
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            errorMessage = 'Lỗi server - Vui lòng thử lại sau';
            break;
          default:
            errorMessage = `Lỗi HTTP ${response.status} - ${response.statusText}`;
        }

        console.error('❌ [GENERATE_IMAGE] API Error:', {
          status: response.status,
          message: errorMessage,
          serverError: errorData.error || errorData.message,
        });

        throw new Error(errorMessage);
      }

      const result = await response.json();

      console.log('✅ [GENERATE_IMAGE] Success:', {
        hasData: !!result.data,
        hasImageURL: !!result.data?.imageURL,
        cost: result.data?.cost || 0,
        processingTime: `${Date.now() - startTime}ms`,
      });

      // Validate response data
      if (!result.success) {
        const serverError = result.error || 'Server trả về trạng thái không thành công';
        console.error('❌ [GENERATE_IMAGE] Server Error:', serverError);
        throw new Error(`Server Error: ${serverError}`);
      }

      if (!result.data) {
        console.error('❌ [GENERATE_IMAGE] No Data:', 'Response không chứa dữ liệu');
        throw new Error('Response không chứa dữ liệu hình ảnh');
      }

      if (!result.data.imageURL) {
        console.error('❌ [GENERATE_IMAGE] No Image URL:', 'Response không chứa URL hình ảnh');
        throw new Error('Không thể lấy URL hình ảnh từ server');
      }

      return {
        success: true,
        data: {
          ...result.data,
          // Ensure consistent field naming for backward compatibility
          imageUrl: result.data.imageURL,
        },
      };
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('❌ [GENERATE_IMAGE] Final Error:', {
          message: error.message,
          type: error.constructor.name,
          timestamp: new Date().toISOString(),
        });
      }

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Upscale hình ảnh
   * @param {string} inputImage - URL hoặc base64 của hình ảnh
   * @param {Object} options - Tùy chọn upscale
   * @returns {Promise<Object>} - Kết quả xử lý
   */
  static async upscaleImage(inputImage, options = {}) {
    try {
      if (!inputImage) {
        throw new Error('Hình ảnh đầu vào là bắt buộc');
      }

      const headers = await this.createHeaders();

      const response = await fetch(this.API_BASE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          operation: 'upscale',
          data: { inputImage },
          options: {
            model: options.model || 'runware:109@1',
            scale: options.scale || 2,
            outputFormat: options.outputFormat || 'PNG',
            outputType: options.outputType || 'URL',
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Lỗi xử lý từ server');
      }

      // Validate response data
      if (!result.data) {
        throw new Error('Không có dữ liệu trong response từ server');
      }

      // Ensure imageURL is available
      if (!result.data.imageURL) {
        throw new Error('Không có URL hình ảnh trong response từ server');
      }

      return {
        success: true,
        data: {
          ...result.data,
          // Ensure consistent field naming for backward compatibility
          imageUrl: result.data.imageURL,
        },
      };
    } catch (error) {
      console.error('Upscale image error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Tạo background mới cho hình ảnh (img2img)
   * @param {string} inputImage - URL của hình ảnh đã xóa background
   * @param {Object} options - Tùy chọn tạo background
   * @returns {Promise<Object>} - Kết quả xử lý
   */
  static async generateBackground(inputImage, options = {}) {
    try {
      if (!inputImage) {
        throw new Error('Hình ảnh đầu vào là bắt buộc');
      }

      // Optimized parameters based on Runware API best practices
      const {
        prompt = 'professional studio background, clean, minimalist, high quality, detailed',
        negativePrompt = 'blurry, low quality, distorted, artifacts, noise, oversaturated',
        width = 1024,
        height = 1024,
        steps = 25, // Increased for better quality
        CFGScale = 7.0, // Optimal balance between prompt adherence and creativity
        strength = 0.75, // Slightly lower for better integration
        model = 'runware:101@1', // FLUX model for better quality
        scheduler = 'Euler', // Deterministic scheduler for consistent results
        seed = null, // Random seed for variety
        outputFormat = 'PNG',
        outputQuality = 95,
      } = options;

      const headers = await this.createHeaders();

      const requestBody = {
        operation: 'generateImage',
        data: {
          prompt,
          inputImage, // For img2img generation
        },
        options: {
          model,
          width,
          height,
          steps,
          CFGScale,
          strength,
          outputFormat,
          outputType: 'URL',
          outputQuality,
          numberResults: 1,
        },
      };

      // Add optional parameters if provided
      if (negativePrompt) {
        requestBody.data.negativePrompt = negativePrompt;
      }
      if (scheduler) {
        requestBody.options.scheduler = scheduler;
      }
      if (seed !== null) {
        requestBody.options.seed = seed;
      }

      const response = await fetch(this.API_BASE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Lỗi xử lý từ server');
      }

      // Validate response data
      if (!result.data) {
        throw new Error('Không có dữ liệu trong response từ server');
      }

      // Ensure imageURL is available
      if (!result.data.imageURL) {
        throw new Error('Không có URL hình ảnh trong response từ server');
      }

      return {
        success: true,
        data: {
          ...result.data,
          // Ensure consistent field naming for backward compatibility
          imageUrl: result.data.imageURL,
        },
      };
    } catch (error) {
      console.error('Generate background error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Convert File/Blob thành base64 string
   * @param {File|Blob} file - File cần convert
   * @returns {Promise<string>} - Base64 string
   */
  static fileToBase64(file) {
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
   * Download hình ảnh từ URL và convert thành Blob
   * @param {string} imageUrl - URL của hình ảnh
   * @returns {Promise<Blob>} - Blob của hình ảnh
   */
  static async downloadImageAsBlob(imageUrl) {
    try {
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();

      if (!blob.type.startsWith('image/')) {
        throw new Error('Response không phải là hình ảnh');
      }

      return blob;
    } catch (error) {
      console.error('Download image error:', error);
      throw error;
    }
  }

  /**
   * Retry mechanism cho các API call
   * @param {Function} apiCall - Function API cần retry
   * @param {number} maxRetries - Số lần retry tối đa
   * @param {number} delay - Delay giữa các lần retry (ms)
   * @returns {Promise<Object>} - Kết quả API call
   */
  static async retryApiCall(apiCall, maxRetries = 3, delay = 1000) {
    let lastError;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        const result = await apiCall();
        if (result.success) {
          return result;
        }
        lastError = new Error(result.error || 'API call failed');
      } catch (error) {
        lastError = error;
      }

      if (i < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }

    throw lastError;
  }

  /**
   * Batch processing cho nhiều ảnh
   * @param {Array} files - Mảng các file ảnh
   * @param {string} operation - Loại operation ('removeBackground', 'upscale', etc.)
   * @param {Object} options - Tùy chọn cho operation
   * @param {Function} onProgress - Callback để track progress
   * @returns {Promise<Array>} - Mảng kết quả
   */
  static async batchProcess(files, operation, options = {}, onProgress = null) {
    try {
      const headers = await this.createHeaders();

      // Convert files to base64 for upload
      const filesData = await Promise.all(
        files.map(async (file, index) => {
          if (operation === 'generateImage') {
            // For text-to-image, file is actually the prompt
            return {
              filename: `generated-${index}.png`,
              prompt: file,
            };
          } else {
            // For other operations, convert file to base64
            const base64 = await this.fileToBase64(file);
            return {
              filename: file.name,
              base64,
            };
          }
        })
      );

      const response = await fetch(`${this.API_BASE_URL}/batch`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          files: filesData,
          operation,
          options,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Lỗi xử lý batch từ server');
      }

      // Simulate progress updates for UI
      if (onProgress) {
        result.results.forEach((fileResult, index) => {
          onProgress({
            completed: index + 1,
            total: files.length,
            percentage: Math.round(((index + 1) / files.length) * 100),
            currentFile: fileResult.filename,
            result: fileResult,
          });
        });
      }

      return result.results;
    } catch (error) {
      console.error('Batch processing error:', error);
      return files.map((file, index) => ({
        index,
        filename: file.name || `file-${index}`,
        success: false,
        error: error.message,
      }));
    }
  }

  /**
   * Test connection to API
   * @returns {Promise<Object>} - Kết quả test
   */
  static async testConnection() {
    try {
      const headers = await this.createHeaders();

      const response = await fetch(this.API_BASE_URL, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Test connection error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
