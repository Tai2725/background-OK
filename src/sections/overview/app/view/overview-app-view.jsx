'use client';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';
import { SeoIllustration } from 'src/assets/illustrations';
import { dashboardService, featureStatsService } from 'src/lib/supabase-services';

import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

import { AppWelcome } from '../app-welcome';
import { AppWidgetSummary } from '../app-widget-summary';

// ----------------------------------------------------------------------

// Cấu hình các tính năng có sẵn trong hệ thống
const AVAILABLE_FEATURES = [
  {
    id: 'background-generator',
    name: 'Background Generator',
    description: 'Tạo background tự động với AI',
    icon: 'solar:gallery-bold',
    color: 'primary',
    path: '/background-generator',
    enabled: true,
  },
  {
    id: 'image-editor',
    name: 'Image Editor',
    description: 'Chỉnh sửa hình ảnh chuyên nghiệp',
    icon: 'solar:pen-bold',
    color: 'secondary',
    path: '/image-editor',
    enabled: false, // Tính năng sẽ được thêm sau
  },
  {
    id: 'ai-assistant',
    name: 'AI Assistant',
    description: 'Trợ lý AI thông minh',
    icon: 'solar:chat-round-bold',
    color: 'info',
    path: '/ai-assistant',
    enabled: false, // Tính năng sẽ được thêm sau
  },
];

export function OverviewAppView() {
  const { user } = useAuthContext();
  const theme = useTheme();

  const [dashboardStats, setDashboardStats] = useState({
    totalProjects: 0,
    totalImages: 0,
    successRate: 0,
    activeFeatures: 0,
  });

  const [featureStats, setFeatureStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        // Fetch user stats
        const { data: stats } = await dashboardService.getUserStats(user.id);
        setDashboardStats({
          ...stats,
          activeFeatures: AVAILABLE_FEATURES.filter((f) => f.enabled).length,
        });

        // Fetch feature stats
        const { data: bgStats } = await featureStatsService.getBackgroundGeneratorStats(user.id);
        setFeatureStats({
          'background-generator': bgStats,
        });

        // Fetch recent activity
        const { data: activity } = await dashboardService.getRecentActivity(user.id, 5);
        setRecentActivity(activity);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  const renderWelcomeSection = () => (
    <Grid size={{ xs: 12, md: 8 }}>
      <AppWelcome
        title={`Chào mừng trở lại 👋 \n ${user?.displayName || 'Người dùng'}`}
        description="Quản lý và theo dõi tất cả các tính năng AI của bạn từ một nơi duy nhất."
        img={<SeoIllustration hideBackground />}
        action={
          <Button variant="contained" color="primary">
            Khám phá ngay
          </Button>
        }
      />
    </Grid>
  );

  const renderQuickStats = () => {
    if (loading) {
      return (
        <>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ p: 3 }}>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="rectangular" height={60} sx={{ mt: 2 }} />
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ p: 3 }}>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="rectangular" height={60} sx={{ mt: 2 }} />
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ p: 3 }}>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="rectangular" height={60} sx={{ mt: 2 }} />
            </Card>
          </Grid>
        </>
      );
    }

    return (
      <>
        <Grid size={{ xs: 12, md: 4 }}>
          <AppWidgetSummary
            title="Tổng dự án"
            percent={12.5}
            total={dashboardStats.totalProjects}
            chart={{
              categories: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
              series: [2, 3, 1, 4, 2, 1, 3],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <AppWidgetSummary
            title="Hình ảnh đã tạo"
            percent={8.2}
            total={dashboardStats.totalImages}
            chart={{
              colors: [theme.palette.info.main],
              categories: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
              series: [15, 25, 18, 32, 28, 35, 40],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <AppWidgetSummary
            title="Tỷ lệ thành công"
            percent={2.1}
            total={dashboardStats.successRate}
            chart={{
              colors: [theme.palette.success.main],
              categories: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
              series: [95, 97, 98, 96, 99, 98, 98],
            }}
          />
        </Grid>
      </>
    );
  };

  <Grid size={{ xs: 12, md: 4 }}>
    <AppWidgetSummary
      title="Total active users"
      percent={2.6}
      total={18765}
      chart={{
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
        series: [15, 18, 12, 51, 68, 11, 39, 37],
      }}
    />
  </Grid>;

  const renderFeaturesGrid = () => (
    <Grid size={{ xs: 12 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Tính năng có sẵn
      </Typography>
      <Grid container spacing={3}>
        {AVAILABLE_FEATURES.map((feature) => (
          <Grid key={feature.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              sx={{
                p: 3,
                height: '100%',
                cursor: feature.enabled ? 'pointer' : 'not-allowed',
                opacity: feature.enabled ? 1 : 0.6,
                transition: 'all 0.3s ease',
                '&:hover': feature.enabled
                  ? {
                      transform: 'translateY(-4px)',
                      boxShadow: (currentTheme) => currentTheme.shadows[8],
                    }
                  : {},
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: `${feature.color}.lighter`,
                    color: `${feature.color}.main`,
                    mr: 2,
                  }}
                >
                  <Iconify icon={feature.icon} width={24} />
                </Box>
                <Typography variant="h6" component="div">
                  {feature.name}
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {feature.description}
              </Typography>

              {feature.enabled && featureStats[feature.id] && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Đã xử lý: {featureStats[feature.id].totalProcessed} lần
                  </Typography>
                </Box>
              )}

              {!feature.enabled && (
                <Typography variant="caption" color="warning.main">
                  Sắp ra mắt
                </Typography>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>
    </Grid>
  );

  const renderRecentActivity = () => (
    <Grid size={{ xs: 12, lg: 8 }}>
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Hoạt động gần đây
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    bgcolor: `${activity.color}.lighter`,
                    color: `${activity.color}.main`,
                  }}
                >
                  <Iconify icon={activity.icon} width={16} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2">{activity.action}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(activity.time).toLocaleString('vi-VN')}
                  </Typography>
                </Box>
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              Chưa có hoạt động nào
            </Typography>
          )}
        </Box>
      </Card>
    </Grid>
  );

  const renderQuickActions = () => (
    <Grid size={{ xs: 12, lg: 4 }}>
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Thao tác nhanh
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button variant="contained" startIcon={<Iconify icon="solar:gallery-bold" />} fullWidth>
            Tạo Background Mới
          </Button>
          <Button variant="outlined" startIcon={<Iconify icon="solar:folder-bold" />} fullWidth>
            Quản lý Dự án
          </Button>
          <Button variant="outlined" startIcon={<Iconify icon="solar:settings-bold" />} fullWidth>
            Cài đặt
          </Button>
        </Box>
      </Card>
    </Grid>
  );

  return (
    <DashboardContent maxWidth="xl">
      <Grid container spacing={3}>
        {renderWelcomeSection()}

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" color="primary.main">
              {dashboardStats.activeFeatures}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tính năng đang hoạt động
            </Typography>
          </Card>
        </Grid>

        {renderQuickStats()}
        {renderFeaturesGrid()}
        {renderRecentActivity()}
        {renderQuickActions()}
      </Grid>
    </DashboardContent>
  );
}
