import { SiteNav, siteNavPageClassName } from '@/components/site-nav';
import { DefaultNotFound } from 'fumadocs-ui/layouts/home/not-found';

export function NotFound() {
  return (
    <>
      <SiteNav />
      <div className={siteNavPageClassName('flex flex-col')}>
        <DefaultNotFound />
      </div>
    </>
  );
}
