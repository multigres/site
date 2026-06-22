import { source } from '@/lib/source';
import { getBlogPosts } from '@/lib/blog-source.server';
import { createFileRoute } from '@tanstack/react-router';
import { llms } from 'fumadocs-core/source';

const TAGLINE =
  'Multigres is a horizontally scalable architecture for PostgreSQL supporting multi-tenant, highly available, and globally distributed deployments, while staying true to standard Postgres.';

export const Route = createFileRoute('/llms.txt')({
  server: {
    handlers: {
      GET() {
        const docsIndex = llms(source).index();
        const posts = getBlogPosts();
        const blogSection = [
          '## Blog',
          '',
          ...posts.map((post) => {
            const desc = post.data.description ? `: ${post.data.description}` : '';
            return `- [${post.data.title}](${post.url}.md)${desc}`;
          }),
        ].join('\n');

        const body = `# Multigres\n\n> ${TAGLINE}\n\n${docsIndex}\n\n${blogSection}\n`;

        return new Response(body);
      },
    },
  },
});
