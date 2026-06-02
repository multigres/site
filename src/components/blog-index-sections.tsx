import { Link } from '@tanstack/react-router';
import {
  BlogMetaRow,
  resolveBlogMetaAuthors,
  type BlogMetaFields,
} from '@/components/blog-meta-row';
import { BlogShardPlaceholder } from '@/components/blog-shard-placeholder';
import { cn } from '@/lib/utils';

export type BlogFeaturedPost = {
  slug: string;
  url: string;
  title: string;
  description?: string;
  image?: string;
} & BlogMetaFields;

export type BlogListPost = {
  slug: string;
  url: string;
  title: string;
} & BlogMetaFields;

type BlogFeaturedGridProps = {
  posts: BlogFeaturedPost[];
};

export function BlogFeaturedGrid({ posts }: BlogFeaturedGridProps) {
  if (posts.length === 0) return null;

  return (
    <section className="mb-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
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
            <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
              {post.description}
            </p>
          ) : null}
          <BlogMetaRow
            authors={resolveBlogMetaAuthors(post)}
            date={post.date}
            className="mt-auto"
          />
        </article>
      ))}
    </section>
  );
}

type BlogPostListProps = {
  posts: BlogListPost[];
};

export function BlogPostList({ posts }: BlogPostListProps) {
  if (posts.length === 0) return null;

  return (
    <section>
      <ul className="divide-y divide-border border-t border-border">
        {posts.map((post) => (
          <li key={post.url}>
            <Link
              to="/blog/$slug"
              params={{ slug: post.slug }}
              className="group flex flex-col items-center gap-2 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
            >
              <span className="font-medium text-foreground group-hover:text-primary">
                {post.title}
              </span>
              <BlogMetaRow
                authors={resolveBlogMetaAuthors(post)}
                date={post.date}
                className={cn('sm:shrink-0')}
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
