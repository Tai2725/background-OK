import { ImageUploadService } from './image-upload-service';
import { RunwareService } from './runware-service';

// ----------------------------------------------------------------------

/**
 * Service tổng hợp để xử lý toàn bộ workflow tạo background
 */
export class BackgroundGeneratorService {
  /**
   * Xử lý toàn bộ workflow từ upload đến tạo background
   * @param {File} file - File hình ảnh gốc
   * @param {string} userId - ID của user
   * @param {Object} options - Tùy chọn xử lý
   * @param {Function} onProgress - Callback để báo cáo tiến độ
   * @returns {Promise<Object>} - Kết quả xử lý
   */
  static async processImage(file, userId, options = {}, onProgress = null) {
    try {
      const {
        prompt = 'professional studio background, clean, minimalist',
        style = 'photographic',
        enableUpscale = false,
        enableEnhance = false,
      } = options;

      let progress = 0;
      const updateProgress = (step, message, percent) => {
        progress = percent;
        if (onProgress) {
          onProgress({ step, message, progress: percent });
        }
      };

      // Step 1: Upload hình ảnh gốc
      updateProgress('uploading', 'Đang upload hình ảnh...', 10);

      const uploadResult = await ImageUploadService.uploadOriginalImage(file, userId);
      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      const imageRecord = uploadResult.data;
      updateProgress('uploading', 'Upload thành công!', 20);

      // Step 2: Xóa background
      updateProgress('removing_bg', 'Đang xóa background...', 30);

      const removeResult = await RunwareService.removeBackground(imageRecord.url);
      if (!removeResult.success) {
        // Update status to error
        await ImageUploadService.updateImageRecord(imageRecord.id, {
          status: 'error',
        });
        throw new Error(removeResult.error);
      }

      // Update database với URL tạm thời từ Runware
      await ImageUploadService.updateImageRecord(imageRecord.id, {
        background_removed_url: removeResult.data.imageURL,
        status: 'background_removed',
      });

      updateProgress('removing_bg', 'Xóa background thành công!', 50);

      // Step 3: Download và lưu hình ảnh đã xóa background
      updateProgress('saving', 'Đang lưu hình ảnh đã xóa background...', 55);

      const removedBgBlob = await RunwareService.downloadImageAsBlob(removeResult.data.imageURL);
      const savedRemovedBg = await ImageUploadService.uploadProcessedImage(
        removedBgBlob,
        userId,
        imageRecord.id,
        'background_removed'
      );

      if (!savedRemovedBg.success) {
        console.warn('Không thể lưu hình ảnh đã xóa background:', savedRemovedBg.error);
      }

      // Step 4: Tạo background mới
      updateProgress('generating_bg', 'Đang tạo background mới...', 60);

      const generateResult = await RunwareService.generateBackground(removeResult.data.imageUrl, {
        prompt,
        style,
        width: 1024,
        height: 1024,
      });

      if (!generateResult.success) {
        await ImageUploadService.updateImageRecord(imageRecord.id, {
          status: 'error',
        });
        throw new Error(generateResult.error);
      }

      // Update database
      await ImageUploadService.updateImageRecord(imageRecord.id, {
        final_url: generateResult.data.imageURL,
        status: 'completed',
      });

      updateProgress('generating_bg', 'Tạo background thành công!', 80);

      // Step 5: Download và lưu hình ảnh final
      updateProgress('saving', 'Đang lưu hình ảnh final...', 85);

      const finalBlob = await RunwareService.downloadImageAsBlob(generateResult.data.imageURL);
      const savedFinal = await ImageUploadService.uploadProcessedImage(
        finalBlob,
        userId,
        imageRecord.id,
        'final'
      );

      if (!savedFinal.success) {
        console.warn('Không thể lưu hình ảnh final:', savedFinal.error);
      }

      let finalImageUrl = generateResult.data.imageURL;
      let upscaledImageUrl = null;
      let enhancedImageUrl = null;

      // Step 6: Upscale (optional)
      if (enableUpscale) {
        updateProgress('upscaling', 'Đang upscale hình ảnh...', 90);

        const upscaleResult = await RunwareService.upscaleImage(finalImageUrl, {
          scale: 2,
        });

        if (upscaleResult.success) {
          await ImageUploadService.updateImageRecord(imageRecord.id, {
            upscaled_url: upscaleResult.data.imageURL,
          });

          // Download và lưu
          const upscaledBlob = await RunwareService.downloadImageAsBlob(upscaleResult.data.imageURL);
          const savedUpscaled = await ImageUploadService.uploadProcessedImage(
            upscaledBlob,
            userId,
            imageRecord.id,
            'upscaled'
          );

          if (savedUpscaled.success) {
            upscaledImageUrl = upscaleResult.data.imageURL;
            finalImageUrl = upscaleResult.data.imageURL; // Use upscaled as final
          }
        }
      }

      // Step 7: Enhance (optional)
      if (enableEnhance) {
        updateProgress('enhancing', 'Đang enhance hình ảnh...', 95);

        const enhanceResult = await RunwareService.enhanceImage(finalImageUrl, {
          enhanceType: 'general',
          strength: 0.7,
        });

        if (enhanceResult.success) {
          await ImageUploadService.updateImageRecord(imageRecord.id, {
            enhanced_supabase_url: enhanceResult.data.imageURL,
          });

          // Download và lưu
          const enhancedBlob = await RunwareService.downloadImageAsBlob(enhanceResult.data.imageURL);
          const savedEnhanced = await ImageUploadService.uploadProcessedImage(
            enhancedBlob,
            userId,
            imageRecord.id,
            'enhanced'
          );

          if (savedEnhanced.success) {
            enhancedImageUrl = enhanceResult.data.imageURL;
            finalImageUrl = enhanceResult.data.imageURL; // Use enhanced as final
          }
        }
      }

      updateProgress('completed', 'Hoàn thành!', 100);

      // Return final result
      return {
        success: true,
        data: {
          id: imageRecord.id,
          originalUrl: imageRecord.url,
          backgroundRemovedUrl: removeResult.data.imageURL,
          finalUrl: finalImageUrl,
          upscaledUrl: upscaledImageUrl,
          enhancedUrl: enhancedImageUrl,
          // Supabase URLs (permanent)
          backgroundRemovedSupabaseUrl: savedRemovedBg.success ? savedRemovedBg.data.url : null,
          finalSupabaseUrl: savedFinal.success ? savedFinal.data.url : null,
        },
      };
    } catch (error) {
      console.error('Process image error:', error);

      // Update status to error if we have imageRecord
      if (error.imageId) {
        await ImageUploadService.updateImageRecord(error.imageId, {
          status: 'error',
        });
      }

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Chỉ xóa background (không tạo background mới)
   * @param {File} file - File hình ảnh gốc
   * @param {string} userId - ID của user
   * @param {Function} onProgress - Callback để báo cáo tiến độ
   * @returns {Promise<Object>} - Kết quả xử lý
   */
  static async removeBackgroundOnly(file, userId, onProgress = null) {
    try {
      const updateProgress = (step, message, percent) => {
        if (onProgress) {
          onProgress({ step, message, progress: percent });
        }
      };

      // Step 1: Upload hình ảnh gốc
      updateProgress('uploading', 'Đang upload hình ảnh...', 20);

      const uploadResult = await ImageUploadService.uploadOriginalImage(file, userId);
      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      const imageRecord = uploadResult.data;
      updateProgress('uploading', 'Upload thành công!', 40);

      // Step 2: Xóa background
      updateProgress('removing_bg', 'Đang xóa background...', 60);

      const removeResult = await RunwareService.removeBackground(imageRecord.url);
      if (!removeResult.success) {
        await ImageUploadService.updateImageRecord(imageRecord.id, {
          status: 'error',
        });
        throw new Error(removeResult.error);
      }

      // Update database
      await ImageUploadService.updateImageRecord(imageRecord.id, {
        background_removed_url: removeResult.data.imageURL,
        status: 'background_removed',
      });

      updateProgress('removing_bg', 'Xóa background thành công!', 80);

      // Step 3: Download và lưu
      updateProgress('saving', 'Đang lưu hình ảnh...', 90);

      const removedBgBlob = await RunwareService.downloadImageAsBlob(removeResult.data.imageURL);
      const savedResult = await ImageUploadService.uploadProcessedImage(
        removedBgBlob,
        userId,
        imageRecord.id,
        'background_removed'
      );

      updateProgress('completed', 'Hoàn thành!', 100);

      return {
        success: true,
        data: {
          id: imageRecord.id,
          originalUrl: imageRecord.url,
          backgroundRemovedUrl: removeResult.data.imageURL,
          backgroundRemovedSupabaseUrl: savedResult.success ? savedResult.data.url : null,
        },
      };
    } catch (error) {
      console.error('Remove background only error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Chỉ tạo background mới (từ ảnh đã xóa background)
   * @param {string} backgroundRemovedUrl - URL ảnh đã xóa background
   * @param {Object} options - Tùy chọn tạo background
   * @param {Function} onProgress - Callback để báo cáo tiến độ
   * @returns {Promise<Object>} - Kết quả xử lý
   */
  static async generateBackground(backgroundRemovedUrl, options = {}, onProgress = null) {
    try {
      const {
        prompt = 'professional studio background, clean, minimalist',
        style = 'photographic',
      } = options;

      const updateProgress = (step, message, percent) => {
        if (onProgress) {
          onProgress({ step, message, progress: percent });
        }
      };

      // Step 1: Tạo background mới
      updateProgress('generating_bg', 'Đang tạo background mới...', 30);

      const generateResult = await RunwareService.generateBackground(backgroundRemovedUrl, {
        prompt,
        style,
        width: 1024,
        height: 1024,
      });

      if (!generateResult.success) {
        throw new Error(generateResult.error);
      }

      updateProgress('generating_bg', 'Tạo background thành công!', 80);

      // Step 2: Download và lưu hình ảnh final (optional)
      updateProgress('saving', 'Đang lưu hình ảnh final...', 90);

      const finalBlob = await RunwareService.downloadImageAsBlob(generateResult.data.imageURL);
      // Note: Cần imageRecordId để lưu, có thể cần truyền thêm parameter

      updateProgress('completed', 'Hoàn thành!', 100);

      return {
        success: true,
        data: {
          finalUrl: generateResult.data.imageURL,
          backgroundRemovedUrl,
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
   * Lấy lịch sử xử lý của user
   * @param {string} userId - ID của user
   * @param {number} limit - Số lượng record
   * @param {number} offset - Offset cho pagination
   * @returns {Promise<Object>} - Danh sách lịch sử
   */
  static async getUserHistory(userId, limit = 20, offset = 0) {
    return await ImageUploadService.getUserImages(userId, limit, offset);
  }

  /**
   * Xóa hình ảnh và tất cả file liên quan
   * @param {string} imageId - ID của hình ảnh
   * @param {string} userId - ID của user
   * @returns {Promise<Object>} - Kết quả xóa
   */
  static async deleteImage(imageId, userId) {
    return await ImageUploadService.deleteImage(imageId, userId);
  }
}
