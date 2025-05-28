import axios from 'axios';

// ----------------------------------------------------------------------

const RUNWARE_API_URL = process.env.RUNWARE_API_URL || 'https://api.runware.ai';
const RUNWARE_API_KEY = process.env.RUNWARE_API_KEY;

// Create axios instance for Runware API
const runwareApi = axios.create({
  baseURL: RUNWARE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${RUNWARE_API_KEY}`,
  },
});

// ----------------------------------------------------------------------

/**
 * Runware API Client
 */
export class RunwareClient {
  /**
   * Remove background from image
   * @param {string} imageUrl - URL of the image to process
   * @returns {Promise<Object>} - Task result with processed image URL
   */
  static async removeBackground(imageUrl) {
    try {
      const response = await runwareApi.post('/v1/image/background/remove', {
        taskType: 'imageBackgroundRemoval',
        inputImage: imageUrl,
        outputFormat: 'PNG',
        outputType: 'base64',
      });

      return {
        success: true,
        taskId: response.data.taskId,
        data: response.data,
      };
    } catch (error) {
      console.error('Runware removeBackground error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Upscale image
   * @param {string} imageUrl - URL of the image to upscale
   * @param {number} scaleFactor - Scale factor (2, 4, 8)
   * @returns {Promise<Object>} - Task result with upscaled image URL
   */
  static async upscaleImage(imageUrl, scaleFactor = 2) {
    try {
      const response = await runwareApi.post('/v1/image/upscale', {
        taskType: 'imageUpscale',
        inputImage: imageUrl,
        upscaleFactor: scaleFactor,
        outputFormat: 'PNG',
        outputType: 'base64',
      });

      return {
        success: true,
        taskId: response.data.taskId,
        data: response.data,
      };
    } catch (error) {
      console.error('Runware upscaleImage error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Generate background for image
   * @param {string} imageUrl - URL of the image (with removed background)
   * @param {string} prompt - Text prompt for background generation
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Task result with generated background image URL
   */
  static async generateBackground(imageUrl, prompt, options = {}) {
    try {
      const {
        strength = 0.8,
        steps = 25,
        CFGScale = 7,
        seed = null,
        scheduler = 'DPM++2MKarrasScheduler',
        model = 'runware:100@1',
        lora = null,
        controlNet = null,
      } = options;

      const requestData = {
        taskType: 'imageInference',
        inputImage: imageUrl,
        positivePrompt: prompt,
        negativePrompt: 'blurry, low quality, distorted, deformed, bad anatomy',
        height: 1024,
        width: 1024,
        steps,
        CFGScale,
        scheduler,
        model,
        strength,
        outputFormat: 'PNG',
        outputType: 'base64',
      };

      // Add optional parameters
      if (seed) requestData.seed = seed;
      if (lora) requestData.lora = lora;
      if (controlNet) requestData.controlNet = controlNet;

      const response = await runwareApi.post('/v1/image/inference', requestData);

      return {
        success: true,
        taskId: response.data.taskId,
        data: response.data,
      };
    } catch (error) {
      console.error('Runware generateBackground error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Get task status and result
   * @param {string} taskId - Task ID to check
   * @returns {Promise<Object>} - Task status and result
   */
  static async getTaskStatus(taskId) {
    try {
      const response = await runwareApi.get(`/v1/tasks/${taskId}`);

      return {
        success: true,
        status: response.data.status,
        data: response.data,
      };
    } catch (error) {
      console.error('Runware getTaskStatus error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Poll task until completion
   * @param {string} taskId - Task ID to poll
   * @param {number} maxAttempts - Maximum polling attempts
   * @param {number} interval - Polling interval in milliseconds
   * @returns {Promise<Object>} - Final task result
   */
  static async pollTaskCompletion(taskId, maxAttempts = 30, interval = 2000) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = await this.getTaskStatus(taskId);

      if (!result.success) {
        return result;
      }

      const { status, data } = result;

      if (status === 'completed') {
        return {
          success: true,
          status: 'completed',
          data,
        };
      }

      if (status === 'failed') {
        return {
          success: false,
          status: 'failed',
          error: data.error || 'Task failed',
        };
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    return {
      success: false,
      status: 'timeout',
      error: 'Task polling timeout',
    };
  }

  /**
   * Complete workflow: Remove background + Generate new background
   * @param {string} imageUrl - Original image URL
   * @param {string} backgroundPrompt - Background generation prompt
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Complete workflow result
   */
  static async processImageWorkflow(imageUrl, backgroundPrompt, options = {}) {
    try {
      // Step 1: Remove background
      console.log('Step 1: Removing background...');
      const removeResult = await this.removeBackground(imageUrl);

      if (!removeResult.success) {
        return {
          success: false,
          step: 'removeBackground',
          error: removeResult.error,
        };
      }

      // Poll for background removal completion
      const removeCompletion = await this.pollTaskCompletion(removeResult.taskId);

      if (!removeCompletion.success) {
        return {
          success: false,
          step: 'removeBackground',
          error: removeCompletion.error,
        };
      }

      const removedBgImageUrl = removeCompletion.data.outputImage;

      // Step 2: Generate new background
      console.log('Step 2: Generating new background...');
      const generateResult = await this.generateBackground(
        removedBgImageUrl,
        backgroundPrompt,
        options
      );

      if (!generateResult.success) {
        return {
          success: false,
          step: 'generateBackground',
          error: generateResult.error,
          removedBgImageUrl,
        };
      }

      // Poll for background generation completion
      const generateCompletion = await this.pollTaskCompletion(generateResult.taskId);

      if (!generateCompletion.success) {
        return {
          success: false,
          step: 'generateBackground',
          error: generateCompletion.error,
          removedBgImageUrl,
        };
      }

      return {
        success: true,
        originalImageUrl: imageUrl,
        removedBgImageUrl,
        finalImageUrl: generateCompletion.data.outputImage,
        backgroundPrompt,
        removeTaskId: removeResult.taskId,
        generateTaskId: generateResult.taskId,
      };

    } catch (error) {
      console.error('Runware processImageWorkflow error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// ----------------------------------------------------------------------

/**
 * Background style presets - Optimized for Runware API
 * Based on research of best practices for background generation
 */
export const BACKGROUND_STYLES = [
  // Studio Backgrounds
  {
    id: 'studio-white',
    name: 'Studio Trắng Chuyên Nghiệp',
    description: 'Nền studio trắng tinh khiết với ánh sáng mềm mại, phù hợp cho sản phẩm cao cấp',
    prompt: 'clean white studio background, professional photography lighting, soft diffused light, minimal shadows, seamless backdrop, high-end product photography',
    category: 'studio',
  },
  {
    id: 'studio-gradient',
    name: 'Studio Gradient Tinh Tế',
    description: 'Nền studio với gradient nhẹ nhàng, tạo chiều sâu và sự sang trọng',
    prompt: 'soft gradient studio background, professional photography, subtle lighting transition, clean minimal aesthetic, elegant backdrop',
    category: 'studio',
  },
  {
    id: 'studio-dark',
    name: 'Studio Tối Sang Trọng',
    description: 'Nền studio tối tạo sự tương phản mạnh mẽ và nổi bật sản phẩm',
    prompt: 'dark studio background, dramatic lighting, professional photography, elegant shadows, luxury product backdrop, sophisticated atmosphere',
    category: 'studio',
  },

  // Nature & Outdoor
  {
    id: 'nature-outdoor',
    name: 'Thiên Nhiên Ngoài Trời',
    description: 'Nền thiên nhiên tươi mát với cỏ xanh và bầu trời trong xanh',
    prompt: 'beautiful natural outdoor background, lush green grass, clear blue sky, soft natural lighting, fresh atmosphere, organic environment',
    category: 'nature',
  },
  {
    id: 'nature-forest',
    name: 'Rừng Xanh Tự Nhiên',
    description: 'Nền rừng xanh mát với ánh sáng lọc qua lá cây',
    prompt: 'natural forest background, dappled sunlight through trees, green foliage, peaceful woodland setting, organic natural lighting',
    category: 'nature',
  },
  {
    id: 'nature-beach',
    name: 'Bãi Biển Nhiệt Đới',
    description: 'Nền bãi biển với cát trắng và nước biển trong xanh',
    prompt: 'tropical beach background, white sand, crystal clear turquoise water, gentle waves, bright natural sunlight, vacation atmosphere',
    category: 'nature',
  },

  // Interior & Modern
  {
    id: 'modern-room',
    name: 'Phòng Hiện Đại Tối Giản',
    description: 'Nền phòng hiện đại với thiết kế tối giản và ánh sáng tự nhiên',
    prompt: 'modern minimalist room background, clean interior design, natural lighting, contemporary furniture, sleek surfaces, architectural photography',
    category: 'interior',
  },
  {
    id: 'modern-office',
    name: 'Văn Phòng Hiện Đại',
    description: 'Nền văn phòng hiện đại với không gian làm việc chuyên nghiệp',
    prompt: 'modern office background, professional workspace, clean desk setup, contemporary interior design, business environment, soft lighting',
    category: 'interior',
  },
  {
    id: 'cozy-home',
    name: 'Không Gian Ấm Cúng',
    description: 'Nền nhà ở ấm cúng với ánh sáng vàng và nội thất gỗ',
    prompt: 'cozy home interior background, warm lighting, wooden furniture, comfortable atmosphere, soft textures, inviting living space',
    category: 'interior',
  },

  // Luxury & Premium
  {
    id: 'luxury-marble',
    name: 'Đá Cẩm Thạch Sang Trọng',
    description: 'Nền đá cẩm thạch cao cấp với vân đá tự nhiên và ánh sáng tinh tế',
    prompt: 'luxury marble background, elegant natural stone texture, sophisticated veining patterns, premium quality surface, soft dramatic lighting',
    category: 'luxury',
  },
  {
    id: 'luxury-gold',
    name: 'Vàng Ánh Kim Sang Trọng',
    description: 'Nền vàng ánh kim tạo cảm giác xa hoa và đẳng cấp',
    prompt: 'luxury gold background, metallic golden surface, elegant shimmer, premium quality finish, sophisticated lighting, high-end aesthetic',
    category: 'luxury',
  },
  {
    id: 'luxury-velvet',
    name: 'Nhung Mềm Mại Cao Cấp',
    description: 'Nền nhung mềm mại với texture sang trọng và ánh sáng ấm',
    prompt: 'luxury velvet background, soft fabric texture, rich deep colors, elegant draping, premium material, sophisticated lighting',
    category: 'luxury',
  },

  // Natural & Organic
  {
    id: 'wooden-texture',
    name: 'Gỗ Tự Nhiên Ấm Áp',
    description: 'Nền gỗ tự nhiên với vân gỗ đẹp và cảm giác ấm áp, thân thiện',
    prompt: 'natural wood texture background, beautiful wood grain patterns, warm organic feel, rustic elegant finish, soft natural lighting',
    category: 'natural',
  },
  {
    id: 'stone-natural',
    name: 'Đá Tự Nhiên Thô Mộc',
    description: 'Nền đá tự nhiên với texture thô mộc và cảm giác chắc chắn',
    prompt: 'natural stone background, rough organic texture, earthy tones, rustic surface, natural lighting, authentic material feel',
    category: 'natural',
  },
  {
    id: 'fabric-linen',
    name: 'Vải Lanh Tự Nhiên',
    description: 'Nền vải lanh với texture mềm mại và cảm giác tự nhiên, thân thiện môi trường',
    prompt: 'natural linen fabric background, soft textile texture, organic weave pattern, neutral earth tones, gentle natural lighting',
    category: 'natural',
  },
];

// ----------------------------------------------------------------------

export default RunwareClient;
