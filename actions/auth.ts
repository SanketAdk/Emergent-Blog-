'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { safeStudioPath } from '@/lib/auth-paths';

export type LoginState = { error?: string };

const LoginSchema = z.object({
  username: z.string().trim().toLowerCase().min(3).max(32),
  password: z.string().min(1).max(200),
  next: z.string().optional(),
});

const GENERIC_ERROR = 'Invalid username or password.';

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
    next: formData.get('next') ?? undefined,
  });
  if (!parsed.success) return { error: GENERIC_ERROR };
  const { username, password, next } = parsed.data;

  const ip = await clientIp();
  const admin = createAdminClient();

  // 1. Rate limit + resolve username → email (server-only RPC, secret key).
  const { data: guard, error: guardError } = await admin
    .rpc('studio_login_guard', { p_username: username, p_ip: ip })
    .single();
  if (guardError || !guard) {
    console.error('[auth] login guard failed', guardError?.message);
    return { error: 'Login is temporarily unavailable. Please try again shortly.' };
  }
  if (!guard.allowed) {
    return { error: 'Too many failed attempts. Please wait 15 minutes and try again.' };
  }

  // 2. Sign in. Unknown usernames still make a sign-in call so response time
  //    does not reveal whether the username exists.
  const supabase = await createClient();
  const email = guard.email ?? `no-such-user-${crypto.randomUUID()}@invalid.example`;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  // 3. Must be an admin.
  let ok = !error && !!data.user;
  if (ok) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user!.id).single();
    if (profile?.role !== 'admin') {
      await supabase.auth.signOut();
      ok = false;
    }
  }

  await admin.rpc('studio_record_login', { p_username: username, p_ip: ip, p_succeeded: ok });
  if (!ok) return { error: GENERIC_ERROR };

  redirect(safeStudioPath(next));
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/studio/login');
}
