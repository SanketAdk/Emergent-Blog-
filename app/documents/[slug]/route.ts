import { NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/public';
import { getPublishedDocumentFilePath } from '@/lib/queries';

/**
 * Stable public URL for a PDF: /documents/<slug>
 * The bucket is private; this issues a short-lived signed URL for PUBLISHED
 * documents only (enforced again by the storage RLS policy) and redirects.
 */
export const dynamic = 'force-dynamic';

const SIGNED_URL_TTL_SECONDS = 60;

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return new NextResponse('Not found', { status: 404 });
  }

  const filePath = await getPublishedDocumentFilePath(slug);
  if (!filePath) return new NextResponse('Not found', { status: 404 });

  const { data, error } = await createPublicClient()
    .storage.from('documents')
    .createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS);
  if (error || !data) return new NextResponse('Not found', { status: 404 });

  const res = NextResponse.redirect(data.signedUrl, 302);
  res.headers.set('Cache-Control', 'private, no-store');
  return res;
}
