export const blogSeries = {
  'generalized-consensus': {
    title: 'Generalized Consensus',
    description:
      'A conceptual framework for consensus—durability rules, leadership changes, consistent reads, and production operations beyond monolithic Raft.',
  },
  'connection-pooling': {
    title: 'Connection Pooling',
    description:
      'Why Multigres built its own pooler: split gateways and poolers, per-user pools, automatic pooling modes, and prepared-statement deduplication.',
  },
} as const;

export type BlogSeriesSlug = keyof typeof blogSeries;

export function getBlogSeries(slug: string) {
  return blogSeries[slug as BlogSeriesSlug] ?? null;
}

export function isBlogSeriesSlug(slug: string): slug is BlogSeriesSlug {
  return slug in blogSeries;
}

export function formatSeriesPartLabel(seriesPart: number | undefined) {
  if (seriesPart === undefined) return null;
  if (seriesPart === 0) return 'Introduction';
  return `Part ${seriesPart}`;
}

export function formatSeriesMetaLabel(
  seriesSlug: BlogSeriesSlug,
  seriesPart: number | undefined,
) {
  const series = blogSeries[seriesSlug];
  const partLabel = formatSeriesPartLabel(seriesPart);
  return partLabel ? `${series.title} · ${partLabel}` : series.title;
}

/** Title for a post in a series, e.g. "Part 2 of Connection Pooling". */
export function formatSeriesPostTitle(
  seriesSlug: BlogSeriesSlug,
  seriesPart: number | undefined,
) {
  const { title } = blogSeries[seriesSlug];
  if (seriesPart === undefined) return title;
  if (seriesPart === 0) return `Introduction to ${title}`;
  return `Part ${seriesPart} of ${title}`;
}
