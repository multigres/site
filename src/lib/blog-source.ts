export type BlogPage = import('./blog-source.server').BlogPage;

export function formatBlogDate(date: Date | string | undefined) {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}
