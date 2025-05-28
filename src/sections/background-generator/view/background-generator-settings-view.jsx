'use client';

import { useState } from 'react';

import {
  Box,
  Card,
  Grid,
  Button,
  Container,
  Typography,
  CardContent,
  CardHeader,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Chip,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useAuthContext } from 'src/auth/hooks';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

export function BackgroundGeneratorSettingsView() {
  const { user } = useAuthContext();

  const [settings, setSettings] = useState({
    autoSave: true,
    highQuality: true,
    emailNotifications: false,
    defaultStyle: 'studio-white',
    maxImages: 100,
  });

  const [apiStatus, setApiStatus] = useState({
    runware: 'connected',
    supabase: 'connected',
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveSettings = async () => {
    try {
      // TODO: Save settings to Supabase
      toast.success('Cài đặt đã được lưu!');
    } catch (error) {
      toast.error('Lỗi khi lưu cài đặt');
    }
  };

  const handleTestConnection = async (service) => {
    try {
      setApiStatus(prev => ({
        ...prev,
        [service]: 'testing',
      }));

      // TODO: Test API connection
      await new Promise(resolve => setTimeout(resolve, 2000));

      setApiStatus(prev => ({
        ...prev,
        [service]: 'connected',
      }));

      toast.success(`Kết nối ${service} thành công!`);
    } catch (error) {
      setApiStatus(prev => ({
        ...prev,
        [service]: 'error',
      }));
      toast.error(`Lỗi kết nối ${service}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'success';
      case 'testing': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'connected': return 'Đã kết nối';
      case 'testing': return 'Đang kiểm tra';
      case 'error': return 'Lỗi kết nối';
      default: return 'Chưa kết nối';
    }
  };

  return (
    <Container maxWidth="xl">
      <CustomBreadcrumbs
        heading="Settings"
        links={[
          { name: 'Background Generator', href: paths.backgroundGenerator.root },
          { name: 'Settings' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Grid container spacing={3}>
        {/* Account Information */}
        <Grid item size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader
              title="Thông Tin Tài Khoản"
              avatar={<Iconify icon="solar:user-bold-duotone" />}
            />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Email"
                  value={user?.email || ''}
                  disabled
                  fullWidth
                />
                <TextField
                  label="Tên hiển thị"
                  value={user?.user_metadata?.full_name || ''}
                  disabled
                  fullWidth
                />
                <TextField
                  label="Ngày tham gia"
                  value={user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : ''}
                  disabled
                  fullWidth
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* API Status */}
        <Grid item size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader
              title="Trạng Thái API"
              avatar={<Iconify icon="solar:server-bold-duotone" />}
            />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Runware API */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="subtitle2">Runware API</Typography>
                    <Typography variant="caption" color="text.secondary">
                      AI Background Generation
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={getStatusText(apiStatus.runware)}
                      color={getStatusColor(apiStatus.runware)}
                      size="small"
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleTestConnection('runware')}
                      disabled={apiStatus.runware === 'testing'}
                    >
                      Test
                    </Button>
                  </Box>
                </Box>

                <Divider />

                {/* Supabase API */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="subtitle2">Supabase</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Database & Storage
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={getStatusText(apiStatus.supabase)}
                      color={getStatusColor(apiStatus.supabase)}
                      size="small"
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleTestConnection('supabase')}
                      disabled={apiStatus.supabase === 'testing'}
                    >
                      Test
                    </Button>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* App Settings */}
        <Grid item size={{xs: 12}}>
          <Card>
            <CardHeader
              title="Cài Đặt Ứng Dụng"
              avatar={<Iconify icon="solar:settings-bold-duotone" />}
            />
            <CardContent>
              <Grid container spacing={3}>
                {/* Processing Settings */}
                <Grid item size={{ xs: 12, md: 6 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Xử Lý Hình Ảnh
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.autoSave}
                          onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                        />
                      }
                      label="Tự động lưu kết quả"
                    />
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.highQuality}
                          onChange={(e) => handleSettingChange('highQuality', e.target.checked)}
                        />
                      }
                      label="Chất lượng cao (chậm hơn)"
                    />

                    <TextField
                      label="Số lượng ảnh tối đa"
                      type="number"
                      value={settings.maxImages}
                      onChange={(e) => handleSettingChange('maxImages', parseInt(e.target.value))}
                      inputProps={{ min: 10, max: 1000 }}
                      helperText="Giới hạn số ảnh lưu trữ"
                    />
                  </Box>
                </Grid>

                {/* Notification Settings */}
                <Grid item size={{ xs: 12, md: 6 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Thông Báo
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.emailNotifications}
                          onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                        />
                      }
                      label="Thông báo qua email"
                    />

                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        Thông báo sẽ được gửi khi quá trình xử lý hoàn tất hoặc có lỗi xảy ra.
                      </Typography>
                    </Alert>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Save Button */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  onClick={handleSaveSettings}
                  startIcon={<Iconify icon="solar:diskette-bold" />}
                >
                  Lưu Cài Đặt
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Usage Statistics */}
        <Grid item size={{xs: 12}}>
          <Card>
            <CardHeader
              title="Thống Kê Sử Dụng"
              avatar={<Iconify icon="solar:chart-2-bold-duotone" />}
            />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary.main">
                      24
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tổng hình ảnh
                    </Typography>
                  </Box>
                </Grid>
                <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      5
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Hôm nay
                    </Typography>
                  </Box>
                </Grid>
                <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      98.5%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tỷ lệ thành công
                    </Typography>
                  </Box>
                </Grid>
                <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main">
                      2.1GB
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Dung lượng sử dụng
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
