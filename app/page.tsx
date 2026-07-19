'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Bio from '@/components/Bio';
import PostCard from '@/components/PostCard';
import TabToggle from '@/components/TabToggle';
import DocumentCard from '@/components/DocumentCard';
import { getAllPosts, getAllDocuments } from '@/lib/posts';
import Link from 'next/link';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'essays' | 'documents'>('essays');
  const allPosts = getAllPosts();
  const allDocuments = getAllDocuments();

  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <Navigation />
      <Bio />
      
      <section className="max-w-2xl mx-auto px-8 py-8">
        <TabToggle onToggle={setActiveTab} />

        {activeTab === 'essays' && (
          <div>
            <div>
              {allPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {allPosts.length === 0 && (
              <p className="text-gray-600 dark:text-gray-400 text-center py-12">
                No essays yet. Check back soon.
              </p>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <div>
              {allDocuments.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>

            {allDocuments.length === 0 && (
              <p className="text-gray-600 dark:text-gray-400 text-center py-12">
                No documents yet. Check back soon.
              </p>
            )}
          </div>
        )}
      </section>

      <footer className="max-w-2xl mx-auto px-8 py-8 text-center text-sm text-gray-600 dark:text-gray-400">
        <Link href="/archive" className="hover:opacity-70">
          View all essays →
        </Link>
      </footer>
    </main>
  );
}
