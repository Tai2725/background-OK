import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { RouterLink } from 'src/routes/components';

import { CONFIG } from 'src/global-config';

import { Logo } from 'src/components/logo';
import { Iconify } from 'src/components/iconify';

import { blogFooterNavData } from '../../nav-config-blog-focused';

// ----------------------------------------------------------------------

export function BlogFooter({ sx, ...other }) {
  const renderContent = () => (
    <Container
      sx={{
        py: 5,
        textAlign: { xs: 'center', md: 'unset' },
      }}
    >
      <Stack spacing={5} direction={{ xs: 'column', md: 'row' }} justifyContent="space-between">
        {/* Logo & Description */}
        <Stack spacing={3} sx={{ maxWidth: 360 }}>
          <Logo />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Nền tảng chia sẻ kiến thức và hướng dẫn chuyên nghiệp. Cập nhật thường xuyên với những
            tips, tricks và kỹ thuật mới nhất.
          </Typography>

          {/* Social Links */}
          <Stack direction="row" spacing={1}>
            <IconButton color="primary">
              <Iconify icon="solar:chat-round-bold" />
            </IconButton>
            <IconButton color="primary">
              <Iconify icon="solar:phone-bold" />
            </IconButton>
            <IconButton color="primary">
              <Iconify icon="solar:letter-bold" />
            </IconButton>
            <IconButton color="primary">
              <Iconify icon="solar:share-bold" />
            </IconButton>
          </Stack>
        </Stack>

        {/* Navigation Links */}
        <Stack
          spacing={5}
          direction={{ xs: 'column', sm: 'row' }}
          sx={{ flexGrow: 1, justifyContent: 'flex-end' }}
        >
          {blogFooterNavData.map((group) => (
            <Stack key={group.title} spacing={2} sx={{ minWidth: 160 }}>
              <Typography variant="h6" sx={{ color: 'text.primary' }}>
                {group.title}
              </Typography>
              <Stack spacing={1}>
                {group.items.map((link) => (
                  <Link
                    key={link.title}
                    component={RouterLink}
                    href={link.path}
                    color="text.secondary"
                    variant="body2"
                    sx={{
                      '&:hover': {
                        color: 'primary.main',
                      },
                    }}
                  >
                    {link.title}
                  </Link>
                ))}
              </Stack>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Container>
  );

  const renderCopyright = () => (
    <Container>
      <Divider sx={{ mb: 3 }} />

      <Stack
        spacing={2}
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems="center"
        sx={{ pb: 3 }}
      >
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          © 2024 {CONFIG.appName}. Tất cả quyền được bảo lưu.
        </Typography>

        <Stack direction="row" spacing={3}>
          <Link
            component={RouterLink}
            href="/privacy"
            variant="body2"
            color="text.secondary"
            sx={{ '&:hover': { color: 'primary.main' } }}
          >
            Chính sách bảo mật
          </Link>
          <Link
            component={RouterLink}
            href="/terms"
            variant="body2"
            color="text.secondary"
            sx={{ '&:hover': { color: 'primary.main' } }}
          >
            Điều khoản sử dụng
          </Link>
        </Stack>
      </Stack>
    </Container>
  );

  return (
    <Box
      component="footer"
      sx={[
        (theme) => ({
          bgcolor: 'background.default',
          borderTop: `1px solid ${theme.vars.palette.divider}`,
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {renderContent()}
      {renderCopyright()}
    </Box>
  );
}
