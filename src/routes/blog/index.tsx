import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { BlogAuthors } from '@/components/blog-author';
import { BlogLayout } from '@/components/blog-layout';
import { BlogShardPlaceholder } from '@/components/blog-shard-placeholder';
import { parseAuthorKeys, resolveAuthors } from '@/lib/authors';
import { formatBlogDate } from '@/lib/blog-source';
import { getBlogPosts } from '@/lib/blog-source.server';
import { blogDateClassName, pageHeadingClassName } from '@/lib/typography';
import { cn } from '@/lib/utils';

const FEATURED_COUNT = 3;

const loadBlogIndex = createServerFn({ method: 'GET' }).handler(() => {
  const posts = getBlogPosts();
  return {
    featured: posts.slice(0, FEATURED_COUNT).map((post) => ({
      slug: post.slugs[0],
      url: post.url,
      title: post.data.title,
      description: post.data.description,
      image: post.data.image,
      date: post.data.date?.toISOString(),
      author: post.data.author,
      authors: post.data.authors,
    })),
    rest: posts.slice(FEATURED_COUNT).map((post) => ({
      slug: post.slugs[0],
      url: post.url,
      title: post.data.title,
      date: post.data.date?.toISOString(),
    })),
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
      <header className="mb-12 border-b border-border pb-10">
        <h1 className={cn(pageHeadingClassName, 'mb-3 font-medium')}>Blog</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Notes on Multigres, Postgres, consensus, and distributed databases.
        </p>
      </header>

      {featured.length > 0 ? (
        <section className="mb-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((post) => {
            const postAuthors = resolveAuthors(
              parseAuthorKeys(post.authors ?? post.author),
            );

            return (
            <article key={post.url} className="flex h-full flex-col gap-4">
              <Link
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="group flex flex-col gap-8"
              >
                <div className="aspect-[16/10] overflow-hidden rounded-lg border border-border bg-muted">
                  {post.image ? (
                    <img
                      src={post.image}
                      alt=""
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <BlogShardPlaceholder seed={post.slug} />
                  )}
                </div>
                <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground group-hover:text-primary">
                  {post.title}
                </h2>
              </Link>
              {post.description ? (
                <p className="text-sm leading-relaxed text-muted-foreground line-clamp-4">
                  {post.description}
                </p>
              ) : null}
              {postAuthors.length > 0 || post.date ? (
                <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2">
                  <BlogAuthors authors={postAuthors} />
                  {post.date ? (
                    <time dateTime={post.date.slice(0, 10)} className={blogDateClassName}>
                      {formatBlogDate(post.date)}
                    </time>
                  ) : null}
                </div>
              ) : null}
            </article>
            );
          })}
        </section>
      ) : null}

      {rest.length > 0 ? (
        <section>
          <ul className="divide-y divide-border border-t border-border">
            {rest.map((post) => (
              <li key={post.url}>
                <Link
                  to="/blog/$slug"
                  params={{ slug: post.slug }}
                  className="group flex items-baseline justify-between gap-6 py-5"
                >
                  <span className="font-medium text-foreground group-hover:text-primary">
                    {post.title}
                  </span>
                  <time
                    dateTime={post.date ? post.date.slice(0, 10) : undefined}
                    className={cn('shrink-0', blogDateClassName)}
                  >
                    {formatBlogDate(post.date)}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </BlogLayout>
  );
}
