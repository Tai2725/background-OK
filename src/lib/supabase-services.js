import { supabase } from './supabase';

// ----------------------------------------------------------------------

/**
 * User Profile Services
 */

export const userProfileService = {
  /**
   * Lấy thông tin profile của user
   */
  async getProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return { data: null, error };
    }
  },

  /**
   * Tạo hoặc cập nhật profile của user
   */
  async upsertProfile(userId, profileData) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          id: userId,
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error upserting user profile:', error);
      return { data: null, error };
    }
  },

  /**
   * Cập nhật avatar URL
   */
  async updateAvatar(userId, avatarUrl) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error updating avatar:', error);
      return { data: null, error };
    }
  },
};

/**
 * Dashboard Statistics Services
 */

export const dashboardService = {
  /**
   * Lấy thống kê tổng quan của user
   */
  async getUserStats(userId) {
    try {
      // Lấy số lượng hình ảnh đã xử lý
      const { data: processedImages, error: imagesError } = await supabase
        .from('processed_images')
        .select('id, status, created_at')
        .eq('user_id', userId);

      if (imagesError) {
        throw imagesError;
      }

      // Tính toán thống kê
      const totalImages = processedImages?.length || 0;
      const completedImages =
        processedImages?.filter((img) => img.status === 'completed').length || 0;
      const successRate = totalImages > 0 ? (completedImages / totalImages) * 100 : 0;

      // Lấy số lượng hình ảnh được tạo hôm nay
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const processedToday =
        processedImages?.filter((img) => new Date(img.created_at) >= today).length || 0;

      // Tạm thời sử dụng số lượng hình ảnh làm số dự án
      const totalProjects = Math.ceil(totalImages / 5) || 0;

      return {
        data: {
          totalImages,
          processedToday,
          successRate: Math.round(successRate * 10) / 10,
          totalProjects,
          completedImages,
        },
        error: null,
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return {
        data: {
          totalImages: 0,
          processedToday: 0,
          successRate: 0,
          totalProjects: 0,
          completedImages: 0,
        },
        error,
      };
    }
  },

  /**
   * Lấy hoạt động gần đây của user
   */
  async getRecentActivity(userId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('processed_images')
        .select('id, status, created_at, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      // Chuyển đổi dữ liệu thành format activity
      const activities =
        data?.map((item) => ({
          id: item.id,
          action: this.getActivityAction(item.status),
          time: item.updated_at,
          icon: this.getActivityIcon(item.status),
          color: this.getActivityColor(item.status),
        })) || [];

      return { data: activities, error: null };
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return { data: [], error };
    }
  },

  /**
   * Helper functions
   */
  getActivityAction(status) {
    const actions = {
      uploaded: 'Tải lên hình ảnh mới',
      processing_background_removal: 'Đang xử lý loại bỏ background',
      background_removed: 'Hoàn thành loại bỏ background',
      processing_upscale: 'Đang nâng cấp chất lượng',
      upscaled: 'Hoàn thành nâng cấp chất lượng',
      processing_background_generation: 'Đang tạo background mới',
      completed: 'Hoàn thành xử lý hình ảnh',
      error: 'Lỗi xử lý hình ảnh',
    };
    return actions[status] || 'Hoạt động không xác định';
  },

  getActivityIcon(status) {
    const icons = {
      uploaded: 'solar:upload-bold',
      processing_background_removal: 'solar:settings-bold',
      background_removed: 'solar:check-circle-bold',
      processing_upscale: 'solar:settings-bold',
      upscaled: 'solar:check-circle-bold',
      processing_background_generation: 'solar:gallery-bold',
      completed: 'solar:check-circle-bold',
      error: 'solar:close-circle-bold',
    };
    return icons[status] || 'solar:info-circle-bold';
  },

  getActivityColor(status) {
    const colors = {
      uploaded: 'info',
      processing_background_removal: 'warning',
      background_removed: 'success',
      processing_upscale: 'warning',
      upscaled: 'success',
      processing_background_generation: 'primary',
      completed: 'success',
      error: 'error',
    };
    return colors[status] || 'default';
  },
};

/**
 * Feature Statistics Services
 */

export const featureStatsService = {
  /**
   * Lấy thống kê cho Background Generator
   */
  async getBackgroundGeneratorStats(userId) {
    try {
      const { data, error } = await supabase
        .from('processed_images')
        .select('id, status, created_at, updated_at')
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      const totalProcessed = data?.length || 0;
      const lastUsed =
        data?.length > 0
          ? new Date(Math.max(...data.map((item) => new Date(item.updated_at))))
          : null;
      const usage = totalProcessed > 0 ? Math.min(100, (totalProcessed / 10) * 100) : 0;

      return {
        data: {
          usage: Math.round(usage),
          lastUsed,
          totalProcessed,
        },
        error: null,
      };
    } catch (error) {
      console.error('Error fetching background generator stats:', error);
      return {
        data: {
          usage: 0,
          lastUsed: null,
          totalProcessed: 0,
        },
        error,
      };
    }
  },
};
