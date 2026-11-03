import { createFileRoute } from '@tanstack/react-router';
import LandingPage from '@/components/landing-page';
import { serializeJsonLd } from '@/lib/json-ld';
import { defaultOgImage, siteUrl } from '@/lib/shared';

const description =
  'A horizontally scalable Postgres architecture supporting multi-tenant, highly available, and globally distributed deployments.';

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://multigres.com/#organization',
    name: 'Multigres',
    url: 'https://multigres.com',
    logo: defaultOgImage,
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
        property: 'og:url',
        content: `${siteUrl}/`,
      },
      {
        property: 'og:image',
        content: defaultOgImage,
      },
      {
        name: 'twitter:image',
        content: defaultOgImage,
      },
      // Meta tags for webmaster verification. Don't remove
      {
        name: 'msvalidate.01',
        content: '92FBA8A0D370D71480454DBEAB37D0AE',
      },
      {
        name: 'google-site-verification',
        content: 'mgM_lC--XvQRYgM94hp4hzM9lqvrlt13MV75b0_Sflw',
      },
      {
        name: 'yandex-verification',
        content: '0630e8b46f441635',
      },
    ],
    links: [
      {
        rel: 'canonical',
        href: 'https://multigres.com/',
      },
      {
        rel: 'alternate',
        type: 'text/markdown',
        href: `${siteUrl}/index.md`,
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
