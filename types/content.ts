/** Shapes used by the UI (camelCase), mapped from database rows in lib/queries.ts. */

export interface PostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string | null;
  featured: boolean;
  publishedAt: string;
  readingMinutes: number;
}

export interface Post extends PostSummary {
  content: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string | null;
  publishedAt: string;
  /** Where readers open it: /documents/<slug> for stored PDFs, or the external URL. */
  href: string;
  isExternal: boolean;
}
