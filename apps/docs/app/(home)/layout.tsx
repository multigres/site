import type { ReactNode } from 'react';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/app/layout.config';
import { Nav } from '@/components/nav';

export default function Layout({ children }: { children: ReactNode }) {
  const { nav, links, ...base } = baseOptions;

  return (
    <>
      <Nav />
      <HomeLayout {...base} nav={{ enabled: false }}>
        {children}
      </HomeLayout>
    </>
  );
}
