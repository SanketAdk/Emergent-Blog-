import posts from '@/data/posts.json';

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  date: string;
  category: string;
  featured?: boolean;
}

export function getAllPosts(): Post[] {
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): Post | undefined {
  return posts.find(post => post.slug === slug);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
import documents from '@/data/documents.json';

export interface Document {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  fileUrl: string;
}

export function getAllDocuments(): Document[] {
  return documents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getDocumentById(id: string): Document | undefined {
  return documents.find(doc => doc.id === id);
}
