import Navigation from '@/components/Navigation';
import Bio from '@/components/Bio';
import { PostMeta } from '@/components/PostCard';
import HomeTabs from '@/components/HomeTabs';
import SiteFooter from '@/components/SiteFooter';
import { getPublishedDocuments, getPublishedPosts } from '@/lib/queries';
import Link from 'next/link';

// Static page, regenerated on demand when the Studio publishes (revalidatePath),
// with an hourly safety net in case content is changed outside the Studio.
export const revalidate = 3600;

export default async function Home() {
  const [posts, documents] = await Promise.all([getPublishedPosts(), getPublishedDocuments()]);
  const featured = posts.find((p) => p.featured);
  const rest = featured ? posts.filter((p) => p.id !== featured.id) : posts;

  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <Navigation />
      <Bio />

      {featured && (
        <section className="max-w-2xl mx-auto px-8 pb-8" aria-labelledby="featured-heading">
          <p id="featured-heading" className="text-xs uppercase tracking-widest text-gray-500 mb-3">
            Featured
          </p>
          <Link href={`/posts/${featured.slug}`} className="group block rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-3xl font-medium mb-2 group-hover:opacity-70 transition-opacity">{featured.title}</h2>
            <PostMeta post={featured} className="mb-3" />
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">{featured.excerpt}</p>
          </Link>
        </section>
      )}

      <HomeTabs posts={rest} documents={documents} hasFeatured={!!featured} />

      <SiteFooter showArchive={false} />
    </main>
  );
}
