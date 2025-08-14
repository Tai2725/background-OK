'use client';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

import { PostSort } from '../post-sort';
import { PostSearch } from '../post-search';
import { POST_SORT_OPTIONS } from '../post-config';
import { PostListModern } from '../post-list-modern';

// ----------------------------------------------------------------------

const CATEGORIES = [
  { value: 'all', label: 'Tất cả', icon: 'solar:list-bold-duotone' },
  { value: 'tips', label: 'Tips & Tricks', icon: 'solar:lightbulb-bold-duotone' },
  { value: 'guide', label: 'Hướng dẫn', icon: 'solar:book-bold-duotone' },
  { value: 'updates', label: 'Cập nhật', icon: 'solar:refresh-bold-duotone' },
];

// ----------------------------------------------------------------------

export function BlogHomeView({ posts = [] }) {
  const [sortBy, setSortBy] = useState('latest');
  const [currentCategory, setCurrentCategory] = useState('all');

  const handleCategoryChange = useCallback((event, newValue) => {
    setCurrentCategory(newValue);
  }, []);

  // Filter posts by category
  const filteredPosts = posts.filter((post) => {
    if (currentCategory === 'all') return true;
    return post.category === currentCategory;
  });

  // Sort posts
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case 'latest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'popular':
        return (b.totalViews || 0) - (a.totalViews || 0);
      default:
        return 0;
    }
  });

  const renderHero = () => (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        background: (theme) =>
          `linear-gradient(135deg, ${theme.vars.palette.primary.main} 0%, ${theme.vars.palette.primary.dark} 100%)`,
        color: 'primary.contrastText',
        textAlign: 'center',
      }}
    >
      <Container maxWidth="md">
        <Typography variant="h2" component="h1" sx={{ mb: 3 }}>
          Blog & Hướng dẫn
        </Typography>
        <Typography variant="h5" sx={{ opacity: 0.9, mb: 4, fontWeight: 400 }}>
          Tips, tricks và hướng dẫn sử dụng phần mềm
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button
            variant="contained"
            size="large"
            color="inherit"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            sx={{ color: 'primary.main' }}
          >
            Đăng bài mới
          </Button>
          <Button
            variant="outlined"
            size="large"
            color="inherit"
            startIcon={<Iconify icon="solar:bookmark-bold" />}
          >
            Bài viết yêu thích
          </Button>
        </Stack>
      </Container>
    </Box>
  );

  const renderCategories = () => (
    <Container sx={{ mt: -4, position: 'relative', zIndex: 10 }}>
      <Card sx={{ p: 2, boxShadow: (theme) => theme.customShadows.z24 }}>
        <Tabs
          value={currentCategory}
          onChange={handleCategoryChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minHeight: 64,
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
            },
          }}
        >
          {CATEGORIES.map((category) => (
            <Tab
              key={category.value}
              value={category.value}
              label={category.label}
              icon={<Iconify icon={category.icon} width={20} />}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Card>
    </Container>
  );

  const renderStats = () => (
    <Container sx={{ mt: 4 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 5 }}>
        {[
          { label: 'Tổng bài viết', value: posts.length, icon: 'solar:document-text-bold' },
          { label: 'Danh mục', value: CATEGORIES.length - 1, icon: 'solar:folder-bold' },
          { label: 'Lượt xem', value: '12.5K', icon: 'solar:eye-bold' },
        ].map((stat, index) => (
          <Card key={index} sx={{ flex: 1, textAlign: 'center', p: 3 }}>
            <Iconify icon={stat.icon} width={48} sx={{ color: 'primary.main', mb: 2 }} />
            <Typography variant="h3" component="div" sx={{ mb: 1 }}>
              {stat.value}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {stat.label}
            </Typography>
          </Card>
        ))}
      </Stack>
    </Container>
  );

  const renderContent = () => (
    <Container sx={{ pb: 10 }}>
      <Box
        sx={{
          gap: 3,
          display: 'flex',
          mb: { xs: 3, md: 5 },
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-end', sm: 'center' },
        }}
      >
        <PostSearch redirectPath={(title) => paths.post.details(title)} />
        <PostSort
          sort={sortBy}
          onSort={(newValue) => setSortBy(newValue)}
          sortOptions={POST_SORT_OPTIONS}
        />
      </Box>

      {sortedPosts.length > 0 ? (
        <PostListModern posts={sortedPosts} />
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
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Hãy bắt đầu tạo bài viết đầu tiên của bạn
          </Typography>
          <Button variant="contained" startIcon={<Iconify icon="solar:add-circle-bold" />}>
            Tạo bài viết
          </Button>
        </Card>
      )}
    </Container>
  );

  return (
    <>
      {renderHero()}
      {renderCategories()}
      {renderStats()}
      {renderContent()}
    </>
  );
}
