import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import PostCard from '@/components/PostCard';
import SiteFooter from '@/components/SiteFooter';
import { getCategories, getPostsByCategory } from '@/lib/queries';

export const revalidate = 3600;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ name: string }>;
}

export async function generateStaticParams() {
  return (await getCategories()).map((c) => ({ name: c.name.toLowerCase() }));
}

async function resolve(params: PageProps['params']) {
  const name = decodeURIComponent((await params).name);
  const posts = await getPostsByCategory(name);
  return { label: posts[0]?.category ?? name, posts };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { label, posts } = await resolve(params);
  if (!posts.length) return {};
  return { title: `${label} essays`, alternates: { canonical: `/category/${encodeURIComponent(label.toLowerCase())}` } };
}

export default async function CategoryPage({ params }: PageProps) {
  const { label, posts } = await resolve(params);
  if (!posts.length) notFound();
  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <Navigation />
      <section className="max-w-2xl mx-auto px-8 py-16">
        <Link href="/archive" className="text-sm text-gray-600 dark:text-gray-400">
          ← All essays
        </Link>
        <h1 className="text-4xl font-light mt-8 mb-8 pb-8 border-b border-gray-200 dark:border-gray-800">{label}</h1>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </section>
      <SiteFooter />
    </main>
  );
}
