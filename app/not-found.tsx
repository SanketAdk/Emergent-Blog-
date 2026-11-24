import Link from 'next/link';
import Navigation from '@/components/Navigation';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <Navigation />
      <section className="max-w-2xl mx-auto px-8 py-24 text-center">
        <p className="text-sm uppercase tracking-widest text-gray-500 mb-4">404</p>
        <h1 className="text-4xl font-light mb-6">This page doesn&apos;t exist</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">It may have been moved, unpublished, or never existed.</p>
        <Link href="/" className="underline underline-offset-4">
          Back to the essays
        </Link>
      </section>
    </main>
  );
}
