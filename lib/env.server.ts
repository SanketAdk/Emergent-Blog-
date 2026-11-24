import 'server-only';
import { z } from 'zod';

/**
 * Server-only secrets. Importing this file from a Client Component fails the
 * build (via 'server-only'), so the secret key can never reach the browser.
 */
const serverSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(20, 'SUPABASE_SECRET_KEY is missing (needed for Studio login)'),
});

let cached: z.infer<typeof serverSchema> | undefined;

/** Validated lazily so public pages can build without the secret present. */
export function serverEnv() {
  if (!cached) {
    const parsed = serverSchema.safeParse({ SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY });
    if (!parsed.success) {
      throw new Error(`Invalid server environment variables.\n${z.prettifyError(parsed.error)}`);
    }
    cached = parsed.data;
  }
  return cached;
}
