import Navigation from '@/components/Navigation';
import { getAllPosts, getPostBySlug, formatDate } from '@/lib/posts';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  return post ? { title: `${post.title} - Emergent Thoughts` } : {};
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  const allPosts = getAllPosts();
  const idx = allPosts.findIndex(p => p.slug === slug);
  const prev = idx > 0 ? allPosts[idx - 1] : null;
  const next = idx < allPosts.length - 1 ? allPosts[idx + 1] : null;

  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <Navigation />
      
      <article className="max-w-2xl mx-auto px-8 py-16">
        <Link href="/" className="text-sm text-gray-600 dark:text-gray-400 hover:opacity-70 mb-8 inline-block">
          ← Back to essays
        </Link>

        <h1 className="text-4xl font-light mb-4 mt-8">
          {post.title}
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-12 pb-8 border-b border-gray-200 dark:border-gray-800">
          {formatDate(post.date)}
        </p>

        <div className="prose dark:prose-invert max-w-none mb-16">
          {post.content.split('\n\n').map((para, i) => (
            <p key={i} className="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
              {para}
            </p>
          ))}
        </div>

        {(prev || next) && (
          <div className="border-t border-gray-200 dark:border-gray-800 pt-12">
            <div className="grid grid-cols-2 gap-8">
              {prev ? (
                <Link href={`/posts/${prev.slug}`} className="group">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">← Previous</p>
                  <h3 className="text-lg font-medium group-hover:opacity-70">
                    {prev.title}
                  </h3>
                </Link>
              ) : <div />}
              
              {next ? (
                <Link href={`/posts/${next.slug}`} className="group text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Next →</p>
                  <h3 className="text-lg font-medium group-hover:opacity-70">
                    {next.title}
                  </h3>
                </Link>
              ) : <div />}
            </div>
          </div>
        )}
      </article>
    </main>
  );
}
