import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

/** Privileged client for one-off admin scripts. Uses the SECRET key (bypasses RLS). */
export function scriptClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    console.error(
      '✗ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set (in .env.local or the environment).',
    );
    process.exit(1);
  }
  return {
    url,
    supabase: createClient<Database>(url, secret, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
  };
}

export const isLocal = (url: string) => /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/.test(url);

/** Scripts that write to a remote (production) project require an explicit --confirm flag. */
export function requireConfirmForRemote(url: string) {
  if (!isLocal(url) && !process.argv.includes('--confirm')) {
    console.error(`✗ Target is a REMOTE project: ${url}\n  Re-run with --confirm if this is intended.`);
    process.exit(1);
  }
  console.log(`→ Target: ${url}${isLocal(url) ? ' (local)' : ' (REMOTE)'}`);
}

export function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}
