import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import * as React from 'react';
import appCss from '@/styles/app.css?url';
import { RootProvider } from 'fumadocs-ui/provider/tanstack';
import { usePostHog } from '@/hooks/use-posthog';
import { SiteFooter } from '@/components/site-footer';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Multigres - Horizontally Scalable Postgres',
      },
      {
        name: 'description',
        content:
          'A horizontally scalable Postgres architecture supporting multi-tenant, highly available, and globally distributed deployments.',
      },
      // Open Graph
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
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:url',
        content: 'https://multigres.com',
      },
      {
        property: 'og:image',
        content: '/img/og-image.png',
      },
      {
        property: 'og:site_name',
        content: 'Multigres',
      },
      // Twitter Card
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: 'Multigres - Horizontally Scalable Postgres',
      },
      {
        name: 'twitter:description',
        content:
          'A horizontally scalable Postgres architecture supporting multi-tenant, highly available, and globally distributed deployments.',
      },
      {
        name: 'twitter:image',
        content: '/img/og-image.png',
      },
      {
        name: 'twitter:site',
        content: '@multigres',
      },
      // Robots
      {
        name: 'robots',
        content: 'index, follow',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'icon',
        href: '/favicon.ico',
        sizes: 'any',
      },
      {
        rel: 'icon',
        href: '/favicon-32x32.png',
        type: 'image/png',
        sizes: '32x32',
      },
      {
        rel: 'icon',
        href: '/favicon-16x16.png',
        type: 'image/png',
        sizes: '16x16',
      },
      {
        rel: 'apple-touch-icon',
        href: '/apple-touch-icon.png',
        sizes: '180x180',
      },
      {
        rel: 'manifest',
        href: '/site.webmanifest',
      },
      {
        rel: 'canonical',
        href: 'https://multigres.com',
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="flex flex-col min-h-screen">
        <RootProvider
          search={{ options: { api: '/api/search' } }}
          theme={{ storageKey: 'multigres-ui-theme' }}
        >
          <PostHogTracker />
          <Outlet />
        </RootProvider>
        <SiteFooter />
        <Scripts />
      </body>
    </html>
  );
}

function PostHogTracker() {
  usePostHog();
  return null;
}
