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

export interface Document {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  fileUrl: string;
}
