import type { Author } from '@/lib/authors';
import { cn } from '@/lib/utils';

type BlogAuthorProps = {
  author: Author;
  className?: string;
};

export function BlogAuthor({ author, className }: BlogAuthorProps) {
  return (
    <a
      href={author.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-2 transition-colors hover:text-primary',
        className,
      )}
    >
      <img
        src={author.imageUrl}
        alt=""
        width={24}
        height={24}
        className="size-6 shrink-0 rounded-full border border-border bg-muted object-cover"
      />
      <span className="font-mono text-xs text-tertiary-foreground">{author.name}</span>
    </a>
  );
}

type BlogAuthorsProps = {
  authors: Author[];
  className?: string;
};

export function BlogAuthors({ authors: authorList, className }: BlogAuthorsProps) {
  if (authorList.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-2', className)}>
      {authorList.map((author) => (
        <BlogAuthor key={author.url} author={author} />
      ))}
    </div>
  );
}
