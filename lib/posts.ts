import posts from '@/data/posts.json';
import type { Post } from '@/types/content';

export type { Post };

const allPosts: readonly Post[] = posts;

/** Returns posts newest-first. Copies the array so the imported JSON is never mutated. */
export function getAllPosts(): Post[] {
  return [...allPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): Post | undefined {
  return allPosts.find((post) => post.slug === slug);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
