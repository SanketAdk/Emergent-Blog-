'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { PostInput, type FormState } from '@/lib/validation';

/** Refresh every public page (small site: simplest correct invalidation). */
function refreshSite() {
  revalidatePath('/', 'layout');
}

export async function savePost(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await requireAdmin();

  const parsed = PostInput.safeParse({
    id: formData.get('id') || undefined,
    title: formData.get('title'),
    slug: formData.get('slug'),
    excerpt: formData.get('excerpt') ?? '',
    content: formData.get('content') ?? '',
    category: formData.get('category') ?? '',
    featured: formData.get('featured') === 'on',
    status: formData.get('intent') === 'publish' ? 'published' : 'draft',
  });
  if (!parsed.success) {
    return { message: 'Please fix the highlighted fields.', fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const { id, ...values } = parsed.data;

  // Only one featured essay at a time.
  if (values.featured) {
    let q = supabase.from('posts').update({ featured: false }).eq('featured', true);
    if (id) q = q.neq('id', id);
    const { error } = await q;
    if (error) return { message: 'Could not update the featured essay. Please try again.' };
  }

  const result = id
    ? await supabase.from('posts').update(values).eq('id', id).select('id').single()
    : await supabase.from('posts').insert({ ...values, author_id: user.id }).select('id').single();

  if (result.error) {
    if (result.error.code === '23505' && result.error.message.includes('posts_one_featured_idx')) {
      return { message: 'Another essay was featured at the same time. Please save again.' };
    }
    if (result.error.code === '23505') {
      return { message: 'Please fix the highlighted fields.', fieldErrors: { slug: ['This slug is already used by another essay'] } };
    }
    console.error('[posts] save failed', result.error.message);
    return { message: 'Could not save the essay. Please try again.' };
  }

  refreshSite();
  redirect(`/studio/posts/${result.data.id}?saved=${values.status}`);
}


export async function deletePost(id: string) {
  const { supabase } = await requireAdmin();
  if (!z.uuid().safeParse(id).success) return;
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw new Error('Could not delete the essay.');
  refreshSite();
  redirect('/studio/posts?deleted=1');
}
