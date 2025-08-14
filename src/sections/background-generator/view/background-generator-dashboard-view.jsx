'use client';

import { useState, useEffect } from 'react';

import {
  Box,
  Card,
  Grid,
  Button,
  Container,
  Typography,
  CardContent,
  CardActions,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export function BackgroundGeneratorDashboardView() {
  const router = useRouter();
  const { user } = useAuthContext();

  const [stats, setStats] = useState({
    totalImages: 0,
    processedToday: 0,
    successRate: 0,
    totalProjects: 0,
  });

  useEffect(() => {
    // TODO: Fetch user statistics from Supabase
    // For now, using mock data
    setStats({
      totalImages: 24,
      processedToday: 5,
      successRate: 98.5,
      totalProjects: 3,
    });
  }, []);

  const handleNavigateToGenerator = () => {
    router.push(paths.backgroundGenerator.generator);
  };

  const handleNavigateToGallery = () => {
    router.push(paths.backgroundGenerator.gallery);
  };

  const quickActions = [
    {
      title: 'Tạo Background Mới',
      description: 'Upload hình ảnh và tạo background chuyên nghiệp',
      icon: 'solar:magic-stick-3-bold-duotone',
      color: 'primary',
      action: handleNavigateToGenerator,
    },
    {
      title: 'Xem Thư Viện',
      description: 'Duyệt qua các hình ảnh đã xử lý',
      icon: 'solar:gallery-bold-duotone',
      color: 'secondary',
      action: handleNavigateToGallery,
    },
    {
      title: 'Cài Đặt',
      description: 'Quản lý tài khoản và cấu hình API',
      icon: 'solar:settings-bold-duotone',
      color: 'info',
      action: () => router.push(paths.backgroundGenerator.settings),
    },
  ];

  const statCards = [
    {
      title: 'Tổng Hình Ảnh',
      value: stats.totalImages,
      icon: 'solar:gallery-bold-duotone',
      color: 'primary',
    },
    {
      title: 'Xử Lý Hôm Nay',
      value: stats.processedToday,
      icon: 'solar:clock-circle-bold-duotone',
      color: 'success',
    },
    {
      title: 'Tỷ Lệ Thành Công',
      value: `${stats.successRate}%`,
      icon: 'solar:chart-2-bold-duotone',
      color: 'warning',
    },
    {
      title: 'Dự Án',
      value: stats.totalProjects,
      icon: 'solar:folder-bold-duotone',
      color: 'info',
    },
  ];

  return (
    <Container maxWidth="xl">
      <CustomBreadcrumbs
        heading="Dashboard"
        links={[
          { name: 'Background Generator', href: paths.backgroundGenerator.root },
          { name: 'Dashboard' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* Welcome Section */}
      <Card sx={{ mb: 5, p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Box sx={{ color: 'white' }}>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Chào mừng trở lại, {user?.user_metadata?.full_name || user?.email}! 👋
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Tạo background chuyên nghiệp cho hình ảnh sản phẩm của bạn bằng AI
          </Typography>
        </Box>
      </Card>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        {statCards.map((stat, index) => (
          <Grid item size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      bgcolor: `${stat.color}.lighter`,
                      color: `${stat.color}.main`,
                      mr: 2,
                    }}
                  >
                    <Iconify icon={stat.icon} width={24} />
                  </Box>
                  <Typography variant="h6" color="text.secondary">
                    {stat.title}
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Typography variant="h5" sx={{ mb: 3 }}>
        Thao Tác Nhanh
      </Typography>

      <Grid container spacing={3}>
        {quickActions.map((action, index) => (
          <Grid item size={{ xs: 12, md: 4 }} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    bgcolor: `${action.color}.lighter`,
                    color: `${action.color}.main`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                  }}
                >
                  <Iconify icon={action.icon} width={32} />
                </Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {action.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                <Button
                  variant="contained"
                  color={action.color}
                  onClick={action.action}
                  startIcon={<Iconify icon="solar:arrow-right-bold" />}
                >
                  Bắt Đầu
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Activity Section */}
      <Box sx={{ mt: 5 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Hoạt Động Gần Đây
        </Typography>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Iconify
              icon="solar:history-bold-duotone"
              width={64}
              sx={{ color: 'text.disabled', mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary">
              Chưa có hoạt động nào
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
              Bắt đầu tạo background đầu tiên của bạn!
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleNavigateToGenerator}
              sx={{ mt: 3 }}
              startIcon={<Iconify icon="solar:magic-stick-3-bold" />}
            >
              Tạo Background Ngay
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
