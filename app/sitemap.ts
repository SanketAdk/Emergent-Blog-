import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';
import { getCategories, getPublishedPosts } from '@/lib/queries';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  const [posts, categories] = await Promise.all([getPublishedPosts(), getCategories()]);
  return [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/archive`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/documents`, changeFrequency: 'monthly', priority: 0.5 },
    ...posts.map((p) => ({ url: `${base}/posts/${p.slug}`, lastModified: p.publishedAt, priority: 0.8 })),
    ...categories.map((c) => ({ url: `${base}/category/${encodeURIComponent(c.name.toLowerCase())}`, priority: 0.4 })),
  ];
}
