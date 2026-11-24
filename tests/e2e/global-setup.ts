import { execFileSync } from 'node:child_process';

/** Refuses to run against anything but a local Supabase, and clears login lockouts between runs. */
export default function globalSetup() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  if (!/^https?:\/\/(127\.0\.0\.1|localhost)/.test(url)) {
    throw new Error(`E2E tests must run against a LOCAL Supabase, got "${url}".`);
  }
  for (const v of ['E2E_USERNAME', 'E2E_PASSWORD']) {
    if (!process.env[v]) throw new Error(`${v} must be set (an admin created with npm run studio:create-admin).`);
  }
  const dbUrl = process.env.E2E_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54422/postgres';
  execFileSync('psql', [dbUrl, '-qc', 'truncate private.login_attempts']);
}
