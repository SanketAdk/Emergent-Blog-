import { env } from '@/lib/env';
import { getPublishedPosts } from '@/lib/queries';

export const revalidate = 3600;

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export async function GET() {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  const posts = await getPublishedPosts();
  const items = posts
    .map(
      (p) => `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${base}/posts/${p.slug}</link>
      <guid isPermaLink="true">${base}/posts/${p.slug}</guid>
      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
      <description>${escapeXml(p.excerpt)}</description>${p.category ? `\n      <category>${escapeXml(p.category)}</category>` : ''}
    </item>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Emergent Thoughts</title>
    <link>${base}/</link>
    <description>Essays on ideas that emerge from curiosity</description>
    <language>en</language>
    <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
