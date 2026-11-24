import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Next.js 16 "proxy" (formerly middleware). Runs only for /studio routes:
 * refreshes the Supabase session cookie and redirects anonymous visitors to
 * the login page. Public pages never pass through here, so they stay static.
 * This is a convenience layer; every Studio page and Server Action re-checks
 * the session and admin role on the server (see lib/auth.ts).
 */
export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: ['/studio', '/studio/:path*'],
}
