import { defineDocs, defineConfig, defineCollections, frontmatterSchema } from 'fumadocs-mdx/config';
import { z } from 'zod';

export const docs = defineDocs({
  dir: 'content/docs',
});

export const blog = defineCollections({
  type: 'doc',
  dir: 'content/blog',
  schema: frontmatterSchema.extend({
    author: z.string(),
    date: z.iso.date().or(z.date()),
  }),
  async: true,
});

export default defineConfig({
  mdxOptions: {
    // MDX options
  },
});
