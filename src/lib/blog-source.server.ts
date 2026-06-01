import { loader } from 'fumadocs-core/source';
import { blog } from 'collections/server';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { toFumadocsSource } from 'fumadocs-mdx/runtime/server';
import { blogRoute } from './shared';

export const blogSource = loader({
  source: toFumadocsSource(blog, []),
  baseUrl: blogRoute,
  plugins: [lucideIconsPlugin()],
});

export type BlogPage = (typeof blogSource)['$inferPage'];

export function getBlogPosts() {
  return blogSource.getPages().sort((a, b) => {
    const aDate = a.data.date ? new Date(a.data.date).getTime() : 0;
    const bDate = b.data.date ? new Date(b.data.date).getTime() : 0;
    return bDate - aDate;
  });
}
