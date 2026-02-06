import { blog } from '@/lib/source';
import { notFound } from 'next/navigation';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { InlineTOC } from 'fumadocs-ui/components/inline-toc';
import Link from 'next/link';
import AnimatedSVG from '@/components/AnimatedSVG';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = blog.getPage([slug]);

  if (!post) notFound();

  const { body: Mdx, toc } = await post.data.load();

  return (
    <main className="mx-auto w-full max-w-[800px] px-4 py-12 md:py-16">
      <article>
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-sm text-fd-muted-foreground hover:text-fd-foreground mb-8"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Back to Blog
        </Link>

        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-4 text-sm text-fd-muted-foreground mb-4">
            <span>{post.data.author}</span>
            <span>·</span>
            <time>
              {new Date(post.data.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold mb-4">{post.data.title}</h1>
          {post.data.description && (
            <p className="text-lg text-fd-muted-foreground">{post.data.description}</p>
          )}
        </header>

        {toc.length > 0 && (
          <div className="mb-8">
            <InlineTOC items={toc} />
          </div>
        )}

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <Mdx components={{ ...defaultMdxComponents, AnimatedSVG }} />
        </div>
      </article>
    </main>
  );
}

export function generateStaticParams() {
  return blog.getPages().map((page) => ({
    slug: page.slugs[0],
  }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = blog.getPage([slug]);

  if (!post) return {};

  return {
    title: post.data.title,
    description: post.data.description,
  };
}
