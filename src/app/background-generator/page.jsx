import { redirect } from 'next/navigation';

import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

export default function BackgroundGeneratorPage() {
  // Redirect to dashboard by default
  redirect(paths.backgroundGenerator.dashboard);
}
