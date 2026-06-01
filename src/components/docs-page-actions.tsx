'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import { useCopyButton } from '@/hooks/use-copy-button';
import { cn } from '@/lib/utils';
import { ViewOptionsPopover as FumaViewOptionsPopover } from 'fumadocs-ui/layouts/docs/page';
import { Check, Copy } from 'lucide-react';
import { useState, type ComponentProps } from 'react';
import { useTranslations } from 'fumadocs-ui/contexts/i18n';

const markdownCache = new Map<string, Promise<string>>();

export const docsActionButtonClass = cn(
  buttonVariants({ variant: 'default', size: 'sm' }),
  'gap-2 [&_svg]:size-3.5 [&_svg]:text-muted-foreground data-[state=open]:bg-foreground/15',
);

export function MarkdownCopyButton({
  markdownUrl,
  className,
  children,
  ...props
}: ComponentProps<'button'> & { markdownUrl: string }) {
  const t = useTranslations();
  const [isLoading, setLoading] = useState(false);
  const [checked, onClick] = useCopyButton(async () => {
    const cached = markdownCache.get(markdownUrl);
    if (cached) return navigator.clipboard.writeText(await cached);

    setLoading(true);
    try {
      const promise = fetch(markdownUrl).then((res) => res.text());
      markdownCache.set(markdownUrl, promise);
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/plain': promise }),
      ]);
    } finally {
      setLoading(false);
    }
  });

  return (
    <Button
      type="button"
      disabled={isLoading}
      onClick={onClick}
      className={cn(docsActionButtonClass, className)}
      {...props}
    >
      {checked ? <Check /> : <Copy />}
      {children ?? t.pageActionsCopyMarkdown}
    </Button>
  );
}

export function ViewOptionsPopover(
  props: ComponentProps<typeof FumaViewOptionsPopover>,
) {
  return (
    <FumaViewOptionsPopover
      {...props}
      className={cn(
        docsActionButtonClass,
        '!border-0 !bg-foreground/10 !text-foreground hover:!bg-foreground/15 data-[state=open]:!bg-foreground/15 data-[state=open]:!text-foreground',
        props.className,
      )}
    />
  );
}
