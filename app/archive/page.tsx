import Navigation from '@/components/Navigation';
import { getAllPosts, formatDate } from '@/lib/posts';
import Link from 'next/link';

export const metadata = {
  title: 'Archive - Emergent Thoughts',
  description: 'All essays',
};

export default function ArchivePage() {
  const allPosts = getAllPosts();
  
  const postsByYear: { [key: string]: typeof allPosts } = {};
  allPosts.forEach(post => {
    const year = new Date(post.date).getFullYear().toString();
    if (!postsByYear[year]) postsByYear[year] = [];
    postsByYear[year].push(post);
  });

  const years = Object.keys(postsByYear).sort((a, b) => parseInt(b) - parseInt(a));

  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <Navigation />
      
      <section className="max-w-2xl mx-auto px-8 py-16">
        <h1 className="text-4xl font-light mb-4">Archive</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-12">
          {allPosts.length} essays
        </p>

        {years.map(year => (
          <div key={year} className="mb-12">
            <h2 className="text-2xl font-light mb-6 pb-4 border-b border-gray-200 dark:border-gray-800">
              {year}
            </h2>
            <ul className="space-y-4">
              {postsByYear[year].map(post => (
                <li key={post.id}>
                  <Link href={`/posts/${post.slug}`} className="group">
                    <div className="flex justify-between items-baseline gap-4">
                      <h3 className="text-lg group-hover:opacity-70">
                        {post.title}
                      </h3>
                      <span className="text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">
                        {formatDate(post.date)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </main>
  );
}
