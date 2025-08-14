'use client';

import { useSetState } from 'minimal-shared/hooks';
import { useMemo, useEffect, useCallback } from 'react';

import axios from 'src/lib/axios';
import { supabase } from 'src/lib/supabase';
import { userProfileService } from 'src/lib/supabase-services';

import { AuthContext } from '../auth-context';

// ----------------------------------------------------------------------

export function AuthProvider({ children }) {
  const { state, setState } = useSetState({ user: null, loading: true });

  const checkUserSession = useCallback(async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        setState({ user: null, loading: false });
        console.error(error);
        throw error;
      }

      if (session) {
        const accessToken = session?.access_token;

        // Đồng bộ user profile nếu cần
        try {
          const { data: profile } = await userProfileService.getProfile(session.user.id);
          if (!profile) {
            // Tạo profile mới nếu chưa có
            await userProfileService.upsertProfile(session.user.id, {
              first_name: session.user.user_metadata?.first_name || '',
              last_name: session.user.user_metadata?.last_name || '',
              display_name:
                session.user.user_metadata?.display_name ||
                session.user.user_metadata?.full_name ||
                session.user.email,
              avatar_url:
                session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '',
            });
          }
        } catch (syncError) {
          console.error('Error syncing user profile:', syncError);
        }

        setState({ user: { ...session, ...session?.user }, loading: false });
        axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      } else {
        setState({ user: null, loading: false });
        delete axios.defaults.headers.common.Authorization;
      }
    } catch (error) {
      console.error(error);
      setState({ user: null, loading: false });
    }
  }, [setState]);

  useEffect(() => {
    checkUserSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------------------------------------------------

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';

  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo(
    () => ({
      user: state.user
        ? {
            ...state.user,
            id: state.user?.id,
            accessToken: state.user?.access_token,
            displayName:
              state.user?.user_metadata?.display_name ||
              state.user?.user_metadata?.full_name ||
              state.user?.email,
            email: state.user?.email,
            photoURL: state.user?.user_metadata?.avatar_url || state.user?.user_metadata?.picture,
            role: state.user?.role ?? 'user',
            firstName: state.user?.user_metadata?.first_name,
            lastName: state.user?.user_metadata?.last_name,
          }
        : null,
      checkUserSession,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
    }),
    [checkUserSession, state.user, status]
  );

  return <AuthContext value={memoizedValue}>{children}</AuthContext>;
}
