import { source } from '@/lib/source';
import { blogSource } from '@/lib/blog-source.server';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET() {
        const baseUrl = 'https://multigres.com';
        const docsPages = source.getPages();
        const blogPages = blogSource.getPages();

        const urls = [
          { loc: `${baseUrl}/`, changefreq: 'daily', priority: '1.0' },
          { loc: `${baseUrl}/blog`, changefreq: 'daily', priority: '0.8' },
          ...docsPages.map((page) => ({
            loc: `${baseUrl}${page.url}`,
            changefreq: 'weekly',
            priority: '0.7',
          })),
          ...blogPages.map((page) => ({
            loc: `${baseUrl}${page.url}`,
            changefreq: 'weekly',
            priority: '0.7',
          })),
        ];

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls
    .map(
      (url) => `
  <url>
    <loc>${url.loc}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`,
    )
    .join('')}
</urlset>`;

        return new Response(xml, {
          headers: {
            'Content-Type': 'application/xml',
          },
        });
      },
    },
  },
});
