/** Only allow redirects back into the Studio (prevents open redirects via ?next=). */
export function safeStudioPath(next: unknown): string {
  if (typeof next !== 'string') return '/studio';
  if (!next.startsWith('/studio') || next.startsWith('//') || next.includes('\\')) return '/studio';
  if (next.startsWith('/studio/login')) return '/studio';
  return next;
}
