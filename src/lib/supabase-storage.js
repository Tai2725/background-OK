import { supabase } from './supabase';

// ----------------------------------------------------------------------

/**
 * Supabase Storage Helper for Background Generator
 */
export class SupabaseStorage {
  // Storage bucket names
  static BUCKETS = {
    ORIGINAL_IMAGES: 'bg-original-images',
    PROCESSED_IMAGES: 'bg-processed-images',
    USER_UPLOADS: 'bg-user-uploads',
  };

  /**
   * Upload file to Supabase Storage
   * @param {File|Blob} file - File to upload
   * @param {string} bucket - Bucket name
   * @param {string} path - File path in bucket
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} - Upload result with public URL
   */
  static async uploadFile(file, bucket, path, options = {}) {
    try {
      const { upsert = false, contentType } = options;

      const uploadOptions = {
        upsert,
      };

      if (contentType) {
        uploadOptions.contentType = contentType;
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, uploadOptions);

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return {
        success: true,
        data,
        publicUrl: urlData.publicUrl,
        path,
        bucket,
      };
    } catch (error) {
      console.error('SupabaseStorage uploadFile error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Upload base64 image to Supabase Storage
   * @param {string} base64Data - Base64 image data
   * @param {string} bucket - Bucket name
   * @param {string} path - File path in bucket
   * @param {string} contentType - MIME type (default: image/png)
   * @returns {Promise<Object>} - Upload result with public URL
   */
  static async uploadBase64Image(base64Data, bucket, path, contentType = 'image/png') {
    try {
      // Remove data URL prefix if present
      const base64String = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
      
      // Convert base64 to blob
      const byteCharacters = atob(base64String);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: contentType });

      return await this.uploadFile(blob, bucket, path, { contentType });
    } catch (error) {
      console.error('SupabaseStorage uploadBase64Image error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Upload user image (original upload)
   * @param {File} file - Image file
   * @param {string} userId - User ID
   * @param {string} filename - Custom filename (optional)
   * @returns {Promise<Object>} - Upload result
   */
  static async uploadUserImage(file, userId, filename = null) {
    try {
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = filename || `${timestamp}.${fileExtension}`;
      const filePath = `${userId}/${fileName}`;

      return await this.uploadFile(
        file, 
        this.BUCKETS.USER_UPLOADS, 
        filePath,
        { contentType: file.type }
      );
    } catch (error) {
      console.error('SupabaseStorage uploadUserImage error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Upload processed image (from Runware API)
   * @param {string} base64Data - Base64 image data from Runware
   * @param {string} userId - User ID
   * @param {string} imageId - Image record ID
   * @param {string} type - Processing type (removed_bg, upscaled, final)
   * @returns {Promise<Object>} - Upload result
   */
  static async uploadProcessedImage(base64Data, userId, imageId, type) {
    try {
      const timestamp = Date.now();
      const fileName = `${imageId}_${type}_${timestamp}.png`;
      const filePath = `${userId}/${fileName}`;

      return await this.uploadBase64Image(
        base64Data,
        this.BUCKETS.PROCESSED_IMAGES,
        filePath,
        'image/png'
      );
    } catch (error) {
      console.error('SupabaseStorage uploadProcessedImage error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete file from storage
   * @param {string} bucket - Bucket name
   * @param {string} path - File path
   * @returns {Promise<Object>} - Delete result
   */
  static async deleteFile(bucket, path) {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: 'File deleted successfully',
      };
    } catch (error) {
      console.error('SupabaseStorage deleteFile error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get public URL for file
   * @param {string} bucket - Bucket name
   * @param {string} path - File path
   * @returns {string} - Public URL
   */
  static getPublicUrl(bucket, path) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  /**
   * List files in bucket
   * @param {string} bucket - Bucket name
   * @param {string} folder - Folder path (optional)
   * @param {Object} options - List options
   * @returns {Promise<Object>} - List result
   */
  static async listFiles(bucket, folder = '', options = {}) {
    try {
      const { limit = 100, offset = 0, sortBy } = options;

      const { data, error } = await supabase.storage
        .from(bucket)
        .list(folder, {
          limit,
          offset,
          sortBy,
        });

      if (error) {
        throw error;
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('SupabaseStorage listFiles error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create storage buckets if they don't exist
   * @returns {Promise<Object>} - Creation result
   */
  static async createBuckets() {
    try {
      const buckets = Object.values(this.BUCKETS);
      const results = [];

      for (const bucketName of buckets) {
        try {
          const { data, error } = await supabase.storage.createBucket(bucketName, {
            public: bucketName !== this.BUCKETS.USER_UPLOADS, // USER_UPLOADS is private
            allowedMimeTypes: ['image/*'],
            fileSizeLimit: 10485760, // 10MB
          });

          if (error && !error.message.includes('already exists')) {
            throw error;
          }

          results.push({
            bucket: bucketName,
            success: true,
            data,
          });
        } catch (bucketError) {
          results.push({
            bucket: bucketName,
            success: false,
            error: bucketError.message,
          });
        }
      }

      return {
        success: true,
        results,
      };
    } catch (error) {
      console.error('SupabaseStorage createBuckets error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate unique filename
   * @param {string} originalName - Original filename
   * @param {string} userId - User ID
   * @returns {string} - Unique filename
   */
  static generateUniqueFilename(originalName, userId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    return `${userId}_${timestamp}_${random}.${extension}`;
  }

  /**
   * Validate image file
   * @param {File} file - File to validate
   * @param {Object} options - Validation options
   * @returns {Object} - Validation result
   */
  static validateImageFile(file, options = {}) {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB
      allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    } = options;

    if (!file) {
      return {
        valid: false,
        error: 'No file provided',
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds ${maxSize / 1024 / 1024}MB limit`,
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      };
    }

    return {
      valid: true,
    };
  }
}

// ----------------------------------------------------------------------

export default SupabaseStorage;
