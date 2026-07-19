import { Document, formatDate } from '@/lib/posts';

export default function DocumentCard({ doc }: { doc: Document }) {
  return (
    <article className="py-6 border-b border-gray-200 dark:border-gray-800 last:border-b-0">
      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="group">
        <h3 className="text-xl font-medium mb-2 group-hover:opacity-70 transition-opacity text-black dark:text-white">
          {doc.title}
        </h3>
      </a>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        {formatDate(doc.date)}
      </p>
      <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
        {doc.description}
      </p>
      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-4 text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors underline">
        View Document →
      </a>
    </article>
  );
}
