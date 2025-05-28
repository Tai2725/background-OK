'use client';

import { z as zod } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { getErrorMessage } from '../../utils';
import { signUp } from '../../context/supabase';
import { FormHead } from '../../components/form-head';
import { SignUpTerms } from '../../components/sign-up-terms';

// ----------------------------------------------------------------------

export const SignUpSchema = zod.object({
  firstName: zod.string().min(1, { message: 'Họ là bắt buộc!' }),
  lastName: zod.string().min(1, { message: 'Tên là bắt buộc!' }),
  email: zod
    .string()
    .min(1, { message: 'Email là bắt buộc!' })
    .email({ message: 'Email phải là địa chỉ email hợp lệ!' }),
  password: zod
    .string()
    .min(1, { message: 'Mật khẩu là bắt buộc!' })
    .min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự!' }),
});

// ----------------------------------------------------------------------

export function SupabaseSignUpView() {
  const router = useRouter();

  const showPassword = useBoolean();

  const [errorMessage, setErrorMessage] = useState('');

  const defaultValues = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  };

  const methods = useForm({
    resolver: zodResolver(SignUpSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await signUp({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });

      // Store email for verification page
      localStorage.setItem('signup_email', data.email);
      router.push(`${paths.auth.supabase.verify}?email=${encodeURIComponent(data.email)}`);
    } catch (error) {
      console.error(error);
      const feedbackMessage = getErrorMessage(error);
      setErrorMessage(feedbackMessage);
    }
  });

  const renderForm = () => (
    <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{ display: 'flex', gap: { xs: 3, sm: 2 }, flexDirection: { xs: 'column', sm: 'row' } }}
      >
        <Field.Text
          name="firstName"
          label="Họ"
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <Field.Text
          name="lastName"
          label="Tên"
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Box>

      <Field.Text name="email" label="Địa chỉ email" slotProps={{ inputLabel: { shrink: true } }} />

      <Field.Text
        name="password"
        label="Mật khẩu"
        placeholder="6+ ký tự"
        type={showPassword.value ? 'text' : 'password'}
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={showPassword.onToggle} edge="end">
                  <Iconify icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <Button
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="Đang tạo tài khoản..."
      >
        Tạo tài khoản
      </Button>
    </Box>
  );

  return (
    <>
      <FormHead
        title="Get started absolutely free"
        description={
          <>
            {`Already have an account? `}
            <Link component={RouterLink} href={paths.auth.supabase.signIn} variant="subtitle2">
              Get started
            </Link>
          </>
        }
        sx={{ textAlign: { xs: 'center', md: 'left' } }}
      />

      {!!errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm()}
      </Form>

      <SignUpTerms />
    </>
  );
}
