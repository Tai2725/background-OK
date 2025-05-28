import { BackgroundGeneratorDashboardView } from 'src/sections/background-generator/view/background-generator-dashboard-view';

// ----------------------------------------------------------------------

export const metadata = {
  title: 'Dashboard | Background Generator',
  description: 'Tổng quan và thống kê Background Generator',
};

// ----------------------------------------------------------------------

export default function BackgroundGeneratorDashboardPage() {
  return <BackgroundGeneratorDashboardView />;
}
