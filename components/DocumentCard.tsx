import { formatDate } from '@/lib/format';
import type { Document } from '@/types/content';

export default function DocumentCard({ doc }: { doc: Document }) {
  const linkProps = { href: doc.href, target: '_blank', rel: 'noopener noreferrer' } as const;
  return (
    <article className="py-6 border-b border-gray-200 dark:border-gray-800 last:border-b-0">
      <a {...linkProps} className="group">
        <h2 className="text-xl font-medium mb-2 group-hover:opacity-70 transition-opacity">{doc.title}</h2>
      </a>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        <time dateTime={doc.publishedAt}>{formatDate(doc.publishedAt)}</time>
        {doc.category && <> · {doc.category}</>}
      </p>
      {doc.description && <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">{doc.description}</p>}
      <a {...linkProps} className="inline-block mt-4 text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors underline">
        {doc.isExternal ? 'Open document ↗' : 'View PDF →'}
      </a>
    </article>
  );
}
