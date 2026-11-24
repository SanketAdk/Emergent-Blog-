import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Server-side gate for every Studio page and Server Action.
 * - getUser() validates the session with Supabase Auth (not just the cookie).
 * - The admin role is read from profiles; RLS still enforces it in the database.
 * Returns a Supabase client acting AS the user, so all writes go through RLS.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/studio/login');

  const { data: profile } = await supabase.from('profiles').select('username, role').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    await supabase.auth.signOut();
    redirect('/studio/login?error=forbidden');
  }

  return { supabase, user, username: profile.username };
}
