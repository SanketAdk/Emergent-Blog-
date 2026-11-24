import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import DocumentForm from '@/components/studio/DocumentForm';

export const metadata = { title: 'Upload document' };

export default async function NewDocument() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <Link href="/studio/documents" className="text-sm text-muted-foreground">
        ← All documents
      </Link>
      <h1 className="text-2xl font-semibold">Upload document</h1>
      <DocumentForm
        initial={{
          title: '',
          slug: '',
          description: '',
          category: '',
          status: 'draft',
          source: 'file',
          file_path: '',
          external_url: '',
        }}
      />
    </div>
  );
}
