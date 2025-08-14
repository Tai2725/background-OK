import { CONFIG } from 'src/global-config';

import { MainHomeView } from 'src/sections/home/view/main-home-view';

// ----------------------------------------------------------------------

export const metadata = {
  title: `${CONFIG.appName} - Creative Tools Hub`,
  description:
    'Nền tảng công cụ sáng tạo và chia sẻ kiến thức thiết kế. Tạo background đẹp với AI, đọc blog hướng dẫn và tips hữu ích.',
};

export default function Page() {
  return <MainHomeView />;
}
