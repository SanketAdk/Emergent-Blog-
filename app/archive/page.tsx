import type { Metadata } from 'next';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import SiteFooter from '@/components/SiteFooter';
import { getCategories, getPublishedPosts } from '@/lib/queries';
import { formatDate } from '@/lib/format';
import type { PostSummary } from '@/types/content';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Archive',
  description: 'Every essay on Emergent Thoughts, by year.',
  alternates: { canonical: '/archive' },
};

export default async function ArchivePage() {
  const [posts, categories] = await Promise.all([getPublishedPosts(), getCategories()]);

  const byYear = new Map<string, PostSummary[]>();
  for (const post of posts) {
    const year = new Date(post.publishedAt).getUTCFullYear().toString();
    byYear.set(year, [...(byYear.get(year) ?? []), post]);
  }

  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <Navigation />
      <section className="max-w-2xl mx-auto px-8 py-16">
        <h1 className="text-4xl font-light mb-4">Archive</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {posts.length} {posts.length === 1 ? 'essay' : 'essays'}
        </p>

        {categories.length > 0 && (
          <nav aria-label="Categories" className="flex flex-wrap gap-2 mb-12">
            {categories.map((c) => (
              <Link
                key={c.name}
                href={`/category/${encodeURIComponent(c.name.toLowerCase())}`}
                className="text-sm rounded-full border border-gray-300 dark:border-gray-700 px-3 py-1"
              >
                {c.name} <span className="text-gray-500">({c.count})</span>
              </Link>
            ))}
          </nav>
        )}

        {[...byYear.entries()].map(([year, yearPosts]) => (
          <div key={year} className="mb-12">
            <h2 className="text-2xl font-light mb-6 pb-4 border-b border-gray-200 dark:border-gray-800">{year}</h2>
            <ul className="space-y-4">
              {yearPosts.map((post) => (
                <li key={post.id}>
                  <Link href={`/posts/${post.slug}`} className="group">
                    <div className="flex justify-between items-baseline gap-4">
                      <h3 className="text-lg group-hover:opacity-70">{post.title}</h3>
                      <time dateTime={post.publishedAt} className="text-sm text-gray-600 dark:text-gray-400 shrink-0">
                        {formatDate(post.publishedAt)}
                      </time>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
      <SiteFooter />
    </main>
  );
}
