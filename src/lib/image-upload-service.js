import { supabase } from './supabase';

// ----------------------------------------------------------------------

/**
 * Service để upload và quản lý hình ảnh với Supabase Storage
 */
export class ImageUploadService {
  // Bucket names
  static BUCKETS = {
    IMAGES: 'images',
    PROCESSED_IMAGES: 'processed-images',
    AVATARS: 'avatars',
  };

  /**
   * Upload hình ảnh gốc lên Supabase Storage
   * @param {File} file - File hình ảnh
   * @param {string} userId - ID của user
   * @returns {Promise<Object>} - Kết quả upload
   */
  static async uploadOriginalImage(file, userId) {
    try {
      if (!file || !userId) {
        throw new Error('File và userId là bắt buộc');
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File phải là hình ảnh');
      }

      // Validate file size (20MB max)
      const maxSize = 20 * 1024 * 1024; // 20MB
      if (file.size > maxSize) {
        throw new Error('File không được vượt quá 20MB');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}_${randomString}.${fileExtension}`;
      const filePath = `${userId}/original/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKETS.IMAGES)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(`Lỗi upload: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKETS.IMAGES)
        .getPublicUrl(filePath);

      // Save to database
      const imageRecord = await this.saveImageRecord({
        userId,
        originalUrl: urlData.publicUrl,
        fileName,
        fileSize: file.size,
        mimeType: file.type,
      });

      return {
        success: true,
        data: {
          id: imageRecord.id,
          url: urlData.publicUrl,
          path: filePath,
          fileName,
          fileSize: file.size,
          mimeType: file.type,
        },
      };
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Upload hình ảnh đã xử lý lên Supabase Storage
   * @param {Blob|File} imageBlob - Blob hoặc File hình ảnh
   * @param {string} userId - ID của user
   * @param {string} imageId - ID của record hình ảnh gốc
   * @param {string} type - Loại hình ảnh (background_removed, upscaled, final, enhanced)
   * @returns {Promise<Object>} - Kết quả upload
   */
  static async uploadProcessedImage(imageBlob, userId, imageId, type) {
    try {
      if (!imageBlob || !userId || !imageId || !type) {
        throw new Error('Tất cả tham số đều bắt buộc');
      }

      // Generate filename
      const timestamp = Date.now();
      const fileName = `${type}_${timestamp}.png`;
      const filePath = `${userId}/processed/${imageId}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKETS.PROCESSED_IMAGES)
        .upload(filePath, imageBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/png',
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(`Lỗi upload: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKETS.PROCESSED_IMAGES)
        .getPublicUrl(filePath);

      // Update database record
      const updateField = `${type}_supabase_url`;
      await this.updateImageRecord(imageId, {
        [updateField]: urlData.publicUrl,
      });

      return {
        success: true,
        data: {
          url: urlData.publicUrl,
          path: filePath,
          fileName,
        },
      };
    } catch (error) {
      console.error('Upload processed image error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Lưu record hình ảnh vào database
   * @param {Object} imageData - Dữ liệu hình ảnh
   * @returns {Promise<Object>} - Record đã tạo
   */
  static async saveImageRecord(imageData) {
    const { data, error } = await supabase
      .from('processed_images')
      .insert({
        user_id: imageData.userId,
        original_url: imageData.originalUrl,
        status: 'uploaded',
      })
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      throw new Error(`Lỗi lưu database: ${error.message}`);
    }

    return data;
  }

  /**
   * Cập nhật record hình ảnh trong database
   * @param {string} imageId - ID của record
   * @param {Object} updateData - Dữ liệu cập nhật
   * @returns {Promise<Object>} - Record đã cập nhật
   */
  static async updateImageRecord(imageId, updateData) {
    const { data, error } = await supabase
      .from('processed_images')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', imageId)
      .select()
      .single();

    if (error) {
      console.error('Database update error:', error);
      throw new Error(`Lỗi cập nhật database: ${error.message}`);
    }

    return data;
  }

  /**
   * Lấy danh sách hình ảnh của user
   * @param {string} userId - ID của user
   * @param {number} limit - Số lượng record tối đa
   * @param {number} offset - Offset cho pagination
   * @returns {Promise<Object>} - Danh sách hình ảnh
   */
  static async getUserImages(userId, limit = 20, offset = 0) {
    try {
      const { data, error, count } = await supabase
        .from('processed_images')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Lỗi lấy dữ liệu: ${error.message}`);
      }

      return {
        success: true,
        data,
        total: count,
        hasMore: count > offset + limit,
      };
    } catch (error) {
      console.error('Get user images error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Xóa hình ảnh và các file liên quan
   * @param {string} imageId - ID của record
   * @param {string} userId - ID của user (để bảo mật)
   * @returns {Promise<Object>} - Kết quả xóa
   */
  static async deleteImage(imageId, userId) {
    try {
      // Get image record first
      const { data: imageRecord, error: fetchError } = await supabase
        .from('processed_images')
        .select('*')
        .eq('id', imageId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !imageRecord) {
        throw new Error('Không tìm thấy hình ảnh hoặc bạn không có quyền xóa');
      }

      // Delete files from storage
      const filesToDelete = [];
      
      // Extract file paths from URLs
      if (imageRecord.original_url) {
        const originalPath = this.extractPathFromUrl(imageRecord.original_url);
        if (originalPath) filesToDelete.push({ bucket: this.BUCKETS.IMAGES, path: originalPath });
      }

      // Add processed image paths
      const processedFields = [
        'background_removed_supabase_url',
        'upscaled_supabase_url', 
        'final_supabase_url',
        'enhanced_supabase_url'
      ];

      processedFields.forEach(field => {
        if (imageRecord[field]) {
          const path = this.extractPathFromUrl(imageRecord[field]);
          if (path) filesToDelete.push({ bucket: this.BUCKETS.PROCESSED_IMAGES, path });
        }
      });

      // Delete files from storage
      for (const file of filesToDelete) {
        await supabase.storage.from(file.bucket).remove([file.path]);
      }

      // Delete database record
      const { error: deleteError } = await supabase
        .from('processed_images')
        .delete()
        .eq('id', imageId)
        .eq('user_id', userId);

      if (deleteError) {
        throw new Error(`Lỗi xóa database: ${deleteError.message}`);
      }

      return {
        success: true,
        message: 'Xóa hình ảnh thành công',
      };
    } catch (error) {
      console.error('Delete image error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Extract file path from Supabase public URL
   * @param {string} url - Public URL
   * @returns {string|null} - File path
   */
  static extractPathFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const objectIndex = pathParts.findIndex(part => part === 'object');
      if (objectIndex !== -1 && pathParts[objectIndex + 2]) {
        return pathParts.slice(objectIndex + 2).join('/');
      }
      return null;
    } catch {
      return null;
    }
  }
}
