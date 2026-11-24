import type { Metadata } from 'next';
import './globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { env } from "@/lib/env";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: { default: 'Emergent Thoughts', template: '%s · Emergent Thoughts' },
  description: 'Essays on ideas that emerge from curiosity',
  openGraph: { siteName: 'Emergent Thoughts', type: 'website', locale: 'en_US' },
  alternates: { types: { 'application/rss+xml': '/rss.xml' } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
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
