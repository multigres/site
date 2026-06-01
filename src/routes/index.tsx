import { createFileRoute } from '@tanstack/react-router';
import LandingPage from '@/components/landing-page';

export const Route = createFileRoute('/')({
  component: LandingPage,
  head: () => ({
    meta: [
      {
        title: 'Multigres - Horizontally Scalable Postgres',
      },
      {
        name: 'description',
        content:
          'A horizontally scalable Postgres architecture supporting multi-tenant, highly available, and globally distributed deployments.',
      },
      {
        property: 'og:title',
        content: 'Multigres - Horizontally Scalable Postgres',
      },
      {
        property: 'og:description',
        content:
          'A horizontally scalable Postgres architecture supporting multi-tenant, highly available, and globally distributed deployments.',
      },
      {
        property: 'og:image',
        content: '/img/og-image.png',
      },
      {
        name: 'twitter:image',
        content: '/img/og-image.png',
      },
    ],
    links: [
      {
        rel: 'canonical',
        href: 'https://multigres.com/',
      },
    ],
  }),
});
