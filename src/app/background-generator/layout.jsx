import { AuthGuard } from 'src/auth/guard';

import { DashboardLayout } from 'src/layouts/dashboard';

// ----------------------------------------------------------------------

export const metadata = {
  title: 'Background Generator | AI Background Generator cho sản phẩm',
  description: 'Tạo background chuyên nghiệp cho hình ảnh sản phẩm bằng AI',
};

// ----------------------------------------------------------------------

export default function BackgroundGeneratorLayout({ children }) {
  return (
    <AuthGuard>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
}
