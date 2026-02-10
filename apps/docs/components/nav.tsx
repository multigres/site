'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

export function Nav() {
  const pathname = usePathname();

  const links = [
    { text: 'Documentation', url: '/docs' },
    { text: 'Blog', url: '/blog' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-fd-background/80 backdrop-blur-sm">
      <nav className="container flex h-14 items-center justify-between">
        <Link href="/" className="font-semibold">
          Multigres
        </Link>
        <div className="flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.url}
              href={link.url}
              className={cn(
                'text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground',
                pathname.startsWith(link.url) && 'text-fd-foreground'
              )}
            >
              {link.text}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
