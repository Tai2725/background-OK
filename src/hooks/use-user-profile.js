import { useState, useEffect, useCallback } from 'react';

import { userProfileService } from 'src/lib/supabase-services';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export function useUserProfile() {
  const { user } = useAuthContext();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await userProfileService.getProfile(user.id);

      if (fetchError) {
        throw fetchError;
      }

      // Nếu chưa có profile, tạo profile mới từ thông tin auth
      if (!data) {
        const newProfile = {
          first_name: user.firstName || '',
          last_name: user.lastName || '',
          display_name: user.displayName || user.email,
          avatar_url: user.photoURL || '',
        };

        const { data: createdProfile, error: createError } = await userProfileService.upsertProfile(
          user.id,
          newProfile
        );

        if (createError) {
          throw createError;
        }

        setProfile(createdProfile);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.firstName, user?.lastName, user?.displayName, user?.email, user?.photoURL]);

  const updateProfile = useCallback(
    async (updates) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: updateError } = await userProfileService.upsertProfile(
          user.id,
          updates
        );

        if (updateError) {
          throw updateError;
        }

        setProfile(data);
        return { data, error: null };
      } catch (err) {
        console.error('Error updating user profile:', err);
        setError(err);
        return { data: null, error: err };
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  const updateAvatar = useCallback(
    async (avatarUrl) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: updateError } = await userProfileService.updateAvatar(
          user.id,
          avatarUrl
        );

        if (updateError) {
          throw updateError;
        }

        setProfile(data);
        return { data, error: null };
      } catch (err) {
        console.error('Error updating avatar:', err);
        setError(err);
        return { data: null, error: err };
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    updateAvatar,
    refetch: fetchProfile,
  };
}
