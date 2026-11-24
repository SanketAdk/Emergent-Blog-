'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';

/*
 * The inline script in app/layout.tsx sets the `dark` class on <html> before
 * first paint. This component only *reads* that class (and reacts to changes),
 * so there is a single source of truth and no empty placeholder or layout shift.
 */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
}

const getSnapshot = () => document.documentElement.classList.contains('dark');
const getServerSnapshot = () => false;

export default function Navigation() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleTheme = () => {
    const next = !isDark;
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {
      // Storage can be unavailable (private mode, blocked cookies); the toggle still works for this visit.
    }
  };

  return (
    <nav className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-black sticky top-0 z-50 transition-colors">
      <div className="max-w-2xl mx-auto px-8 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-semibold text-black dark:text-white hover:opacity-70 transition-opacity">
          Emergent Thoughts
        </Link>

        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 hover:opacity-70 transition-opacity text-black dark:text-white"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </nav>
  );
}
