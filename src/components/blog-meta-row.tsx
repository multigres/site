import { Fragment, type ReactNode } from 'react';
import { BlogAuthors } from '@/components/blog-author';
import type { Author } from '@/lib/authors';
import { parseAuthorKeys, resolveAuthors } from '@/lib/authors';
import { formatBlogDate } from '@/lib/blog-source';
import { blogDateClassName } from '@/lib/typography';
import { cn } from '@/lib/utils';

export type BlogMetaFields = {
  author?: string;
  authors?: string[];
  series?: string;
  seriesPart?: number;
  date?: string | Date;
};

export function resolveBlogMetaAuthors(
  fields: Pick<BlogMetaFields, 'author' | 'authors'>,
): Author[] {
  return resolveAuthors(parseAuthorKeys(fields.authors ?? fields.author));
}

function MetaRowSeparator() {
  return (
    <span aria-hidden className="font-mono text-xs text-tertiary-foreground/50">
      /
    </span>
  );
}

type BlogMetaRowProps = Pick<BlogMetaFields, 'author' | 'authors' | 'date'> & {
  /** Pre-resolved authors; if omitted, resolved from `author` / `authors`. */
  authors?: Author[];
  dateElement?: ReactNode;
  className?: string;
};

/** Authors and date separated by `/`. */
export function BlogMetaRow({
  authors: authorsProp,
  author,
  authors,
  date,
  dateElement,
  className,
}: BlogMetaRowProps) {
  const resolvedAuthors =
    authorsProp ?? resolveBlogMetaAuthors({ author, authors });
  const dateNode =
    dateElement ??
    (date ? (
      <time
        dateTime={new Date(date).toISOString().slice(0, 10)}
        className={blogDateClassName}
      >
        {formatBlogDate(date)}
      </time>
    ) : null);

  const items: ReactNode[] = [];
  if (resolvedAuthors.length > 0) {
    items.push(<BlogAuthors key="authors" authors={resolvedAuthors} />);
  }
  if (dateNode) {
    items.push(<Fragment key="date">{dateNode}</Fragment>);
  }

  if (items.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-x-2 gap-y-2', className)}>
      {items.map((item, index) => (
        <Fragment key={index}>
          {index > 0 ? <MetaRowSeparator /> : null}
          {item}
        </Fragment>
      ))}
    </div>
  );
}
