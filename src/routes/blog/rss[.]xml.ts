import { createFileRoute } from '@tanstack/react-router';
import { Feed } from 'feed';
import { blogSource } from '@/lib/blog-source.server';
import { parseAuthorKeys, resolveAuthors } from '@/lib/authors';

const SITE_URL = 'https://multigres.com';

export const Route = createFileRoute('/blog/rss.xml')({
  server: {
    handlers: {
      GET() {
        const feed = new Feed({
          title: 'Multigres Blog',
          description: 'Latest posts from the Multigres team',
          id: `${SITE_URL}/blog/rss.xml`,
          link: `${SITE_URL}/blog`,
          language: 'en',
          feedLinks: {
            rss2: `${SITE_URL}/blog/rss.xml`,
          },
        });

        for (const page of blogSource.getPages()) {
          const postAuthors = resolveAuthors(
            parseAuthorKeys(page.data.authors ?? page.data.author),
          );

          feed.addItem({
            title: page.data.title,
            id: `${SITE_URL}${page.url}`,
            link: `${SITE_URL}${page.url}`,
            description: page.data.description,
            date: page.data.date,
            author: postAuthors.map((author) => ({
              name: author.name,
              link: author.url,
            })),
          });
        }

        return new Response(feed.rss2(), {
          headers: {
            'Content-Type': 'application/rss+xml; charset=utf-8',
          },
        });
      },
    },
  },
});
