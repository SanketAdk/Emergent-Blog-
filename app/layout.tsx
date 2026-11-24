import type { Metadata } from 'next';
import './globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'Emergent Thoughts',
  description: 'Essays on ideas that emerge from curiosity',
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
