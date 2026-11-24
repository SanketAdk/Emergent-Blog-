import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import { serverEnv } from '@/lib/env.server'
import type { Database } from '@/types/database.types'

/**
 * Privileged client using the SECRET key. It BYPASSES Row Level Security.
 * Use it only for narrowly scoped server tasks (the Studio login guard).
 * Never use it to read or write content on behalf of a user.
 */
export function createAdminClient() {
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, serverEnv().SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
