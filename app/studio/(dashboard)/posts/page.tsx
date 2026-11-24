import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { Alert, Badge, buttonClass } from '@/components/studio/ui';

export const metadata = { title: 'Essays' };

export default async function StudioPosts({ searchParams }: { searchParams: Promise<{ deleted?: string; q?: string }> }) {
  const { deleted, q } = await searchParams;
  const { supabase } = await requireAdmin();
  let query = supabase
    .from('posts')
    .select('id, title, slug, status, category, featured, updated_at, published_at')
    .order('updated_at', { ascending: false });
  if (q?.trim()) query = query.ilike('title', `%${q.trim().replace(/[%_]/g, '\\$&')}%`);
  const { data: posts, error } = await query;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Essays</h1>
        <Link href="/studio/posts/new" className={buttonClass('primary')}>
          New essay
        </Link>
      </div>
      {deleted && <Alert tone="success">Essay deleted.</Alert>}
      {error && <Alert>Could not load essays.</Alert>}

      <form className="max-w-sm" role="search">
        <label htmlFor="q" className="sr-only">
          Search essays
        </label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          placeholder="Search by title…"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </form>

      <div className="overflow-x-auto rounded-lg border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Category</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Last edited</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {posts?.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <Link href={`/studio/posts/${p.id}`} className="font-medium">
                    {p.title}
                  </Link>
                  {p.featured && <span className="ml-2 text-xs text-muted-foreground">★ Featured</span>}
                </td>
                <td className="px-4 py-3">
                  <Badge status={p.status} />
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{p.category ?? '—'}</td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{formatDate(p.updated_at)}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <Link href={`/studio/posts/${p.id}`} className="underline underline-offset-2">
                    Edit
                  </Link>
                  {p.status === 'published' && (
                    <a href={`/posts/${p.slug}`} target="_blank" rel="noopener noreferrer" className="ml-4 text-muted-foreground">
                      View ↗
                    </a>
                  )}
                </td>
              </tr>
            ))}
            {posts?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  {q ? 'No essays match your search.' : 'No essays yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
