'use client';

import { useRef, useState, type KeyboardEvent } from 'react';
import PostCard from '@/components/PostCard';
import DocumentCard from '@/components/DocumentCard';
import type { Document, PostSummary } from '@/types/content';

type TabId = 'essays' | 'documents';

const TABS: { id: TabId; label: string }[] = [
  { id: 'essays', label: 'Essays' },
  { id: 'documents', label: 'Documents' },
];

/**
 * Landing-page switcher between essays and documents.
 * Follows the WAI-ARIA tabs pattern: tablist/tab/tabpanel, aria-selected,
 * roving tabIndex, and Left/Right/Home/End keyboard navigation.
 * The tab row reuses the original "Essays" heading styles.
 */
export default function HomeTabs({
  posts,
  documents,
  hasFeatured = false,
}: {
  /** Essays to list (the featured essay, shown above, is excluded). */
  posts: PostSummary[];
  documents: Document[];
  /** True when a featured essay is shown above, so an empty list isn't "no essays". */
  hasFeatured?: boolean;
}) {
  const [active, setActive] = useState<TabId>('essays');
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({ essays: null, documents: null });

  const focusTab = (id: TabId) => {
    setActive(id);
    tabRefs.current[id]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = TABS.length - 1;
    const next =
      e.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : e.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : null;
    if (next === null) return;
    e.preventDefault();
    focusTab(TABS[next].id);
  };

  return (
    <section className="max-w-2xl mx-auto px-8 py-8">
      <div
        role="tablist"
        aria-label="Browse content"
        className="flex gap-8 text-3xl font-light font-display mb-8 pb-8 border-b border-gray-200 dark:border-gray-800"
      >
        {TABS.map((tab, i) => {
          const selected = active === tab.id;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[tab.id] = el;
              }}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={
                selected
                  ? 'text-black dark:text-white underline decoration-1 underline-offset-[10px]'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id="panel-essays" aria-labelledby="tab-essays" hidden={active !== 'essays'} tabIndex={0}>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {posts.length === 0 && !hasFeatured && (
          <p className="text-gray-600 dark:text-gray-400 text-center py-12">No essays yet. Check back soon.</p>
        )}
      </div>

      <div role="tabpanel" id="panel-documents" aria-labelledby="tab-documents" hidden={active !== 'documents'} tabIndex={0}>
        {documents.map((doc) => (
          <DocumentCard key={doc.id} doc={doc} />
        ))}
        {documents.length === 0 && <p className="text-gray-600 dark:text-gray-400 text-center py-12">No documents yet.</p>}
      </div>
    </section>
  );
}
