import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import DocumentCard from '@/components/DocumentCard';
import SiteFooter from '@/components/SiteFooter';
import { getPublishedDocuments } from '@/lib/queries';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Documents',
  description: 'Reference documents and notes shared on Emergent Thoughts.',
  alternates: { canonical: '/documents' },
};

export default async function DocumentsPage() {
  const docs = await getPublishedDocuments();
  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <Navigation />
      <section className="max-w-2xl mx-auto px-8 py-16">
        <h1 className="text-4xl font-light mb-4">Documents</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8 pb-8 border-b border-gray-200 dark:border-gray-800">
          References, notes and longer-form material.
        </p>
        {docs.map((doc) => (
          <DocumentCard key={doc.id} doc={doc} />
        ))}
        {docs.length === 0 && <p className="text-gray-600 dark:text-gray-400 text-center py-12">No documents yet.</p>}
      </section>
      <SiteFooter />
    </main>
  );
}
