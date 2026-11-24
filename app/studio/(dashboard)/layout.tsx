import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { logout } from '@/actions/auth';
import StudioNav from '@/components/studio/StudioNav';

export const metadata: Metadata = {
  title: { default: 'Studio', template: '%s · Studio' },
  robots: { index: false, follow: false },
};

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const { username } = await requireAdmin();

  return (
    <div className="min-h-screen bg-muted/40 font-sans">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/studio" className="font-semibold">
            Emergent Thoughts <span className="text-muted-foreground font-normal">Studio</span>
          </Link>
          <StudioNav />
          <div className="ml-auto flex items-center gap-4 text-sm">
            <Link href="/" target="_blank" className="text-muted-foreground">
              View site ↗
            </Link>
            <span className="text-muted-foreground hidden sm:inline">@{username}</span>
            <form action={logout}>
              <button type="submit" className="underline underline-offset-2 cursor-pointer">
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
