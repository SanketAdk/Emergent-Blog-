import { z } from 'zod';

/**
 * Public environment variables (safe for the browser).
 * Each variable must be referenced as a literal `process.env.NEXT_PUBLIC_*`
 * so Next.js can inline it into the client bundle.
 * Validation fails fast with a clear message instead of an obscure runtime error.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({ message: 'NEXT_PUBLIC_SUPABASE_URL must be a valid URL' }),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(20, 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing or too short'),
  NEXT_PUBLIC_SITE_URL: z.url().default('http://localhost:3000'),
});

const parsed = publicSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

if (!parsed.success) {
  throw new Error(
    `Invalid environment variables. Copy .env.example to .env.local and fill it in.\n${z.prettifyError(parsed.error)}`,
  );
}

export const env = parsed.data;
