'use client';

import { useActionState, useEffect, useRef } from 'react';
import { changePassword } from '@/actions/account';
import type { FormState } from '@/lib/validation';
import { Alert, Button, FieldError, Input, Label } from '@/components/studio/ui';

export default function PasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(changePassword, {});
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);
  const err = state.fieldErrors ?? {};

  return (
    <form ref={formRef} action={action} className="space-y-4 max-w-sm">
      {state.message && <Alert tone={state.ok ? 'success' : 'error'}>{state.message}</Alert>}
      <div>
        <Label htmlFor="current">Current password</Label>
        <Input id="current" name="current" type="password" autoComplete="current-password" aria-invalid={!!err.current} required />
        <FieldError id="current-error" messages={err.current} />
      </div>
      <div>
        <Label htmlFor="next">New password</Label>
        <Input id="next" name="next" type="password" autoComplete="new-password" aria-invalid={!!err.next} aria-describedby="next-help" required />
        <p id="next-help" className="mt-1 text-xs text-muted-foreground">At least 12 characters with upper- and lowercase letters and a number.</p>
        <FieldError id="next-error" messages={err.next} />
      </div>
      <div>
        <Label htmlFor="confirm">Repeat new password</Label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" aria-invalid={!!err.confirm} required />
        <FieldError id="confirm-error" messages={err.confirm} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Change password'}
      </Button>
    </form>
  );
}
