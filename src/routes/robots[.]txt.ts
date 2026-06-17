import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET() {
        const robots = `User-agent: *
Allow: /

User-agent: GPTBot
User-agent: ClaudeBot
User-agent: Google-Extended
User-agent: PerplexityBot
Allow: /

Sitemap: https://multigres.com/sitemap.xml

Content-Signal: ai-train=yes, search=yes, ai-input=yes
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
