import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { BlogAuthor } from '@/components/blog-author';
import { YouTubeEmbed } from '@/components/youtube-embed';
import type { Author } from '@/lib/authors';

type AuthorMdxProps = {
  name: string;
  title: string;
  imageUrl: string;
  url?: string;
};

function Author({ name, title, imageUrl, url = '#' }: AuthorMdxProps) {
  const author: Author = { name, title, imageUrl, url };
  return <BlogAuthor author={author} className="not-prose my-8" />;
}

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Author,
    YouTubeEmbed,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
