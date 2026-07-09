import Navigation from '@/components/Navigation';
import Bio from '@/components/Bio';
import PostCard from '@/components/PostCard';
import { getAllPosts } from '@/lib/posts';
import Link from 'next/link';

export default function Home() {
  const allPosts = getAllPosts();

  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <Navigation />
      <Bio />
      
      <section className="max-w-2xl mx-auto px-8 py-16">
        <h2 className="text-3xl font-light mb-12 pb-8 border-b border-gray-200 dark:border-gray-800">
          Essays
        </h2>
        
        <div>
          {allPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        {allPosts.length === 0 && (
          <p className="text-gray-600 dark:text-gray-400 text-center py-12">
            No essays yet. Check back soon.
          </p>
        )}
      </section>

      <footer className="max-w-2xl mx-auto px-8 py-16 text-center text-sm text-gray-600 dark:text-gray-400">
        <Link href="/archive" className="hover:opacity-70">
          View all essays →
        </Link>
      </footer>
    </main>
  );
}
