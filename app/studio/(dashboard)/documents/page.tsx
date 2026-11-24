import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { Alert, Badge, buttonClass } from '@/components/studio/ui';

export const metadata = { title: 'Documents' };

export default async function StudioDocuments({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const { deleted } = await searchParams;
  const { supabase } = await requireAdmin();
  const { data: docs, error } = await supabase
    .from('documents')
    .select('id, title, slug, status, file_path, external_url, updated_at')
    .order('updated_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Documents</h1>
        <Link href="/studio/documents/new" className={buttonClass('primary')}>
          Upload document
        </Link>
      </div>
      {deleted && <Alert tone="success">Document deleted.</Alert>}
      {error && <Alert>Could not load documents.</Alert>}

      <div className="overflow-x-auto rounded-lg border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Type</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Last edited</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {docs?.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-3">
                  <Link href={`/studio/documents/${d.id}`} className="font-medium">
                    {d.title}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Badge status={d.status} />
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{d.file_path ? 'PDF' : 'Link'}</td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{formatDate(d.updated_at)}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/studio/documents/${d.id}`} className="underline underline-offset-2">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {docs?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No documents yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
