import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { Badge, buttonClass } from '@/components/studio/ui';

export const metadata = { title: 'Dashboard' };

export default async function StudioHome() {
  const { supabase, username } = await requireAdmin();
  const [posts, docs] = await Promise.all([
    supabase.from('posts').select('id, title, status, updated_at').order('updated_at', { ascending: false }),
    supabase.from('documents').select('id, title, status, updated_at').order('updated_at', { ascending: false }),
  ]);
  const allPosts = posts.data ?? [];
  const allDocs = docs.data ?? [];
  const recent = [
    ...allPosts.map((p) => ({ ...p, kind: 'Essay' as const, href: `/studio/posts/${p.id}` })),
    ...allDocs.map((d) => ({ ...d, kind: 'Document' as const, href: `/studio/documents/${d.id}` })),
  ]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 6);

  const stats = [
    { label: 'Published essays', value: allPosts.filter((p) => p.status === 'published').length },
    { label: 'Draft essays', value: allPosts.filter((p) => p.status === 'draft').length },
    { label: 'Published documents', value: allDocs.filter((d) => d.status === 'published').length },
    { label: 'Draft documents', value: allDocs.filter((d) => d.status === 'draft').length },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Welcome back, {username}</h1>
          <p className="text-muted-foreground">Write, edit and publish from here. Changes go live within seconds.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/studio/posts/new" className={buttonClass('primary')}>
            New essay
          </Link>
          <Link href="/studio/documents/new" className={buttonClass('secondary')}>
            Upload document
          </Link>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-background p-4">
            <dt className="text-sm text-muted-foreground">{s.label}</dt>
            <dd className="text-3xl font-semibold tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>

      <section className="rounded-lg border border-border bg-background">
        <h2 className="border-b border-border px-4 py-3 font-medium">Recently edited</h2>
        <ul className="divide-y divide-border">
          {recent.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              <span className="w-20 text-xs uppercase tracking-wide text-muted-foreground">{item.kind}</span>
              <Link href={item.href} className="flex-1 truncate font-medium">
                {item.title}
              </Link>
              <Badge status={item.status} />
              <span className="hidden w-28 text-right text-sm text-muted-foreground sm:block">{formatDate(item.updated_at)}</span>
            </li>
          ))}
          {recent.length === 0 && <li className="px-4 py-6 text-muted-foreground">Nothing yet. Start with a new essay.</li>}
        </ul>
      </section>
    </div>
  );
}
