import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import type { ReactNode } from 'react';
import { baseOptions } from '@/app/layout.config';
import { source } from '@/lib/source';
import { Nav } from '@/components/nav';

export default function Layout({ children }: { children: ReactNode }) {
  const { nav, links, ...base } = baseOptions;

  return (
    <>
      <Nav />
      <DocsLayout
        {...base}
        nav={{ enabled: false }}
        tree={source.pageTree}
      >
        {children}
      </DocsLayout>
    </>
  );
}
