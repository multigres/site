'use client';

import { SiteNav, siteNavPageClassName } from '@/components/site-nav';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Container } from 'fumadocs-ui/layouts/docs/slots/container';
import { useDocsLayout } from 'fumadocs-ui/layouts/docs';
import { SidebarIcon } from 'lucide-react';
import type { ComponentProps } from 'react';

export function SiteDocsContainer(props: ComponentProps<typeof Container>) {
  const { slots } = useDocsLayout();
  const SidebarTrigger = slots.sidebar?.trigger;

  return (
    <>
      <SiteNav
        className="max-md:!bg-background/75 max-md:!backdrop-blur-md"
        trailing={
          SidebarTrigger ? (
            <SidebarTrigger
              className={cn(
                buttonVariants({
                  variant: 'ghost',
                  size: 'icon-sm',
                  className: 'p-2 md:hidden',
                }),
              )}
            >
              <SidebarIcon />
            </SidebarTrigger>
          ) : undefined
        }
      />
      <div className={siteNavPageClassName()}>
        <Container
          {...props}
          className={cn('[--fd-header-height:0px]', props.className)}
        />
      </div>
    </>
  );
}
