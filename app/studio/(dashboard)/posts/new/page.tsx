import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import PostEditor from '@/components/studio/PostEditor';

export const metadata = { title: 'New essay' };

export default async function NewPost() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from('posts').select('category');
  const categories = [...new Set((data ?? []).map((r) => r.category).filter((c): c is string => !!c))].sort();

  return (
    <div className="space-y-6">
      <Link href="/studio/posts" className="text-sm text-muted-foreground">
        ← All essays
      </Link>
      <h1 className="text-2xl font-semibold">New essay</h1>
      <PostEditor
        categories={categories}
        initial={{ title: '', slug: '', excerpt: '', content: '', category: '', featured: false, status: 'draft' }}
      />
    </div>
  );
}
