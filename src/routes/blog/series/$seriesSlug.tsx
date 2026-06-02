import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import {
  BlogFeaturedGrid,
  BlogPostList,
} from '@/components/blog-index-sections';
import { BlogLayout } from '@/components/blog-layout';
import { getBlogSeries, isBlogSeriesSlug } from '@/lib/blog-series';
import {
  getBlogPostListSummaries,
  getBlogPostSummaries,
  getBlogPostsInSeries,
} from '@/lib/blog-source.server';
import { pageHeadingClassName } from '@/lib/typography';
import { cn } from '@/lib/utils';

const FEATURED_COUNT = 3;

const loadBlogSeriesIndex = createServerFn({ method: 'GET' })
  .inputValidator((seriesSlug: string) => seriesSlug)
  .handler(({ data: seriesSlug }) => {
    if (!isBlogSeriesSlug(seriesSlug)) return null;

    const series = getBlogSeries(seriesSlug);
    const posts = getBlogPostsInSeries(seriesSlug);
    const summaries = getBlogPostSummaries(posts);

    return {
      seriesSlug,
      title: series.title,
      description: series.description,
      featured: summaries.slice(0, FEATURED_COUNT),
      rest: getBlogPostListSummaries(posts.slice(FEATURED_COUNT)),
    };
  });

export const Route = createFileRoute('/blog/series/$seriesSlug')({
  component: BlogSeriesIndexPage,
  loader: async ({ params }) => {
    const data = await loadBlogSeriesIndex({ data: params.seriesSlug });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const title = loaderData?.title
      ? `${loaderData.title} | Blog | Multigres`
      : 'Blog | Multigres';
    const description =
      loaderData?.description ??
      'Notes on Multigres, Postgres, consensus, and distributed databases.';

    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:image', content: '/img/og-image.png' },
        { name: 'twitter:image', content: '/img/og-image.png' },
      ],
      links: loaderData?.seriesSlug
        ? [
            {
              rel: 'canonical',
              href: `https://multigres.com/blog/series/${loaderData.seriesSlug}`,
            },
          ]
        : [],
    };
  },
});

function BlogSeriesIndexPage() {
  const { title, description, featured, rest } = Route.useLoaderData();

  return (
    <BlogLayout contentClassName="max-w-6xl">
      <header className="mb-12 border-b border-border pb-10">
        <Link
          to="/blog"
          className="mb-6 inline-block text-sm font-medium text-muted-foreground hover:text-primary"
        >
          ← Back to blog
        </Link>
        <h1 className={cn(pageHeadingClassName, 'mb-3 font-medium')}>{title}</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">{description}</p>
      </header>

      <BlogFeaturedGrid posts={featured} />
      <BlogPostList posts={rest} />
    </BlogLayout>
  );
}
