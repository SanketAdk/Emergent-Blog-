import Link from 'next/link';
import { formatDate } from '@/lib/format';
import type { PostSummary } from '@/types/content';

export default function PostCard({ post }: { post: PostSummary }) {
  return (
    <article className="py-8 border-b border-gray-200 dark:border-gray-800 last:border-b-0">
      <Link href={`/posts/${post.slug}`} className="group">
        <h2 className="text-2xl font-medium mb-2 group-hover:opacity-70 transition-opacity">{post.title}</h2>
      </Link>
      <PostMeta post={post} className="mb-4" />
      <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">{post.excerpt}</p>
    </article>
  );
}

export function PostMeta({ post, className = '' }: { post: PostSummary; className?: string }) {
  return (
    <p className={`text-sm text-gray-600 dark:text-gray-400 flex flex-wrap gap-x-2 ${className}`}>
      <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
      <span aria-hidden="true">·</span>
      <span>{post.readingMinutes} min read</span>
      {post.category && (
        <>
          <span aria-hidden="true">·</span>
          <Link href={`/category/${encodeURIComponent(post.category.toLowerCase())}`} className="underline underline-offset-2">
            {post.category}
          </Link>
        </>
      )}
    </p>
  );
}
