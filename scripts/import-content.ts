/**
 * One-time import of the original JSON content + PDFs into Supabase.
 * Idempotent: re-running updates rows by slug and overwrites the same files.
 *
 *   npm run content:import                 # local Supabase
 *   npm run content:import -- --confirm    # remote/production project
 */
import { readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { scriptClient, requireConfirmForRemote } from './_shared';

interface SeedPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  date: string;
  category?: string;
  featured?: boolean;
}
interface SeedDocument {
  id: string;
  title: string;
  description: string;
  date: string;
  category?: string;
  fileUrl: string;
}

const SEED_DIR = join(process.cwd(), 'supabase', 'seed-data');
const read = <T>(file: string): T => JSON.parse(readFileSync(join(SEED_DIR, file), 'utf8')) as T;
const toTimestamp = (date: string) => new Date(`${date}T00:00:00Z`).toISOString();

async function main() {
  const { url, supabase } = scriptClient();
  requireConfirmForRemote(url);

  // ── Posts ──
  const posts = read<SeedPost[]>('posts.json');
  const { error: postError } = await supabase.from('posts').upsert(
    posts.map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt ?? '',
      content: p.content,
      category: p.category ?? null,
      featured: p.featured ?? false,
      status: 'published' as const,
      published_at: toTimestamp(p.date),
    })),
    { onConflict: 'slug' },
  );
  if (postError) throw postError;
  console.log(`✓ ${posts.length} posts imported`);

  // ── Documents ──
  const docs = read<SeedDocument[]>('documents.json');
  for (const d of docs) {
    const isLocalFile = d.fileUrl.startsWith('/documents/');
    let file_path: string | null = null;

    if (isLocalFile) {
      const localName = basename(d.fileUrl);
      file_path = `${d.id}.pdf`;
      const bytes = readFileSync(join(SEED_DIR, 'documents', localName));
      const { error } = await supabase.storage
        .from('documents')
        .upload(file_path, bytes, { contentType: 'application/pdf', upsert: true });
      if (error) throw error;
    }

    // Entries the author labelled "Test" are imported as drafts so they don't appear publicly.
    const status = d.category?.toLowerCase() === 'test' ? ('draft' as const) : ('published' as const);

    const { error } = await supabase.from('documents').upsert(
      {
        slug: d.id,
        title: d.title,
        description: d.description,
        category: d.category ?? null,
        file_path,
        external_url: isLocalFile ? null : d.fileUrl,
        status,
        published_at: status === 'published' ? toTimestamp(d.date) : null,
      },
      { onConflict: 'slug' },
    );
    if (error) throw error;
    console.log(`✓ document "${d.title}" (${status}${file_path ? `, file ${file_path}` : ', external link'})`);
  }
}

main().catch((err) => {
  console.error('✗ Import failed:', err.message ?? err);
  process.exit(1);
});
