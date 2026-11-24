import { createBrowserClient } from '@supabase/ssr'
import { env } from '@/lib/env'

/** Supabase client for Client Components. Uses the publishable key only; RLS enforces access. */
export function createClient() {
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
}
