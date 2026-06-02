import { Link } from '@tanstack/react-router';
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  formatSeriesPostTitle,
  getBlogSeries,
  isBlogSeriesSlug,
} from '@/lib/blog-series';
import { cn } from '@/lib/utils';

type BlogSeriesAlertProps = {
  series?: string;
  seriesPart?: number;
  className?: string;
};

export function BlogSeriesAlert({
  series,
  seriesPart,
  className,
}: BlogSeriesAlertProps) {
  if (!series || !isBlogSeriesSlug(series)) return null;

  const seriesMeta = getBlogSeries(series);
  if (!seriesMeta) return null;

  return (
    <Alert
      className={cn(
        'mt-6 flex items-center gap-4 gap-y-3 px-4 py-3',
        'has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-4',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <AlertTitle>{formatSeriesPostTitle(series, seriesPart)}</AlertTitle>
        <AlertDescription>{seriesMeta.description}</AlertDescription>
      </div>
      <AlertAction className="relative top-auto right-auto shrink-0">
        <Button size="xs" variant="default" asChild>
          <Link to="/blog/series/$seriesSlug" params={{ seriesSlug: series }}>
            View series
          </Link>
        </Button>
      </AlertAction>
    </Alert>
  );
}
