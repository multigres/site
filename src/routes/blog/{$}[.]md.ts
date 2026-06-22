import { createFileRoute, notFound } from '@tanstack/react-router';
import { markdownPathToSlugs } from '@/lib/source';
import { blogSource, getBlogLLMText } from '@/lib/blog-source.server';

export const Route = createFileRoute('/blog/{$}.md')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const slugs = markdownPathToSlugs(params._splat?.split('/') ?? []);
        const page = blogSource.getPage(slugs);
        if (!page) throw notFound();

        return new Response(await getBlogLLMText(page), {
          headers: {
            'Content-Type': 'text/markdown',
          },
        });
      },
    },
  },
});
