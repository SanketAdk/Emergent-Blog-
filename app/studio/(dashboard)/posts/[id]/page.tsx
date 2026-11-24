import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { deletePost } from '@/actions/posts';
import { formatDate } from '@/lib/format';
import PostEditor from '@/components/studio/PostEditor';
import ConfirmButton from '@/components/studio/ConfirmButton';
import { Alert } from '@/components/studio/ui';

export const metadata = { title: 'Edit essay' };

export default async function EditPost({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ id }, { saved }] = await Promise.all([params, searchParams]);
  if (!z.uuid().safeParse(id).success) notFound();

  const { supabase } = await requireAdmin();
  const [{ data: post }, { data: cats }] = await Promise.all([
    supabase.from('posts').select('*').eq('id', id).maybeSingle(),
    supabase.from('posts').select('category'),
  ]);
  if (!post) notFound();
  const categories = [...new Set((cats ?? []).map((r) => r.category).filter((c): c is string => !!c))].sort();

  return (
    <div className="space-y-6">
      <Link href="/studio/posts" className="text-sm text-muted-foreground">
        ← All essays
      </Link>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold">Edit essay</h1>
        <p className="text-sm text-muted-foreground">
          Last edited {formatDate(post.updated_at)}
          {post.published_at && <> · First published {formatDate(post.published_at)}</>}
        </p>
      </div>

      {saved === 'published' && (
        <Alert tone="success">
          Published. It&apos;s live at{' '}
          <a href={`/posts/${post.slug}`} target="_blank" rel="noopener noreferrer" className="underline">
            /posts/{post.slug}
          </a>
          .
        </Alert>
      )}
      {saved === 'draft' && <Alert tone="success">Saved as a draft. It is not visible on the site.</Alert>}

      <PostEditor
        key={post.updated_at}
        categories={categories}
        initial={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          category: post.category ?? '',
          featured: post.featured,
          status: post.status,
        }}
      />

      <section className="rounded-lg border border-destructive/40 bg-background p-4">
        <h2 className="font-medium mb-1">Delete essay</h2>
        <p className="text-sm text-muted-foreground mb-3">This permanently removes the essay. This cannot be undone.</p>
        <ConfirmButton action={deletePost.bind(null, post.id)} confirmText={`Delete "${post.title}" permanently?`}>
          Delete essay
        </ConfirmButton>
      </section>
    </div>
  );
}
