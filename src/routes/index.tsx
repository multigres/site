import { createFileRoute } from '@tanstack/react-router';
import LandingPage from '@/components/landing-page';
import { serializeJsonLd } from '@/lib/json-ld';

const description =
  'A horizontally scalable Postgres architecture supporting multi-tenant, highly available, and globally distributed deployments.';

const logoUrl = 'https://multigres.com/img/og-image.png';

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://multigres.com/#organization',
    name: 'Multigres',
    url: 'https://multigres.com',
    logo: logoUrl,
    sameAs: ['https://github.com/multigres/multigres', 'https://twitter.com/multigres'],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://multigres.com/#website',
    name: 'Multigres',
    url: 'https://multigres.com',
    publisher: { '@id': 'https://multigres.com/#organization' },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Multigres',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Cross-platform',
    description,
    url: 'https://multigres.com',
    publisher: { '@id': 'https://multigres.com/#organization' },
    isAccessibleForFree: true,
    license: 'https://www.apache.org/licenses/LICENSE-2.0',
  },
];

export const Route = createFileRoute('/')({
  component: LandingPage,
  head: () => ({
    meta: [
      {
        title: 'Multigres - Horizontally Scalable Postgres',
      },
      {
        name: 'description',
        content: description,
      },
      {
        property: 'og:title',
        content: 'Multigres - Horizontally Scalable Postgres',
      },
      {
        property: 'og:description',
        content: description,
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
    scripts: [
      {
        type: 'application/ld+json',
        children: serializeJsonLd(jsonLd),
      },
    ],
  }),
});
