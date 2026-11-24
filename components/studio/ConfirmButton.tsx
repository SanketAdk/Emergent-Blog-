'use client';

import { useTransition } from 'react';
import { Button } from '@/components/studio/ui';

/** Runs a Server Action after a browser confirm() dialog. */
export default function ConfirmButton({
  action,
  confirmText,
  children,
  variant = 'danger',
}: {
  action: () => Promise<void>;
  confirmText: string;
  children: React.ReactNode;
  variant?: 'danger' | 'secondary' | 'ghost';
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant={variant}
      disabled={pending}
      onClick={() => {
        if (window.confirm(confirmText)) startTransition(() => action());
      }}
    >
      {pending ? 'Working…' : children}
    </Button>
  );
}
