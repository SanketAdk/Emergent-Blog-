import type { Metadata } from 'next';
import Link from 'next/link';
import LoginForm from '@/components/studio/LoginForm';

export const metadata: Metadata = {
  title: 'Studio login',
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return (
    <main className="min-h-screen grid place-items-center bg-muted/40 px-4 font-sans">
      <div className="w-full max-w-sm rounded-xl border border-border bg-background p-8 shadow-sm">
        <h1 className="text-2xl font-semibold mb-1">Emergent Thoughts</h1>
        <p className="text-sm text-muted-foreground mb-6">Sign in to the Studio to write and publish.</p>
        <LoginForm
          next={next}
          initialError={error === 'forbidden' ? 'This account does not have Studio access.' : undefined}
        />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/">← Back to the site</Link>
        </p>
      </div>
    </main>
  );
}
