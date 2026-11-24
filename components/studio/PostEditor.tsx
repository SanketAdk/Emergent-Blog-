'use client';

import { useActionState, useState } from 'react';
import { savePost } from '@/actions/posts';
import { Markdown } from '@/lib/markdown';
import { slugify, readingMinutes } from '@/lib/format';
import type { FormState } from '@/lib/validation';
import { Alert, Button, FieldError, Input, Label, Textarea } from '@/components/studio/ui';
import { useUnsavedChanges } from '@/components/studio/useUnsavedChanges';
import { cn } from '@/lib/utils';

export interface PostEditorValues {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  featured: boolean;
  status: 'draft' | 'published';
}

export default function PostEditor({ initial, categories }: { initial: PostEditorValues; categories: string[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(savePost, {});
  const [values, setValues] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [submitting, setSubmitting] = useState(false);

  const dirty = JSON.stringify(values) !== JSON.stringify(initial);
  useUnsavedChanges(dirty && !submitting && !pending);

  const set = <K extends keyof PostEditorValues>(key: K, value: PostEditorValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));
  const err = state.fieldErrors ?? {};
  const isPublished = initial.status === 'published';

  return (
    <form action={action} onSubmit={() => setSubmitting(true)} className="space-y-6">
      {state.message && <Alert>{state.message}</Alert>}
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <div className="space-y-5">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={values.title}
              aria-invalid={!!err.title}
              aria-describedby="title-error"
              onChange={(e) => {
                set('title', e.target.value);
                if (!slugTouched) set('slug', slugify(e.target.value));
              }}
              className="text-lg"
              required
            />
            <FieldError id="title-error" messages={err.title} />
          </div>

          <div>
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              name="excerpt"
              rows={2}
              maxLength={500}
              value={values.excerpt}
              aria-invalid={!!err.excerpt}
              aria-describedby="excerpt-help excerpt-error"
              onChange={(e) => set('excerpt', e.target.value)}
            />
            <p id="excerpt-help" className="mt-1 text-xs text-muted-foreground">
              Shown on the home page and in search/social previews. {values.excerpt.length}/500
            </p>
            <FieldError id="excerpt-error" messages={err.excerpt} />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label htmlFor="content" className="mb-0">
                Essay
              </Label>
              <div role="tablist" aria-label="Editor mode" className="flex rounded-md border border-input p-0.5 text-sm">
                {(['write', 'preview'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    aria-selected={tab === t}
                    onClick={() => setTab(t)}
                    className={cn('rounded px-3 py-1 capitalize', tab === t ? 'bg-muted font-medium' : 'text-muted-foreground')}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              id="content"
              name="content"
              value={values.content}
              onChange={(e) => set('content', e.target.value)}
              className={cn('min-h-[28rem] font-mono text-sm leading-relaxed', tab === 'preview' && 'hidden')}
              aria-invalid={!!err.content}
            />
            {tab === 'preview' && (
              <div className="min-h-[28rem] rounded-md border border-input bg-background px-6 py-4 font-serif">
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  {values.content.trim() ? <Markdown>{values.content}</Markdown> : <p className="text-muted-foreground">Nothing to preview yet.</p>}
                </div>
              </div>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Markdown supported: <code>## Heading</code>, <code>**bold**</code>, <code>*italic*</code>, <code>[link](https://…)</code>,{' '}
              <code>&gt; quote</code>, lists. Leave a blank line between paragraphs. ~{readingMinutes(values.content)} min read.
            </p>
            <FieldError id="content-error" messages={err.content} />
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-lg border border-border bg-background p-4 space-y-3">
            <p className="text-sm">
              Status:{' '}
              <span className="font-medium">{isPublished ? 'Published' : initial.id ? 'Draft' : 'New (unsaved)'}</span>
            </p>
            <Button type="submit" name="intent" value="publish" className="w-full" disabled={pending}>
              {pending ? 'Saving…' : isPublished ? 'Update' : 'Publish'}
            </Button>
            <Button type="submit" name="intent" value="draft" variant="secondary" className="w-full" disabled={pending}>
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
                aria-describedby="slug-help slug-error"
                onChange={(e) => {
                  setSlugTouched(true);
                  set('slug', e.target.value.toLowerCase());
                }}
                required
              />
              <p id="slug-help" className="mt-1 text-xs text-muted-foreground break-all">
                /posts/{values.slug || '…'}
                {isPublished && ' · Changing this breaks existing links.'}
              </p>
              <FieldError id="slug-error" messages={err.slug} />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                list="category-options"
                value={values.category}
                onChange={(e) => set('category', e.target.value)}
                aria-invalid={!!err.category}
              />
              <datalist id="category-options">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <FieldError id="category-error" messages={err.category} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="featured"
                checked={values.featured}
                onChange={(e) => set('featured', e.target.checked)}
                className="size-4"
              />
              Feature on the home page
            </label>
          </div>
        </aside>
      </div>
    </form>
  );
}
