import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />;

const ICONS = {
  dashboard: icon('ic-dashboard'),
  generator: <Iconify icon="solar:magic-stick-3-bold-duotone" />,
  gallery: <Iconify icon="solar:gallery-bold-duotone" />,
  settings: <Iconify icon="solar:settings-bold-duotone" />,
  analytics: icon('ic-analytics'),
  upload: <Iconify icon="solar:upload-bold-duotone" />,
  history: <Iconify icon="solar:history-bold-duotone" />,
};

// ----------------------------------------------------------------------

/**
 * Navigation data for Background Generator app
 */
export const backgroundGeneratorNavData = [
  /**
   * Main Features
   */
  {
    subheader: 'Tạo Background',
    items: [
      { 
        title: 'Dashboard', 
        path: paths.backgroundGenerator.dashboard, 
        icon: ICONS.dashboard,
        caption: 'Tổng quan và thống kê'
      },
      { 
        title: 'Generator', 
        path: paths.backgroundGenerator.generator, 
        icon: ICONS.generator,
        caption: 'Tạo background cho sản phẩm',
        info: (
          <Label color="primary" variant="inverted">
            NEW
          </Label>
        ),
      },
      { 
        title: 'Gallery', 
        path: paths.backgroundGenerator.gallery, 
        icon: ICONS.gallery,
        caption: 'Thư viện hình ảnh đã xử lý'
      },
    ],
  },
  /**
   * Management
   */
  {
    subheader: 'Quản lý',
    items: [
      { 
        title: 'Settings', 
        path: paths.backgroundGenerator.settings, 
        icon: ICONS.settings,
        caption: 'Cài đặt tài khoản và API'
      },
    ],
  },
];

/**
 * Simplified navigation for dashboard integration
 */
export const backgroundGeneratorDashboardNav = {
  title: 'Background Generator',
  path: paths.backgroundGenerator.root,
  icon: ICONS.generator,
  caption: 'AI Background Generator cho sản phẩm',
  children: [
    { title: 'Dashboard', path: paths.backgroundGenerator.dashboard },
    { title: 'Generator', path: paths.backgroundGenerator.generator },
    { title: 'Gallery', path: paths.backgroundGenerator.gallery },
    { title: 'Settings', path: paths.backgroundGenerator.settings },
  ],
};
