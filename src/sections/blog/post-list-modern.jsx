import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

import { PostCardModern } from './post-card-modern';

// ----------------------------------------------------------------------

export function PostListModern({ posts, showLoadMore = false, onLoadMore, ...other }) {
  const renderFeaturedPost = (post, index) => (
    <Grid
      key={post.id}
      item
      xs={12}
      md={index === 0 ? 8 : 4}
      sx={{
        ...(index === 0 && {
          '& .MuiCard-root': {
            height: { md: 480 },
            '& .MuiCardContent-root': {
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            },
          },
        }),
      }}
    >
      <PostCardModern post={post} detailsHref={paths.post.details(post.title)} />
    </Grid>
  );

  const renderRegularPost = (post) => (
    <Grid key={post.id} item xs={12} sm={6} md={4}>
      <PostCardModern post={post} detailsHref={paths.post.details(post.title)} />
    </Grid>
  );

  const renderEmptyState = () => (
    <Box
      sx={{
        py: 12,
        textAlign: 'center',
        gridColumn: '1 / -1',
      }}
    >
      <Iconify icon="solar:document-text-bold" width={64} sx={{ color: 'text.disabled', mb: 3 }} />
      <Typography variant="h6" sx={{ mb: 1 }}>
        Chưa có bài viết nào
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Hãy quay lại sau để xem những bài viết mới nhất
      </Typography>
    </Box>
  );

  if (!posts || posts.length === 0) {
    return renderEmptyState();
  }

  const featuredPosts = posts.slice(0, 3);
  const regularPosts = posts.slice(3);

  return (
    <Stack spacing={5} {...other}>
      {/* Featured Posts Section */}
      {featuredPosts.length > 0 && (
        <Box>
          <Typography variant="h4" sx={{ mb: 3 }}>
            Bài viết nổi bật
          </Typography>
          <Grid container spacing={3}>
            {featuredPosts.map((post, index) => renderFeaturedPost(post, index))}
          </Grid>
        </Box>
      )}

      {/* Regular Posts Section */}
      {regularPosts.length > 0 && (
        <Box>
          <Typography variant="h4" sx={{ mb: 3 }}>
            Bài viết khác
          </Typography>
          <Grid container spacing={3}>
            {regularPosts.map((post) => renderRegularPost(post))}
          </Grid>
        </Box>
      )}

      {/* Load More Button */}
      {showLoadMore && (
        <Box sx={{ textAlign: 'center', pt: 3 }}>
          <Button
            size="large"
            variant="outlined"
            onClick={onLoadMore}
            startIcon={<Iconify icon="solar:refresh-bold" />}
          >
            Xem thêm bài viết
          </Button>
        </Box>
      )}
    </Stack>
  );
}
