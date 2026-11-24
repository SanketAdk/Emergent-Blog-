'use server';

import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { PasswordChange, type FormState } from '@/lib/validation';

/** Change the signed-in admin's password after re-verifying the current one. */
export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await requireAdmin();

  const parsed = PasswordChange.safeParse({
    current: formData.get('current'),
    next: formData.get('next'),
    confirm: formData.get('confirm'),
  });
  if (!parsed.success) {
    return { message: 'Please fix the highlighted fields.', fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  // Re-authenticate: a stolen session alone must not be enough to take over the account.
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: parsed.data.current,
  });
  if (verifyError) return { fieldErrors: { current: ['Current password is incorrect'] } };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.next });
  if (error) {
    console.error('[account] password change failed', error.message);
    return { message: error.message.includes('weak') ? 'That password is too weak. Try a longer one.' : 'Could not change the password. Please try again.' };
  }
  return { ok: true, message: 'Password changed.' };
}
