import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Emergent Thoughts',
  description: 'Essays on ideas that emerge from curiosity',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            try {
              const saved = localStorage.getItem('theme');
              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              const isDark = saved ? saved === 'dark' : prefersDark;
              if (isDark) document.documentElement.classList.add('dark');
            } catch (e) {}
          `,
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
