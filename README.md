# Multigres Site

This repository contains the Multigres website at https://multigres.com.

The site is built with TanStack Start, Fumadocs, React, Tailwind CSS, and Vite.
Documentation and blog content live in `content/`.

## Development

Install dependencies and run the local development server:

```bash
pnpm install
pnpm dev
```

Check types and build the Vercel output:

```bash
pnpm types:check
pnpm build
```

The build emits a Nitro/Vercel bundle under `.vercel/output` and generates RSS
feeds under `.vercel/output/static/blog`.

## Vercel

- **Install command:** `pnpm install`
- **Build command:** `pnpm build`
- **Output directory:** `.vercel/output` (Nitro `vercel` preset; leave Framework Preset as Other/Vite if not auto-detected)
- **Node.js version:** 20.x (see `.nvmrc`)
- **Environment variables:** `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` (and staging variants for preview deployments if desired)

## Content

- Docs: `content/docs`
- Blog posts: `content/blog`
- Public assets: `public`
- Contributing docs: https://multigres.com/docs/contributing
