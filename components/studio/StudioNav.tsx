'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const links = [
  { href: '/studio', label: 'Dashboard', exact: true },
  { href: '/studio/posts', label: 'Essays' },
  { href: '/studio/documents', label: 'Documents' },
];

export default function StudioNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Studio" className="flex gap-1 text-sm">
      {links.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? 'page' : undefined}
            className={cn('rounded-md px-3 py-1.5', active ? 'bg-muted font-medium' : 'text-muted-foreground')}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
