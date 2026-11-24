import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import type { Database } from '@/types/database.types'

/**
 * Cookie-free client for PUBLIC reads (published posts and documents).
 * Because it does not touch cookies, pages that use it stay statically
 * rendered and are refreshed on demand by revalidatePath() after Studio edits.
 */
export function createPublicClient() {
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
