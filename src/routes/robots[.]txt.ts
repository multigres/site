import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET() {
        const robots = `User-agent: *
Allow: /

Sitemap: https://multigres.com/sitemap.xml
`;
        return new Response(robots, {
          headers: {
            'Content-Type': 'text/plain',
          },
        });
      },
    },
  },
});
