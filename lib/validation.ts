import { z } from 'zod';

/* Shared input rules. They mirror the database CHECK constraints so users get
   friendly field errors before the database would reject the write. */

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const slug = z
  .string()
  .trim()
  .min(1, 'Slug is required')
  .max(120, 'Slug must be 120 characters or fewer')
  .regex(SLUG_RE, 'Use lowercase letters, numbers and single hyphens (e.g. my-new-essay)');

const optionalCategory = z
  .string()
  .trim()
  .max(50, 'Category must be 50 characters or fewer')
  .transform((v) => (v === '' ? null : v));

const status = z.enum(['draft', 'published']);

export const PostInput = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title must be 200 characters or fewer'),
  slug,
  excerpt: z.string().trim().max(500, 'Excerpt must be 500 characters or fewer'),
  content: z.string().max(200_000, 'Content is too long'),
  category: optionalCategory,
  featured: z.boolean(),
  status,
});
export type PostInput = z.infer<typeof PostInput>;

export const DocumentInput = z
  .object({
    id: z.uuid().optional(),
    title: z.string().trim().min(1, 'Title is required').max(200, 'Title must be 200 characters or fewer'),
    slug,
    description: z.string().trim().max(1000, 'Description must be 1000 characters or fewer'),
    category: optionalCategory,
    status,
    source: z.enum(['file', 'link']),
    file_path: z
      .string()
      .regex(/^[a-z0-9-]+\.pdf$/, 'Invalid file reference')
      .optional()
      .or(z.literal('').transform(() => undefined)),
    external_url: z
      .url({ message: 'Enter a full https:// link' })
      .refine((u) => u.startsWith('https://'), 'Link must start with https://')
      .optional()
      .or(z.literal('').transform(() => undefined)),
  })
  .superRefine((d, ctx) => {
    if (d.source === 'file' && !d.file_path) ctx.addIssue({ code: 'custom', path: ['file_path'], message: 'Upload a PDF' });
    if (d.source === 'link' && !d.external_url)
      ctx.addIssue({ code: 'custom', path: ['external_url'], message: 'Enter a link' });
  });
export type DocumentInput = z.infer<typeof DocumentInput>;

export const UploadRequest = z.object({
  fileName: z.string().min(1).max(255),
  size: z.number().int().positive().max(10 * 1024 * 1024, 'PDF must be 10 MB or smaller'),
  type: z.literal('application/pdf', { message: 'Only PDF files are allowed' }),
});

export type FieldErrors = Record<string, string[] | undefined>;
export type FormState = { ok?: boolean; message?: string; fieldErrors?: FieldErrors };
