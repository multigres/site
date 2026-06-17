import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import browserCollections from 'collections/browser';
import { BlogMetaRow } from '@/components/blog-meta-row';
import { BlogSeriesAlert } from '@/components/blog-series-alert';
import { BlogLayout } from '@/components/blog-layout';
import { BlogShardPlaceholder } from '@/components/blog-shard-placeholder';
import { useMDXComponents } from '@/components/mdx';
import { parseAuthorKeys, resolveAuthors } from '@/lib/authors';
import { blogSource } from '@/lib/blog-source.server';
import { docPageHeadingClassName } from '@/lib/typography';
import { useFumadocsLoader } from 'fumadocs-core/source/client';
import { Suspense } from 'react';
import { serializeJsonLd } from '@/lib/json-ld';

const logoUrl = 'https://multigres.com/img/og-image.png';

export const Route = createFileRoute('/blog/$slug')({
  component: BlogPostPage,
  loader: async ({ params }) => {
    const data = await serverLoader({ data: params.slug });
    await clientLoader.preload(data.path);
    return data;
  },
  head: ({ loaderData, params }) => {
    const title = loaderData?.title ? `${loaderData.title} | Blog | Multigres` : 'Blog | Multigres';
    const description = loaderData?.description || 'Notes on Multigres, Postgres, consensus, and distributed databases.';
    const image = loaderData?.image || '/img/og-image.png';
    const canonicalUrl = `https://multigres.com/blog/${params.slug}`;

    const jsonLd: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: loaderData?.title ?? 'Blog | Multigres',
      description,
      url: canonicalUrl,
      publisher: {
        '@type': 'Organization',
        name: 'Multigres',
        logo: { '@type': 'ImageObject', url: logoUrl },
      },
    };

    jsonLd['image'] = image.startsWith('http') ? image : `https://multigres.com${image}`;
    if (loaderData?.datePublished) jsonLd['datePublished'] = loaderData.datePublished;
    if (loaderData?.authorName) {
      jsonLd['author'] = { '@type': 'Person', name: loaderData.authorName };
    }

    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:image', content: image },
        { property: 'og:type', content: 'article' },
        { property: 'og:url', content: canonicalUrl },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: image },
      ],
      links: [{ rel: 'canonical', href: canonicalUrl }],
      scripts: [
        {
          type: 'application/ld+json',
          children: serializeJsonLd(jsonLd),
        },
      ],
    };
  },
});

const serverLoader = createServerFn({ method: 'GET' })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const page = blogSource.getPage([slug]);
    if (!page) throw notFound();

    const authorKeys = parseAuthorKeys(
      (page.data.authors as string | string[] | undefined) ??
        (page.data.author as string | undefined),
    );
    const authors = resolveAuthors(authorKeys);
    const firstAuthor = authors[0];

    return {
      path: page.path,
      title: page.data.title,
      description: page.data.description,
      image: page.data.image,
      datePublished: page.data.date ? page.data.date.toISOString() : undefined,
      authorName: firstAuthor?.name,
    };
  });

const clientLoader = browserCollections.blog.createClientLoader({
  component({ default: MDX, frontmatter }) {
    const postAuthors = resolveAuthors(
      parseAuthorKeys(frontmatter.authors ?? frontmatter.author),
    );

    return (
      <article className="pb-32">
        <div className="relative left-1/2 h-[200px] w-screen -translate-x-1/2 overflow-hidden bg-muted">
          <BlogShardPlaceholder seed={frontmatter.title} />
        </div>
        <header className="mb-8 border-b border-border pb-8 pt-10 md:pt-14">
          <Link
            to="/blog"
            className="mb-6 inline-block text-sm font-medium text-muted-foreground hover:text-primary"
          >
            ← Back to blog
          </Link>
          <h1 className={docPageHeadingClassName}>{frontmatter.title}</h1>
          {postAuthors.length > 0 || frontmatter.date ? (
            <BlogMetaRow
              authors={postAuthors}
              date={frontmatter.date}
              className="mt-4"
            />
          ) : null}
          {frontmatter.description ? (
            <p className="mt-4 text-lg text-muted-foreground">{frontmatter.description}</p>
          ) : null}
          <BlogSeriesAlert
            series={frontmatter.series}
            seriesPart={frontmatter.seriesPart}
          />
        </header>
        <div className="prose prose-invert max-w-none prose-headings:font-heading">
          <MDX components={useMDXComponents()} />
        </div>
      </article>
    );
  },
});

function BlogPostPage() {
  const { path } = useFumadocsLoader(Route.useLoaderData());

  return (
    <BlogLayout className="pt-0" contentClassName="py-0 md:py-0">
      <Suspense>{clientLoader.useContent(path)}</Suspense>
    </BlogLayout>
  );
}
