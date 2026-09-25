import { getPosts } from "@/lib/posts";
import { site } from "@/lib/site";

export const dynamic = "force-static";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function GET() {
  const items = getPosts()
    .map(
      (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${site.url}/${p.slug}/</link>
      <guid isPermaLink="true">${site.url}/${p.slug}/</guid>
      <description>${esc(p.description)}</description>
      <pubDate>${new Date(p.date + "T00:00:00Z").toUTCString()}</pubDate>
${p.tags.map((t) => `      <category>${esc(t)}</category>`).join("\n")}
    </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(site.title)}</title>
    <link>${site.url}/</link>
    <description>${esc(site.description)}</description>
    <language>en</language>
    <atom:link href="${site.url}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
