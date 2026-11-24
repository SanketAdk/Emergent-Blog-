'use client';

import { useActionState, useState } from 'react';
import { createDocumentUpload, saveDocument } from '@/actions/documents';
import { createClient } from '@/lib/supabase/client';
import { slugify } from '@/lib/format';
import type { FormState } from '@/lib/validation';
import { Alert, Button, FieldError, Input, Label, Textarea } from '@/components/studio/ui';
import { useUnsavedChanges } from '@/components/studio/useUnsavedChanges';

export interface DocumentFormValues {
  id?: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  status: 'draft' | 'published';
  source: 'file' | 'link';
  file_path: string;
  external_url: string;
}

const MAX_BYTES = 10 * 1024 * 1024;

export default function DocumentForm({ initial }: { initial: DocumentFormValues }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveDocument, {});
  const [values, setValues] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [upload, setUpload] = useState<{ status: 'idle' | 'uploading' | 'done' | 'error'; message?: string; name?: string }>({
    status: initial.file_path ? 'done' : 'idle',
    name: initial.file_path ? 'Current PDF' : undefined,
  });
  const [submitting, setSubmitting] = useState(false);

  const dirty = JSON.stringify(values) !== JSON.stringify(initial);
  useUnsavedChanges(dirty && !submitting && !pending);
  const set = <K extends keyof DocumentFormValues>(key: K, value: DocumentFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));
  const err = state.fieldErrors ?? {};
  const isPublished = initial.status === 'published';

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.type !== 'application/pdf') return setUpload({ status: 'error', message: 'Only PDF files are allowed.' });
    if (file.size > MAX_BYTES) return setUpload({ status: 'error', message: 'PDF must be 10 MB or smaller.' });

    setUpload({ status: 'uploading', name: file.name });
    const ticket = await createDocumentUpload({ fileName: file.name, size: file.size, type: file.type });
    if ('error' in ticket) return setUpload({ status: 'error', message: ticket.error });

    const { error } = await createClient()
      .storage.from('documents')
      .uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: 'application/pdf' });
    if (error) return setUpload({ status: 'error', message: 'Upload failed. Please try again.' });

    set('file_path', ticket.path);
    if (!values.title) {
      const t = file.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim();
      setValues((v) => ({ ...v, file_path: ticket.path, title: t, slug: slugTouched ? v.slug : slugify(t) }));
    }
    setUpload({ status: 'done', name: file.name });
  }

  return (
    <form action={action} onSubmit={() => setSubmitting(true)} className="space-y-6">
      {state.message && <Alert>{state.message}</Alert>}
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <input type="hidden" name="source" value={values.source} />
      <input type="hidden" name="file_path" value={values.source === 'file' ? values.file_path : ''} />

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <div className="space-y-5 rounded-lg border border-border bg-background p-5">
          <fieldset>
            <legend className="text-sm font-medium mb-2">Source</legend>
            <div className="flex gap-6 text-sm">
              {(['file', 'link'] as const).map((s) => (
                <label key={s} className="flex items-center gap-2">
                  <input type="radio" name="source-choice" checked={values.source === s} onChange={() => set('source', s)} />
                  {s === 'file' ? 'Upload a PDF' : 'Link to an external document'}
                </label>
              ))}
            </div>
          </fieldset>

          {values.source === 'file' ? (
            <div>
              <Label htmlFor="pdf">PDF file</Label>
              <Input id="pdf" type="file" accept="application/pdf" onChange={(e) => onFile(e.target.files?.[0])} />
              <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
                {upload.status === 'uploading' && `Uploading ${upload.name}…`}
                {upload.status === 'done' && `✓ ${upload.name} ready`}
                {upload.status === 'idle' && 'PDF only, up to 10 MB.'}
              </p>
              {upload.status === 'error' && <FieldError id="pdf-error" messages={[upload.message ?? 'Upload failed']} />}
              <FieldError id="file-error" messages={err.file_path} />
            </div>
          ) : (
            <div>
              <Label htmlFor="external_url">Link</Label>
              <Input
                id="external_url"
                name="external_url"
                type="url"
                placeholder="https://docs.google.com/…"
                value={values.external_url}
                onChange={(e) => set('external_url', e.target.value)}
                aria-invalid={!!err.external_url}
              />
              <FieldError id="url-error" messages={err.external_url} />
            </div>
          )}

          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={values.title}
              aria-invalid={!!err.title}
              onChange={(e) => {
                set('title', e.target.value);
                if (!slugTouched) set('slug', slugify(e.target.value));
              }}
              required
            />
            <FieldError id="title-error" messages={err.title} />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              maxLength={1000}
              value={values.description}
              onChange={(e) => set('description', e.target.value)}
            />
            <FieldError id="description-error" messages={err.description} />
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-lg border border-border bg-background p-4 space-y-3">
            <p className="text-sm">
              Status: <span className="font-medium">{isPublished ? 'Published' : initial.id ? 'Draft' : 'New (unsaved)'}</span>
            </p>
            <Button type="submit" name="intent" value="publish" className="w-full" disabled={pending || upload.status === 'uploading'}>
              {pending ? 'Saving…' : isPublished ? 'Update' : 'Publish'}
            </Button>
            <Button
              type="submit"
              name="intent"
              value="draft"
              variant="secondary"
              className="w-full"
              disabled={pending || upload.status === 'uploading'}
            >
              {isPublished ? 'Unpublish (move to drafts)' : 'Save draft'}
            </Button>
          </div>
          <div className="rounded-lg border border-border bg-background p-4 space-y-4">
            <div>
              <Label htmlFor="slug">URL slug</Label>
              <Input
                id="slug"
                name="slug"
                value={values.slug}
                aria-invalid={!!err.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set('slug', e.target.value.toLowerCase());
                }}
                required
              />
              <p className="mt-1 text-xs text-muted-foreground break-all">/documents/{values.slug || '…'}</p>
              <FieldError id="slug-error" messages={err.slug} />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input id="category" name="category" value={values.category} onChange={(e) => set('category', e.target.value)} />
              <FieldError id="category-error" messages={err.category} />
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
}
