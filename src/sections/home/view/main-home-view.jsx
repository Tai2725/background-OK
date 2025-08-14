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

// ----------------------------------------------------------------------

const FEATURES = [
  {
    icon: 'solar:palette-bold-duotone',
    title: 'Background Generator',
    description: 'Tạo background đẹp mắt với AI. Đa dạng style và màu sắc.',
    href: paths.backgroundGenerator.root,
    color: 'primary',
  },
  {
    icon: 'solar:notebook-bold-duotone',
    title: 'Blog & Hướng dẫn',
    description: 'Tips, tricks và hướng dẫn sử dụng các công cụ thiết kế.',
    href: paths.post.root,
    color: 'info',
  },
  {
    icon: 'solar:lightbulb-bold-duotone',
    title: 'Tips & Tricks',
    description: 'Những mẹo hay và thủ thuật hữu ích cho designer.',
    href: `${paths.post.root}?category=tips`,
    color: 'warning',
  },
];

// ----------------------------------------------------------------------

export function MainHomeView() {
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
            Creative Tools Hub
          </Typography>
        </m.div>

        <m.div variants={varFade('inUp', { distance: 24 })}>
          <Typography variant="h4" sx={{ opacity: 0.9, mb: 5, fontWeight: 400 }}>
            Nền tảng công cụ sáng tạo và chia sẻ kiến thức thiết kế
          </Typography>
        </m.div>

        <m.div variants={varFade('inUp', { distance: 24 })}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              component={RouterLink}
              href={paths.backgroundGenerator.root}
              variant="contained"
              size="large"
              color="inherit"
              startIcon={<Iconify icon="solar:palette-bold" />}
              sx={{
                color: 'primary.main',
                minWidth: 200,
                height: 56,
              }}
            >
              Tạo Background
            </Button>
            <Button
              component={RouterLink}
              href={paths.post.root}
              variant="outlined"
              size="large"
              color="inherit"
              startIcon={<Iconify icon="solar:book-bold" />}
              sx={{
                minWidth: 200,
                height: 56,
              }}
            >
              Xem Blog
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
            Công cụ & Tính năng
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
            Khám phá các công cụ sáng tạo và tài nguyên hữu ích
          </Typography>
        </m.div>

        <Grid container spacing={4}>
          {FEATURES.map((feature, index) => (
            <Grid key={feature.title} item xs={12} md={4}>
              <m.div variants={varFade('inUp', { distance: 24, delay: index * 0.1 })}>
                <Card
                  component={RouterLink}
                  href={feature.href}
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    height: '100%',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: (theme) => theme.customShadows.z24,
                      '& .feature-icon': {
                        transform: 'scale(1.1)',
                      },
                    },
                  }}
                >
                  <Iconify
                    icon={feature.icon}
                    width={64}
                    className="feature-icon"
                    sx={{
                      color: `${feature.color}.main`,
                      mb: 3,
                      transition: 'transform 0.3s ease-in-out',
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

  const renderCTA = () => (
    <Box sx={{ bgcolor: 'background.neutral', py: { xs: 8, md: 12 } }}>
      <Container>
        <MotionContainer>
          <m.div variants={varFade('inUp')}>
            <Typography variant="h2" sx={{ textAlign: 'center', mb: 2 }}>
              Bắt đầu sáng tạo ngay hôm nay
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
              Sử dụng các công cụ miễn phí để tạo ra những thiết kế tuyệt vời
            </Typography>
          </m.div>

          <m.div variants={varFade('inUp', { distance: 24 })}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button
                component={RouterLink}
                href={paths.backgroundGenerator.root}
                variant="contained"
                size="large"
                startIcon={<Iconify icon="solar:play-bold" />}
                sx={{ minWidth: 180 }}
              >
                Bắt đầu ngay
              </Button>
              <Button
                component={RouterLink}
                href={paths.post.root}
                variant="outlined"
                size="large"
                startIcon={<Iconify icon="solar:question-circle-bold" />}
                sx={{ minWidth: 180 }}
              >
                Tìm hiểu thêm
              </Button>
            </Stack>
          </m.div>
        </MotionContainer>
      </Container>
    </Box>
  );

  return (
    <>
      <BackToTopButton />

      {renderHero()}
      {renderFeatures()}
      {renderCTA()}
    </>
  );
}
