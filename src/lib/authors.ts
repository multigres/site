export type Author = {
  name: string;
  title: string;
  url: string;
  imageUrl: string;
};

/** Migrated from multigres-site/blog/authors.yml (Docusaurus). */
export const authors = {
  sougou: {
    name: 'Sugu Sougoumarane',
    title: 'Creator of Multigres, Vitess',
    url: 'https://github.com/sougou',
    imageUrl: 'https://github.com/sougou.png',
  },
  manan: {
    name: 'Manan Gupta',
    title: 'Founding Engineer, Multigres',
    url: 'https://github.com/GuptaManan100',
    imageUrl: 'https://github.com/GuptaManan100.png',
  },
  mats: {
    name: 'Mats Kindahl',
    title: 'Engineer, Multigres',
    url: 'https://github.com/mkindahl',
    imageUrl: 'https://github.com/mkindahl.png',
  },
  rafael: {
    name: 'Rafael Chacon',
    title: 'Founding Engineer, Multigres',
    url: 'https://github.com/rafael',
    imageUrl: 'https://github.com/rafael.png',
  },
  cuongdo: {
    name: 'Cuong Do',
    title: 'Founding Engineer, Multigres',
    url: 'https://github.com/cuongdo',
    imageUrl: 'https://github.com/cuongdo.png',
  },
  joe: {
    name: 'Joe Sciarrino',
    title: 'Product Manager - Multigres, Supabase',
    url: 'https://github.com/jhydra12',
    imageUrl: 'https://github.com/jhydra12.png',
  },
} as const satisfies Record<string, Author>;

export type AuthorKey = keyof typeof authors;

export function parseAuthorKeys(author: string | string[] | undefined): string[] {
  if (!author) return [];
  const keys = Array.isArray(author) ? author : author.split(',');
  return keys.map((key) => key.trim()).filter(Boolean);
}

export function resolveAuthors(keys: string[]): Author[] {
  return keys.flatMap((key) => {
    const author = authors[key as AuthorKey];
    return author ? [author] : [];
  });
}
