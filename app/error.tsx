'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen grid place-items-center px-8 text-center">
      <div>
        <h1 className="text-3xl font-light mb-4">Something went wrong</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Please try again in a moment.{error.digest && <> (Reference: {error.digest})</>}
        </p>
        <button type="button" onClick={reset} className="underline underline-offset-4">
          Try again
        </button>
      </div>
    </main>
  );
}
