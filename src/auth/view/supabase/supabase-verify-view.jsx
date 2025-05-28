'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';

import { paths } from 'src/routes/paths';

import { EmailInboxIcon } from 'src/assets/icons';

import { getErrorMessage } from '../../utils';
import { FormHead } from '../../components/form-head';
import { FormReturnLink } from '../../components/form-return-link';
import { resendVerificationEmail } from '../../context/supabase';

// ----------------------------------------------------------------------

export function SupabaseVerifyView() {
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleResendEmail = async () => {
    try {
      setIsResending(true);
      setErrorMessage('');

      // Get email from URL params or localStorage
      const urlParams = new URLSearchParams(window.location.search);
      const email = urlParams.get('email') || localStorage.getItem('signup_email');

      if (!email) {
        throw new Error('Không tìm thấy địa chỉ email. Vui lòng đăng ký lại.');
      }

      await resendVerificationEmail({ email });
      setMessage('Email xác thực đã được gửi lại thành công!');
    } catch (error) {
      console.error(error);
      const feedbackMessage = getErrorMessage(error);
      setErrorMessage(feedbackMessage);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      <FormHead
        icon={<EmailInboxIcon />}
        title="Vui lòng kiểm tra email của bạn!"
        description={`Chúng tôi đã gửi một liên kết xác thực đến email của bạn. \nVui lòng nhấp vào liên kết để xác thực tài khoản.`}
      />

      {!!message && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {message}
        </Alert>
      )}

      {!!errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      <Box sx={{ mt: 3, mb: 3 }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={handleResendEmail}
          loading={isResending}
          loadingIndicator="Đang gửi lại..."
        >
          Gửi lại email xác thực
        </Button>
      </Box>

      <FormReturnLink href={paths.auth.supabase.signIn} sx={{ mt: 0 }} />
    </>
  );
}
