import { blogRoute, gitConfig } from '@/lib/shared';

export type SiteNavLink = {
  href: string;
  label: string;
  external?: boolean;
};

export const siteNavLinks: SiteNavLink[] = [
  { href: '/docs/', label: 'Docs' },
  { href: blogRoute, label: 'Blog' },
  {
    href: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    label: 'GitHub',
    external: true,
  },
];
