'use client';

import { Container } from '@mui/material';

import { paths } from 'src/routes/paths';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { BackgroundGeneratorForm } from '../components/background-generator-form';

// ----------------------------------------------------------------------

export function BackgroundGeneratorV2View() {
  return (
    <Container maxWidth="xl">
      <CustomBreadcrumbs
        heading="Background Generator V2"
        links={[
          { name: 'Background Generator', href: paths.backgroundGenerator.root },
          { name: 'Generator V2' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <BackgroundGeneratorForm />
    </Container>
  );
}
