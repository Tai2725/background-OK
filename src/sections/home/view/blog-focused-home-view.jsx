'use client';

import { m } from 'framer-motion';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { varFade, MotionContainer } from 'src/components/animate';
import { BackToTopButton } from 'src/components/animate/back-to-top-button';

import { PostListModern } from 'src/sections/blog/post-list-modern';

// ----------------------------------------------------------------------

const FEATURES = [
  {
    icon: 'solar:lightbulb-bold-duotone',
    title: 'Tips & Tricks',
    description: 'Những mẹo hay và thủ thuật hữu ích để tối ưu hóa công việc của bạn.',
    color: 'warning',
  },
  {
    icon: 'solar:book-bold-duotone',
    title: 'Hướng dẫn chi tiết',
    description: 'Hướng dẫn từng bước một cách chi tiết và dễ hiểu.',
    color: 'info',
  },
  {
    icon: 'solar:refresh-bold-duotone',
    title: 'Cập nhật thường xuyên',
    description: 'Luôn cập nhật những tính năng mới và cải tiến.',
    color: 'success',
  },
];

// ----------------------------------------------------------------------

export function BlogFocusedHomeView({ latestPosts = [] }) {
  const renderHero = () => (
    <Box
      component={MotionContainer}
      sx={{
        py: { xs: 10, md: 15 },
        background: (theme) =>
          `linear-gradient(135deg, ${theme.vars.palette.primary.main} 0%, ${theme.vars.palette.primary.dark} 100%)`,
        color: 'primary.contrastText',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Ccircle cx="7" cy="7" r="7"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}
      />

      <Container maxWidth="md" sx={{ position: 'relative' }}>
        <m.div variants={varFade('inUp')}>
          <Typography variant="h1" component="h1" sx={{ mb: 3, fontWeight: 800 }}>
            Blog & Hướng dẫn
          </Typography>
        </m.div>

        <m.div variants={varFade('inUp', { distance: 24 })}>
          <Typography variant="h4" sx={{ opacity: 0.9, mb: 5, fontWeight: 400 }}>
            Khám phá những tips, tricks và hướng dẫn hữu ích
          </Typography>
        </m.div>

        <m.div variants={varFade('inUp', { distance: 24 })}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              component={RouterLink}
              href={paths.post.root}
              variant="contained"
              size="large"
              color="inherit"
              startIcon={<Iconify icon="solar:book-bold" />}
              sx={{
                color: 'primary.main',
                minWidth: 160,
                height: 56,
              }}
            >
              Xem tất cả bài viết
            </Button>
            <Button
              variant="outlined"
              size="large"
              color="inherit"
              startIcon={<Iconify icon="solar:bookmark-bold" />}
              sx={{
                minWidth: 160,
                height: 56,
              }}
            >
              Bài viết yêu thích
            </Button>
          </Stack>
        </m.div>
      </Container>
    </Box>
  );

  const renderFeatures = () => (
    <Container sx={{ py: { xs: 8, md: 12 } }}>
      <MotionContainer>
        <m.div variants={varFade('inUp')}>
          <Typography variant="h2" sx={{ textAlign: 'center', mb: 2 }}>
            Tại sao chọn chúng tôi?
          </Typography>
        </m.div>

        <m.div variants={varFade('inUp', { distance: 24 })}>
          <Typography
            variant="h5"
            sx={{
              textAlign: 'center',
              color: 'text.secondary',
              mb: { xs: 5, md: 8 },
              fontWeight: 400,
            }}
          >
            Chúng tôi cung cấp nội dung chất lượng cao và hữu ích
          </Typography>
        </m.div>

        <Grid container spacing={4}>
          {FEATURES.map((feature, index) => (
            <Grid key={feature.title} item xs={12} md={4}>
              <m.div variants={varFade('inUp', { distance: 24, delay: index * 0.1 })}>
                <Card
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    height: '100%',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: (theme) => theme.customShadows.z24,
                    },
                  }}
                >
                  <Iconify
                    icon={feature.icon}
                    width={64}
                    sx={{
                      color: `${feature.color}.main`,
                      mb: 3,
                    }}
                  />
                  <Typography variant="h5" sx={{ mb: 2 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    {feature.description}
                  </Typography>
                </Card>
              </m.div>
            </Grid>
          ))}
        </Grid>
      </MotionContainer>
    </Container>
  );

  const renderLatestPosts = () => (
    <Box sx={{ bgcolor: 'background.neutral', py: { xs: 8, md: 12 } }}>
      <Container>
        <MotionContainer>
          <m.div variants={varFade('inUp')}>
            <Typography variant="h2" sx={{ textAlign: 'center', mb: 2 }}>
              Bài viết mới nhất
            </Typography>
          </m.div>

          <m.div variants={varFade('inUp', { distance: 24 })}>
            <Typography
              variant="h5"
              sx={{
                textAlign: 'center',
                color: 'text.secondary',
                mb: { xs: 5, md: 8 },
                fontWeight: 400,
              }}
            >
              Cập nhật những kiến thức và kỹ thuật mới nhất
            </Typography>
          </m.div>

          <m.div variants={varFade('inUp', { distance: 24 })}>
            {latestPosts.length > 0 ? (
              <PostListModern posts={latestPosts.slice(0, 6)} />
            ) : (
              <Card sx={{ p: 8, textAlign: 'center' }}>
                <Iconify
                  icon="solar:document-text-bold"
                  width={64}
                  sx={{ color: 'text.disabled', mb: 3 }}
                />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Chưa có bài viết nào
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Hãy quay lại sau để xem những bài viết mới nhất
                </Typography>
              </Card>
            )}
          </m.div>

          {latestPosts.length > 6 && (
            <m.div variants={varFade('inUp', { distance: 24 })}>
              <Box sx={{ textAlign: 'center', mt: 5 }}>
                <Button
                  component={RouterLink}
                  href={paths.post.root}
                  variant="contained"
                  size="large"
                  startIcon={<Iconify icon="solar:arrow-right-bold" />}
                >
                  Xem tất cả bài viết
                </Button>
              </Box>
            </m.div>
          )}
        </MotionContainer>
      </Container>
    </Box>
  );

  return (
    <>
      <BackToTopButton />

      {renderHero()}
      {renderFeatures()}
      {renderLatestPosts()}
    </>
  );
}
