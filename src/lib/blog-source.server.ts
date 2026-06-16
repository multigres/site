import { loader } from 'fumadocs-core/source';
import { blog } from 'collections/server';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { toFumadocsSource } from 'fumadocs-mdx/runtime/server';
import { isBlogSeriesSlug } from './blog-series';
import { blogRoute } from './shared';

export const blogSource = loader({
  source: toFumadocsSource(blog, []),
  baseUrl: blogRoute,
  plugins: [lucideIconsPlugin()],
});

export type BlogPage = (typeof blogSource)['$inferPage'];

function compareByDateDesc(a: BlogPage, b: BlogPage) {
  const aDate = a.data.date ? new Date(a.data.date).getTime() : 0;
  const bDate = b.data.date ? new Date(b.data.date).getTime() : 0;
  return bDate - aDate;
}

function compareBySeriesOrder(a: BlogPage, b: BlogPage) {
  const aPart = a.data.seriesPart ?? Number.MAX_SAFE_INTEGER;
  const bPart = b.data.seriesPart ?? Number.MAX_SAFE_INTEGER;
  if (aPart !== bPart) return aPart - bPart;
  return compareByDateDesc(a, b);
}

export function getBlogPosts() {
  return blogSource.getPages().sort(compareByDateDesc);
}

export function getBlogPostsInSeries(seriesSlug: string) {
  return blogSource
    .getPages()
    .filter((page) => page.data.series === seriesSlug)
    .sort(compareBySeriesOrder);
}

export function getBlogPostSummaries(posts: BlogPage[]) {
  return posts.map((post) => ({
    slug: post.slugs[0],
    url: post.url,
    title: post.data.title,
    description: post.data.description,
    image: post.data.image,
    date: post.data.date?.toISOString(),
    author: post.data.author,
    authors: post.data.authors,
    series: post.data.series,
    seriesPart: post.data.seriesPart,
  }));
}

export function getBlogPostListSummaries(posts: BlogPage[]) {
  return posts.map((post) => ({
    slug: post.slugs[0],
    url: post.url,
    title: post.data.title,
    date: post.data.date?.toISOString(),
    author: post.data.author,
    authors: post.data.authors,
    series: post.data.series,
    seriesPart: post.data.seriesPart,
  }));
}

export async function getBlogLLMText(page: BlogPage) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title} (${page.url})

${processed}`;
}
