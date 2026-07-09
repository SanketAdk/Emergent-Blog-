import Link from 'next/link';
import { Post, formatDate } from '@/lib/posts';

export default function PostCard({ post }: { post: Post }) {
  return (
    <article className="py-8 border-b border-gray-200 dark:border-gray-800 last:border-b-0">
      <Link href={`/posts/${post.slug}`} className="group">
        <h2 className="text-2xl font-medium mb-2 group-hover:opacity-70 transition-opacity">
          {post.title}
        </h2>
      </Link>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {formatDate(post.date)}
      </p>
      <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
        {post.excerpt}
      </p>
    </article>
  );
}
