import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';

import { Image } from 'src/components/image';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const CATEGORY_COLORS = {
  tips: 'warning',
  guide: 'info',
  updates: 'success',
  default: 'default',
};

const CATEGORY_ICONS = {
  tips: 'solar:lightbulb-bold-duotone',
  guide: 'solar:book-bold-duotone',
  updates: 'solar:refresh-bold-duotone',
  default: 'solar:document-text-bold-duotone',
};

// ----------------------------------------------------------------------

export function PostCardModern({ post, detailsHref, sx, ...other }) {
  const categoryColor = CATEGORY_COLORS[post.category] || CATEGORY_COLORS.default;
  const categoryIcon = CATEGORY_ICONS[post.category] || CATEGORY_ICONS.default;

  const renderCover = () => (
    <Box sx={{ position: 'relative', overflow: 'hidden' }}>
      <Image
        src={post.coverUrl}
        alt={post.title}
        ratio="16/9"
        sx={{
          transition: 'transform 0.3s ease-in-out',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        }}
      />

      {/* Category Badge */}
      <Chip
        size="small"
        label={post.category || 'General'}
        color={categoryColor}
        icon={<Iconify icon={categoryIcon} width={16} />}
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          textTransform: 'capitalize',
          fontWeight: 600,
        }}
      />

      {/* Reading Time */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          bgcolor: 'rgba(0, 0, 0, 0.6)',
          color: 'white',
          px: 1.5,
          py: 0.5,
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        <Iconify icon="solar:clock-circle-bold" width={14} />
        <Typography variant="caption" sx={{ fontWeight: 500 }}>
          {post.readingTime || '5'} phút
        </Typography>
      </Box>
    </Box>
  );

  const renderContent = () => (
    <CardContent sx={{ p: 3 }}>
      <Stack spacing={2}>
        {/* Title */}
        <Link
          component={RouterLink}
          href={detailsHref}
          color="inherit"
          variant="h6"
          sx={{
            textDecoration: 'none',
            '&:hover': {
              color: 'primary.main',
            },
          }}
        >
          {post.title}
        </Link>

        {/* Description */}
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.6,
          }}
        >
          {post.description}
        </Typography>

        <Divider />

        {/* Author & Date */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar
              src={post.author?.avatarUrl}
              alt={post.author?.name}
              sx={{ width: 32, height: 32 }}
            >
              {post.author?.name?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontSize: '0.875rem' }}>
                {post.author?.name || 'Admin'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {fDate(post.createdAt)}
              </Typography>
            </Box>
          </Stack>

          {/* Stats */}
          <Stack direction="row" spacing={2}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Iconify icon="solar:eye-bold" width={16} sx={{ color: 'text.secondary' }} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {post.totalViews || 0}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Iconify icon="solar:heart-bold" width={16} sx={{ color: 'text.secondary' }} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {post.totalFavorites || 0}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </CardContent>
  );

  return (
    <Card
      sx={[
        {
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: (theme) => theme.customShadows.z20,
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {renderCover()}
      {renderContent()}
    </Card>
  );
}
