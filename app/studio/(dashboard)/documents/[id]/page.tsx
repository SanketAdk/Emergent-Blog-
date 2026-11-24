import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { deleteDocument } from '@/actions/documents';
import DocumentForm from '@/components/studio/DocumentForm';
import ConfirmButton from '@/components/studio/ConfirmButton';
import { Alert } from '@/components/studio/ui';

export const metadata = { title: 'Edit document' };

export default async function EditDocument({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ id }, { saved }] = await Promise.all([params, searchParams]);
  if (!z.uuid().safeParse(id).success) notFound();

  const { supabase } = await requireAdmin();
  const { data: doc } = await supabase.from('documents').select('*').eq('id', id).maybeSingle();
  if (!doc) notFound();

  const publicHref = doc.file_path ? `/documents/${doc.slug}` : doc.external_url!;

  return (
    <div className="space-y-6">
      <Link href="/studio/documents" className="text-sm text-muted-foreground">
        ← All documents
      </Link>
      <h1 className="text-2xl font-semibold">Edit document</h1>

      {saved === 'published' && (
        <Alert tone="success">
          Published. It&apos;s listed on{' '}
          <a href="/documents" target="_blank" rel="noopener noreferrer" className="underline">
            /documents
          </a>{' '}
          (
          <a href={publicHref} target="_blank" rel="noopener noreferrer" className="underline">
            open
          </a>
          ).
        </Alert>
      )}
      {saved === 'draft' && <Alert tone="success">Saved as a draft. It is not visible on the site.</Alert>}

      <DocumentForm
        key={doc.updated_at}
        initial={{
          id: doc.id,
          title: doc.title,
          slug: doc.slug,
          description: doc.description,
          category: doc.category ?? '',
          status: doc.status,
          source: doc.file_path ? 'file' : 'link',
          file_path: doc.file_path ?? '',
          external_url: doc.external_url ?? '',
        }}
      />

      <section className="rounded-lg border border-destructive/40 bg-background p-4">
        <h2 className="font-medium mb-1">Delete document</h2>
        <p className="text-sm text-muted-foreground mb-3">This permanently removes the document and its file.</p>
        <ConfirmButton action={deleteDocument.bind(null, doc.id)} confirmText={`Delete "${doc.title}" permanently?`}>
          Delete document
        </ConfirmButton>
      </section>
    </div>
  );
}
