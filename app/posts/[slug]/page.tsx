import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navigation from '@/components/Navigation';
import SiteFooter from '@/components/SiteFooter';
import { PostMeta } from '@/components/PostCard';
import { Markdown } from '@/lib/markdown';
import { getPostBySlug, getPublishedPosts } from '@/lib/queries';

export const revalidate = 3600;
// Posts published after the last deploy are rendered on first request, then cached.
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/posts/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      url: `/posts/${post.slug}`,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      tags: post.category ? [post.category] : undefined,
    },
    twitter: { card: 'summary', title: post.title, description: post.excerpt },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const [post, all] = await Promise.all([getPostBySlug(slug), getPublishedPosts()]);
  if (!post) notFound();

  const idx = all.findIndex((p) => p.slug === slug);
  const newer = idx > 0 ? all[idx - 1] : null;
  const older = idx > -1 && idx < all.length - 1 ? all[idx + 1] : null;

  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <Navigation />

      <article className="max-w-2xl mx-auto px-8 py-16">
        <Link href="/" className="text-sm text-gray-600 dark:text-gray-400 hover:opacity-70 mb-8 inline-block">
          ← Back to essays
        </Link>

        <h1 className="text-4xl font-light mb-4 mt-8">{post.title}</h1>
        <PostMeta post={post} className="mb-12 pb-8 border-b border-gray-200 dark:border-gray-800" />

        <div className="prose prose-lg prose-neutral dark:prose-invert max-w-none mb-16 prose-headings:font-medium prose-p:leading-relaxed">
          <Markdown>{post.content}</Markdown>
        </div>

        {(newer || older) && (
          <nav aria-label="More essays" className="border-t border-gray-200 dark:border-gray-800 pt-12">
            <div className="grid grid-cols-2 gap-8">
              {newer ? (
                <Link href={`/posts/${newer.slug}`} className="group">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">← Newer</p>
                  <h3 className="text-lg font-medium group-hover:opacity-70">{newer.title}</h3>
                </Link>
              ) : (
                <div />
              )}
              {older ? (
                <Link href={`/posts/${older.slug}`} className="group text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Older →</p>
                  <h3 className="text-lg font-medium group-hover:opacity-70">{older.title}</h3>
                </Link>
              ) : (
                <div />
              )}
            </div>
          </nav>
        )}
      </article>
      <SiteFooter />
    </main>
  );
}
