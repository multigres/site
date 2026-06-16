import react from '@vitejs/plugin-react';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import mdx from 'fumadocs-mdx/vite';
import { nitro } from 'nitro/vite';

export default defineConfig({
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  server: {
    port: 3000,
  },
  plugins: [
    mdx(),
    tailwindcss(),
    tanstackStart({
      prerender: {
        enabled: true,
        filter: ({ path }) =>
          !path.startsWith('/docs') && !path.startsWith('/blog') && path !== '/',
      },
    }),
    react(),
    // please see https://tanstack.com/start/latest/docs/framework/react/guide/hosting#nitro for guides on hosting
    nitro({
      preset: 'vercel',
      routeRules: {
        '/': {
          headers: {
            'cache-control': 'public, s-maxage=86400, stale-while-revalidate=86400',
            vary: 'Accept',
          },
        },
        '/docs/**': {
          headers: {
            'cache-control': 'public, s-maxage=86400, stale-while-revalidate=86400',
            vary: 'Accept',
          },
        },
        '/blog/**': {
          headers: {
            'cache-control': 'public, s-maxage=86400, stale-while-revalidate=86400',
            vary: 'Accept',
          },
        },
      },
    }),
  ],
  resolve: {
    tsconfigPaths: true,
    alias: {
      tslib: 'tslib/tslib.es6.js',
    },
  },
});
