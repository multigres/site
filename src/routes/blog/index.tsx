import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import {
  BlogFeaturedGrid,
  BlogPostList,
} from '@/components/blog-index-sections';
import { BlogLayout } from '@/components/blog-layout';
import {
  getBlogPostListSummaries,
  getBlogPostSummaries,
  getBlogPosts,
} from '@/lib/blog-source.server';
import { serializeJsonLd } from '@/lib/json-ld';
import { defaultOgImage, siteUrl } from '@/lib/shared';

const FEATURED_COUNT = 3;
const title = 'Blog | Multigres';
const description = 'Notes on Multigres, Postgres, consensus, and distributed databases.';
const blogUrl = `${siteUrl}/blog`;

const loadBlogIndex = createServerFn({ method: 'GET' }).handler(() => {
  const posts = getBlogPosts();
  const summaries = getBlogPostSummaries(posts);

  return {
    featured: summaries.slice(0, FEATURED_COUNT),
    rest: getBlogPostListSummaries(posts.slice(FEATURED_COUNT)),
  };
});

export const Route = createFileRoute('/blog/')({
  component: BlogIndexPage,
  loader: () => loadBlogIndex(),
  head: () => ({
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: blogUrl },
      { property: 'og:image', content: defaultOgImage },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: defaultOgImage },
    ],
    links: [{ rel: 'canonical', href: blogUrl }],
    scripts: [
      {
        type: 'application/ld+json',
        children: serializeJsonLd({
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'Multigres Blog',
          description,
          url: blogUrl,
          publisher: { '@type': 'Organization', name: 'Multigres' },
        }),
      },
    ],
  }),
});

function BlogIndexPage() {
  const { featured, rest } = Route.useLoaderData();

  return (
    <BlogLayout contentClassName="max-w-6xl">
      <h1 className="sr-only">Multigres Blog</h1>
      <BlogFeaturedGrid posts={featured} />
      <BlogPostList posts={rest} />
    </BlogLayout>
  );
}
