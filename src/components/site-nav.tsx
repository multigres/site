'use client';

import { GithubIcon } from '@/components/github-icon';
import { MultigresLogo } from '@/components/multigres-logo';
import { cn } from '@/lib/utils';
import { appName } from '@/lib/shared';
import { siteNavLinks } from '@/lib/site-nav';
import {
  FullSearchTrigger,
  SearchTrigger,
} from 'fumadocs-ui/layouts/shared/slots/search-trigger';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

type SiteNavProps = {
  trailing?: ReactNode;
  className?: string;
};

export function SiteNav({ trailing, className }: SiteNavProps) {
  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 h-(--site-header-height) border-b border-border bg-background/10 backdrop-blur-sm',
        className,
      )}
    >
      <nav className="mx-auto grid h-full max-w-(--fd-layout-width,97rem) grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 md:grid-cols-[1fr_minmax(8rem,18rem)_1fr]">
        <Link
          to="/"
          className="inline-flex items-center gap-2 justify-self-start font-heading text-lg font-bold text-foreground"
        >
          <MultigresLogo className="size-8" />
          <span>{appName}</span>
        </Link>

        <div className="flex w-full min-w-0 justify-center justify-self-stretch px-2">
          <FullSearchTrigger
            hideIfDisabled
            className="hidden w-full rounded-full border-border bg-muted/50 ps-3 md:flex"
          />
          <SearchTrigger
            hideIfDisabled
            className="md:hidden"
            color="ghost"
            size="icon-sm"
          />
        </div>

        <div className="flex items-center justify-end gap-6 justify-self-end">
          {siteNavLinks.map((item) =>
            item.external ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground"
              >
                {item.label === 'GitHub' ? (
                  <GithubIcon className="size-4" />
                ) : null}
                {item.label}
              </a>
            ) : item.href.startsWith('/') ? (
              <Link
                key={item.href}
                to={item.href}
                className="text-sm font-semibold text-foreground"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-foreground"
              >
                {item.label}
              </a>
            ),
          )}
          {trailing}
        </div>
      </nav>
    </header>
  );
}

/** Offset page content below the fixed site header. Omit on home. */
export function siteNavPageClassName(className?: string) {
  return cn('min-h-dvh pt-(--site-header-height)', className);
}
