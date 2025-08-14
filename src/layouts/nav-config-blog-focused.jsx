import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

/**
 * Navigation data focused on main features
 * Includes Background Generator and Blog
 */
export const blogFocusedNavData = [
  {
    title: 'Trang chủ',
    path: '/',
    icon: <Iconify width={22} icon="solar:home-angle-bold-duotone" />,
  },
  {
    title: 'Create Background',
    path: paths.backgroundGenerator.root,
    icon: <Iconify width={22} icon="solar:palette-bold-duotone" />,
  },
  {
    title: 'Blog',
    path: paths.post.root,
    icon: <Iconify width={22} icon="solar:notebook-bold-duotone" />,
    children: [
      {
        subheader: 'Bài viết',
        items: [
          { title: 'Tất cả bài viết', path: paths.post.root },
          { title: 'Tips & Tricks', path: `${paths.post.root}?category=tips` },
          { title: 'Hướng dẫn sử dụng', path: `${paths.post.root}?category=guide` },
          { title: 'Cập nhật phần mềm', path: `${paths.post.root}?category=updates` },
        ],
      },
    ],
  },
  {
    title: 'Liên hệ',
    path: paths.contact,
    icon: <Iconify width={22} icon="solar:phone-bold-duotone" />,
  },
];

/**
 * Minimal navigation for mobile/simple layouts
 */
export const blogMinimalNavData = [
  { title: 'Trang chủ', path: '/' },
  { title: 'Blog', path: paths.post.root },
  { title: 'Liên hệ', path: paths.contact },
];

/**
 * Footer navigation data
 */
export const blogFooterNavData = [
  {
    title: 'Blog',
    items: [
      { title: 'Tất cả bài viết', path: paths.post.root },
      { title: 'Tips & Tricks', path: `${paths.post.root}?category=tips` },
      { title: 'Hướng dẫn sử dụng', path: `${paths.post.root}?category=guide` },
      { title: 'Cập nhật phần mềm', path: `${paths.post.root}?category=updates` },
    ],
  },
  {
    title: 'Hỗ trợ',
    items: [
      { title: 'Liên hệ', path: paths.contact },
      { title: 'FAQ', path: paths.faqs },
    ],
  },
];
