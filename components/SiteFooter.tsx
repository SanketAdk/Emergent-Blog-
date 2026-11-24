import Link from 'next/link';

/** Site footer. The landing page hides the Archive link (showArchive={false}). */
export default function SiteFooter({ showArchive = true }: { showArchive?: boolean }) {
  return (
    <footer className="max-w-2xl mx-auto px-8 py-12 text-sm text-gray-600 dark:text-gray-400 flex flex-wrap justify-center gap-x-6 gap-y-2">
      {showArchive && <Link href="/archive">Archive</Link>}
      <Link href="/documents">Documents</Link>
      <a href="/rss.xml">RSS</a>
      <span>© {new Date().getFullYear()} Emergent Thoughts</span>
    </footer>
  );
}
