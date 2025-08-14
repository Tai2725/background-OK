import { _mock } from './_mock';

// ----------------------------------------------------------------------

export const POST_PUBLISH_OPTIONS = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
];

export const POST_SORT_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'popular', label: 'Popular' },
  { value: 'oldest', label: 'Oldest' },
];

// Mock blog posts data
export const PHOTOGRAPHY_BLOG_POSTS = Array.from({ length: 12 }, (_, index) => ({
  id: _mock.id(index),
  title: _mock.postTitle(index),
  description: _mock.sentence(index),
  content: _mock.description(index),
  coverUrl: _mock.image.cover(index),
  author: {
    name: _mock.fullName(index),
    avatarUrl: _mock.image.avatar(index),
  },
  category: ['tips', 'guide', 'updates', 'news'][index % 4],
  tags: ['React', 'JavaScript', 'Tutorial', 'Tips'].slice(0, (index % 3) + 1),
  totalViews: _mock.number.nativeL(index),
  totalFavorites: _mock.number.nativeS(index),
  readingTime: Math.floor(Math.random() * 10) + 3,
  createdAt: _mock.time(index),
  updatedAt: _mock.time(index),
}));
