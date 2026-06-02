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
const FEATURED_COUNT = 3;

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
      {
        title: 'Blog | Multigres',
      },
      {
        name: 'description',
        content: 'Notes on Multigres, Postgres, consensus, and distributed databases.',
      },
      {
        property: 'og:title',
        content: 'Blog | Multigres',
      },
      {
        property: 'og:description',
        content: 'Notes on Multigres, Postgres, consensus, and distributed databases.',
      },
      {
        property: 'og:image',
        content: '/img/og-image.png',
      },
      {
        name: 'twitter:image',
        content: '/img/og-image.png',
      },
    ],
    links: [
      {
        rel: 'canonical',
        href: 'https://multigres.com/blog',
      },
    ],
  }),
});

function BlogIndexPage() {
  const { featured, rest } = Route.useLoaderData();

  return (
    <BlogLayout contentClassName="max-w-6xl">
      <BlogFeaturedGrid posts={featured} />
      <BlogPostList posts={rest} />
    </BlogLayout>
  );
}
