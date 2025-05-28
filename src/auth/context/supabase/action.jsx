'use client';

import { paths } from 'src/routes/paths';

import { supabase } from 'src/lib/supabase';

/** **************************************
 * Sign in
 *************************************** */

// ----------------------------------------------------------------------

export const signInWithPassword = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error(error);
    throw error;
  }

  return { data, error };
};

/** **************************************
 * Sign in with Google OAuth
 *************************************** */

// ----------------------------------------------------------------------

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}${paths.dashboard.root}`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    console.error(error);
    throw error;
  }

  return { data, error };
};

/** **************************************
 * Sign up
 *************************************** */

// ----------------------------------------------------------------------

export const signUp = async ({ email, password, firstName, lastName }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}${paths.auth.supabase.verify}`,
      data: {
        display_name: `${firstName} ${lastName}`,
        first_name: firstName,
        last_name: lastName,
      },
    },
  });

  if (error) {
    console.error(error);
    throw error;
  }

  if (!data?.user?.identities?.length) {
    throw new Error('Người dùng này đã tồn tại');
  }

  return { data, error };
};

/** **************************************
 * Resend verification email
 *************************************** */

// ----------------------------------------------------------------------

export const resendVerificationEmail = async ({ email }) => {
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${window.location.origin}${paths.auth.supabase.verify}`,
    },
  });

  if (error) {
    console.error(error);
    throw error;
  }

  return { data, error };
};

/** **************************************
 * Sign out
 *************************************** */

// ----------------------------------------------------------------------

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error(error);
    throw error;
  }

  return { error };
};

/** **************************************
 * Reset password
 *************************************** */

// ----------------------------------------------------------------------

export const resetPassword = async ({ email }) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}${paths.auth.supabase.updatePassword}`,
  });

  if (error) {
    console.error(error);
    throw error;
  }

  return { data, error };
};

/** **************************************
 * Update password
 *************************************** */

// ----------------------------------------------------------------------

export const updatePassword = async ({ password }) => {
  const { data, error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error(error);
    throw error;
  }

  return { data, error };
};
