import 'server-only';
import { cache } from 'react';
import { createPublicClient } from '@/lib/supabase/public';
import { readingMinutes } from '@/lib/format';
import type { Document, Post, PostSummary } from '@/types/content';
import type { Database } from '@/types/database.types';

/*
 * Public read layer. Uses the cookie-free publishable-key client, so RLS only
 * ever returns PUBLISHED rows and the pages stay statically cached.
 * Errors are thrown (not swallowed) so a failed revalidation keeps serving the
 * last good page instead of caching an empty one.
 */

type PostRow = Database['public']['Tables']['posts']['Row'];
type DocumentRow = Database['public']['Tables']['documents']['Row'];

const SUMMARY_COLUMNS = 'id, slug, title, excerpt, category, featured, published_at, content' as const;

function toSummary(row: Pick<PostRow, 'id' | 'slug' | 'title' | 'excerpt' | 'category' | 'featured' | 'published_at' | 'content'>): PostSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    featured: row.featured,
    publishedAt: row.published_at ?? '',
    readingMinutes: readingMinutes(row.content),
  };
}

function toDocument(row: DocumentRow): Document {
  const isExternal = !row.file_path && !!row.external_url;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.category,
    publishedAt: row.published_at ?? '',
    href: isExternal ? row.external_url! : `/documents/${row.slug}`,
    isExternal,
  };
}

export const getPublishedPosts = cache(async (): Promise<PostSummary[]> => {
  const { data, error } = await createPublicClient()
    .from('posts')
    .select(SUMMARY_COLUMNS)
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (error) throw new Error(`Failed to load posts: ${error.message}`);
  return data.map(toSummary);
});

export const getPostBySlug = cache(async (slug: string): Promise<Post | null> => {
  const { data, error } = await createPublicClient()
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (error) throw new Error(`Failed to load post: ${error.message}`);
  if (!data) return null;
  return { ...toSummary(data), content: data.content, updatedAt: data.updated_at };
});

export const getPostsByCategory = cache(async (category: string): Promise<PostSummary[]> => {
  const posts = await getPublishedPosts();
  return posts.filter((p) => p.category?.toLowerCase() === category.toLowerCase());
});

export const getCategories = cache(async (): Promise<{ name: string; count: number }[]> => {
  const counts = new Map<string, number>();
  for (const p of await getPublishedPosts()) {
    if (p.category) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  }
  return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
});

export const getPublishedDocuments = cache(async (): Promise<Document[]> => {
  const { data, error } = await createPublicClient()
    .from('documents')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (error) throw new Error(`Failed to load documents: ${error.message}`);
  return data.map(toDocument);
});

/** Storage path for a published document's PDF, or null. */
export async function getPublishedDocumentFilePath(slug: string): Promise<string | null> {
  const { data, error } = await createPublicClient()
    .from('documents')
    .select('file_path')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (error) throw new Error(`Failed to load document: ${error.message}`);
  return data?.file_path ?? null;
}
