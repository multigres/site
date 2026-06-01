import { Link } from '@tanstack/react-router';
import { GithubIcon } from '@/components/github-icon';
import { appName, blogRoute, docsRoute, gitConfig } from '@/lib/shared';

const footerLinks = [
  { label: 'Docs', href: docsRoute },
  { label: 'Blog', href: blogRoute },
  { label: 'Privacy', href: '/privacy' },
  {
    label: 'GitHub',
    href: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    external: true,
  },
  { label: 'Twitter', href: 'https://twitter.com/multigres', external: true },
  { label: 'RSS Feed', href: '/blog/rss.xml' },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background px-6 py-8 text-sm text-muted-foreground">
      <div className="mx-auto flex w-full max-w-(--fd-layout-width,97rem) flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <p>Copyright © {new Date().getFullYear()} Supabase Inc. Built with {appName}.</p>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-3">
          {footerLinks.map((item) =>
            item.external ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-foreground"
              >
                {item.label === 'GitHub' ? <GithubIcon className="size-4" /> : null}
                {item.label}
              </a>
            ) : item.href.startsWith('/') && !item.href.endsWith('.xml') ? (
              <Link key={item.href} to={item.href} className="hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <a key={item.href} href={item.href} className="hover:text-foreground">
                {item.label}
              </a>
            ),
          )}
        </nav>
      </div>
    </footer>
  );
}
