'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { DocumentInput, UploadRequest, type FormState } from '@/lib/validation';

function refreshSite() {
  revalidatePath('/', 'layout');
}

/**
 * Step 1 of an upload: the server checks the admin session and the file's
 * type/size, picks a random object name, and returns a one-time signed upload
 * token. The browser then uploads the PDF directly to Supabase Storage, which
 * avoids serverless request-size limits. Storage RLS also requires admin.
 */
export async function createDocumentUpload(input: { fileName: string; size: number; type: string }) {
  const { supabase } = await requireAdmin();
  const parsed = UploadRequest.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid file' };

  const path = `${crypto.randomUUID()}.pdf`;
  const { data, error } = await supabase.storage.from('documents').createSignedUploadUrl(path);
  if (error || !data) {
    console.error('[documents] signed upload failed', error?.message);
    return { error: 'Could not start the upload. Please try again.' };
  }
  return { path: data.path, token: data.token };
}

export async function saveDocument(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await requireAdmin();

  const parsed = DocumentInput.safeParse({
    id: formData.get('id') || undefined,
    title: formData.get('title'),
    slug: formData.get('slug'),
    description: formData.get('description') ?? '',
    category: formData.get('category') ?? '',
    status: formData.get('intent') === 'publish' ? 'published' : 'draft',
    source: formData.get('source'),
    file_path: formData.get('file_path') ?? '',
    external_url: formData.get('external_url') ?? '',
  });
  if (!parsed.success) {
    return { message: 'Please fix the highlighted fields.', fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const { id, source, file_path, external_url, ...rest } = parsed.data;

  // A new PDF must actually exist in storage before we reference it.
  if (source === 'file') {
    const { data: exists } = await supabase.storage.from('documents').exists(file_path!);
    if (!exists) return { message: 'The uploaded file could not be found. Please upload it again.' };
  }

  // Remember the previous file so it can be cleaned up if replaced.
  let previousFile: string | null = null;
  if (id) {
    const { data: prev } = await supabase.from('documents').select('file_path').eq('id', id).single();
    previousFile = prev?.file_path ?? null;
  }

  const values = {
    ...rest,
    file_path: source === 'file' ? file_path! : null,
    external_url: source === 'link' ? external_url! : null,
  };

  const result = id
    ? await supabase.from('documents').update(values).eq('id', id).select('id').single()
    : await supabase.from('documents').insert({ ...values, author_id: user.id }).select('id').single();

  if (result.error) {
    // Roll back a freshly uploaded, now-orphaned file.
    if (source === 'file' && file_path !== previousFile) {
      await supabase.storage.from('documents').remove([file_path!]);
    }
    if (result.error.code === '23505') {
      return { message: 'Please fix the highlighted fields.', fieldErrors: { slug: ['This slug is already used by another document'] } };
    }
    console.error('[documents] save failed', result.error.message);
    return { message: 'Could not save the document. Please try again.' };
  }

  if (previousFile && previousFile !== values.file_path) {
    await supabase.storage.from('documents').remove([previousFile]);
  }

  refreshSite();
  redirect(`/studio/documents/${result.data.id}?saved=${rest.status}`);
}


export async function deleteDocument(id: string) {
  const { supabase } = await requireAdmin();
  if (!z.uuid().safeParse(id).success) return;
  const { data: doc } = await supabase.from('documents').select('file_path').eq('id', id).single();
  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) throw new Error('Could not delete the document.');
  if (doc?.file_path) await supabase.storage.from('documents').remove([doc.file_path]);
  refreshSite();
  redirect('/studio/documents?deleted=1');
}
