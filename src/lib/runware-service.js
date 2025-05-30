// ----------------------------------------------------------------------

import { createClient } from '@supabase/supabase-js';
import { CONFIG } from "src/global-config";

/**
 * Service để tích hợp với Runware API thông qua Next.js API routes
 * Bảo mật API key ở phía server
 */
export class RunwareService {
  static API_BASE_URL = '/api/runware';

  // Initialize Supabase client
  static supabase = createClient(
    CONFIG.supabase.url,
    CONFIG.supabase.key
  );

  /**
   * Tạo UUID v4 cho task
   * @returns {string} UUID v4
   */
  static generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Lấy access token từ Supabase session
   * @returns {Promise<string|null>} Access token
   */
  static async getAccessToken() {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
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
      'Authorization': `Bearer ${token}`,
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

      console.log('🔧 RunwareService.removeBackground called with:', { inputImage, options });

      const headers = await this.createHeaders();
      console.log('🔑 RunwareService headers created:', JSON.stringify(headers, null, 2));

      // Optimized settings for mask generation with runware:109@1 model
      const settings = {
        returnOnlyMask: true, // Trả về mask thay vì ảnh đã xóa background
        postProcessMask: true, // Cải thiện chất lượng mask
        alphaMatting: true, // Sử dụng alpha matting để làm mịn edges
        alphaMattingForegroundThreshold: 240, // Threshold cho foreground (cao hơn = chính xác hơn)
        alphaMattingBackgroundThreshold: 15, // Threshold cho background (thấp hơn = ít tính toán hơn)
        alphaMattingErodeSize: 8, // Kích thước erosion để làm mịn edges
        rgba: [255, 255, 255, 0], // Màu background trong suốt
        ...options.settings // Cho phép override settings nếu cần
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

      console.log('📤 RunwareService sending request to:', this.API_BASE_URL);
      console.log('📋 RunwareService request payload:', JSON.stringify(requestPayload, null, 2));

      const response = await fetch(this.API_BASE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestPayload),
      });

      console.log('📡 RunwareService response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ RunwareService API error:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('📥 RunwareService response data:', JSON.stringify(result, null, 2));

      if (!result.success) {
        console.error('❌ RunwareService server error:', result.error);
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
      console.error('Remove background error:', error);
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
    try {
      if (!prompt) {
        throw new Error('Text prompt là bắt buộc');
      }

      const headers = await this.createHeaders();

      const response = await fetch(this.API_BASE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
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
      console.error('Generate image error:', error);
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
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
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
