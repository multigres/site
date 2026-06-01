import { SiteNav, siteNavPageClassName } from '@/components/site-nav';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type BlogLayoutProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

/** Centered blog pages without docs sidebar. */
export function BlogLayout({ children, className, contentClassName }: BlogLayoutProps) {
  return (
    <>
      <SiteNav />
      <main className={siteNavPageClassName(cn('flex-1', className))}>
        <div
          className={cn(
            'mx-auto w-full max-w-3xl px-6 py-10 md:py-14',
            contentClassName,
          )}
        >
          {children}
        </div>
      </main>
    </>
  );
}
