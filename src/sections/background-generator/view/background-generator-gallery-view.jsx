'use client';

import { useState, useEffect } from 'react';

import {
  Box,
  Card,
  Grid,
  Chip,
  Menu,
  Button,
  MenuItem,
  Container,
  Typography,
  IconButton,
  CardContent,
  CardActions,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { Image } from 'src/components/image';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

// Mock data for gallery
const MOCK_GALLERY_ITEMS = [
  {
    id: '1',
    originalUrl: '/assets/images/products/product-1.jpg',
    finalUrl: '/assets/images/products/product-1-bg.jpg',
    backgroundStyle: 'Studio Trắng',
    createdAt: new Date('2024-01-15'),
    status: 'completed',
  },
  {
    id: '2',
    originalUrl: '/assets/images/products/product-2.jpg',
    finalUrl: '/assets/images/products/product-2-bg.jpg',
    backgroundStyle: 'Thiên Nhiên',
    createdAt: new Date('2024-01-14'),
    status: 'completed',
  },
  {
    id: '3',
    originalUrl: '/assets/images/products/product-3.jpg',
    finalUrl: '/assets/images/products/product-3-bg.jpg',
    backgroundStyle: 'Phòng Hiện Đại',
    createdAt: new Date('2024-01-13'),
    status: 'completed',
  },
];

// ----------------------------------------------------------------------

export function BackgroundGeneratorGalleryView() {
  const router = useRouter();
  const { user } = useAuthContext();

  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    // TODO: Fetch gallery items from Supabase
    // For now, using mock data
    setTimeout(() => {
      setGalleryItems(MOCK_GALLERY_ITEMS);
      setLoading(false);
    }, 1000);
  }, []);

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
  };

  const handleMenuOpen = (event, item) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const handleDownload = (item) => {
    // Create download link
    const link = document.createElement('a');
    link.href = item.finalUrl;
    link.download = `background-generated-${item.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Tải xuống thành công!');
    handleMenuClose();
  };

  const handleDelete = async (item) => {
    try {
      // TODO: Delete from Supabase
      setGalleryItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success('Đã xóa hình ảnh');
    } catch (error) {
      toast.error('Lỗi khi xóa hình ảnh');
    }
    handleMenuClose();
  };

  const handleCreateNew = () => {
    router.push(paths.backgroundGenerator.generator);
  };

  // Filter items
  const filteredItems = galleryItems.filter((item) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return item.createdAt > oneWeekAgo;
    }
    return item.backgroundStyle.toLowerCase().includes(selectedFilter.toLowerCase());
  });

  const filters = [
    { label: 'Tất Cả', value: 'all' },
    { label: 'Gần Đây', value: 'recent' },
    { label: 'Studio', value: 'studio' },
    { label: 'Thiên Nhiên', value: 'thiên nhiên' },
    { label: 'Hiện Đại', value: 'hiện đại' },
  ];

  if (loading) {
    return (
      <Container maxWidth="xl">
        <CustomBreadcrumbs
          heading="Gallery"
          links={[
            { name: 'Background Generator', href: paths.backgroundGenerator.root },
            { name: 'Gallery' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <Typography>Đang tải...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <CustomBreadcrumbs
        heading="Gallery"
        links={[
          { name: 'Background Generator', href: paths.backgroundGenerator.root },
          { name: 'Gallery' },
        ]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:magic-stick-3-bold" />}
            onClick={handleCreateNew}
          >
            Tạo Background Mới
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* Filters */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Bộ Lọc
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {filters.map((filter) => (
            <Chip
              key={filter.value}
              label={filter.label}
              variant={selectedFilter === filter.value ? 'filled' : 'outlined'}
              color={selectedFilter === filter.value ? 'primary' : 'default'}
              onClick={() => handleFilterChange(filter.value)}
            />
          ))}
        </Box>
      </Box>

      {/* Gallery Grid */}
      {filteredItems.length === 0 ? (
        <EmptyContent
          filled
          title="Chưa có hình ảnh nào"
          description="Bắt đầu tạo background đầu tiên của bạn!"
          action={
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:magic-stick-3-bold" />}
              onClick={handleCreateNew}
            >
              Tạo Background Ngay
            </Button>
          }
        />
      ) : (
        <Grid container spacing={3}>
          {filteredItems.map((item) => (
            <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={item.id}>
              <Card sx={{ height: '100%' }}>
                {/* Image */}
                <Box sx={{ position: 'relative', paddingTop: '100%' }}>
                  <Image
                    src={item.finalUrl}
                    alt={`Background generated ${item.id}`}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />

                  {/* Overlay Actions */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      display: 'flex',
                      gap: 1,
                    }}
                  >
                    <IconButton
                      size="small"
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        '&:hover': { bgcolor: 'white' },
                      }}
                      onClick={(e) => handleMenuOpen(e, item)}
                    >
                      <Iconify icon="solar:menu-dots-bold" />
                    </IconButton>
                  </Box>

                  {/* Status Badge */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      left: 8,
                    }}
                  >
                    <Chip
                      label={item.backgroundStyle}
                      size="small"
                      color="primary"
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        color: 'primary.main',
                      }}
                    />
                  </Box>
                </Box>

                {/* Content */}
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Tạo ngày: {item.createdAt.toLocaleDateString('vi-VN')}
                  </Typography>
                </CardContent>

                {/* Actions */}
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    size="small"
                    startIcon={<Iconify icon="solar:download-bold" />}
                    onClick={() => handleDownload(item)}
                  >
                    Tải Xuống
                  </Button>
                  <Button
                    size="small"
                    color="inherit"
                    startIcon={<Iconify icon="solar:eye-bold" />}
                    onClick={() => {
                      // TODO: Open lightbox or detail view
                      toast.info('Tính năng xem chi tiết đang phát triển');
                    }}
                  >
                    Xem
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => handleDownload(selectedItem)}>
          <Iconify icon="solar:download-bold" sx={{ mr: 1 }} />
          Tải Xuống
        </MenuItem>
        <MenuItem
          onClick={() => {
            // TODO: Share functionality
            toast.info('Tính năng chia sẻ đang phát triển');
            handleMenuClose();
          }}
        >
          <Iconify icon="solar:share-bold" sx={{ mr: 1 }} />
          Chia Sẻ
        </MenuItem>
        <MenuItem onClick={() => handleDelete(selectedItem)} sx={{ color: 'error.main' }}>
          <Iconify icon="solar:trash-bin-trash-bold" sx={{ mr: 1 }} />
          Xóa
        </MenuItem>
      </Menu>
    </Container>
  );
}
