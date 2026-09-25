import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  formatDate,
  getHeadings,
  getPost,
  getPosts,
  renderMarkdown,
} from "@/lib/posts";
import { site } from "@/lib/site";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: post.canonicalUrl ?? `/${post.slug}/` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      url: `${site.url}/${post.slug}/`,
      images: post.image ? [post.image] : undefined,
    },
  };
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const html = await renderMarkdown(post.body);
  const headings = getHeadings(post.body);
  const all = getPosts();
  const index = all.findIndex((p) => p.slug === post.slug);
  const newer = all[index - 1];
  const older = all[index + 1];

  return (
    <article className="mx-auto max-w-5xl px-5 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.description,
            datePublished: post.date,
            author: { "@type": "Person", name: site.name, url: site.url },
            mainEntityOfPage: `${site.url}/${post.slug}/`,
          }),
        }}
      />

      <nav aria-label="Breadcrumb" className="font-mono text-xs text-muted">
        <Link href="/blog/" className="cursor-pointer hover:text-accent">
          writing
        </Link>
        <span className="mx-2 text-line" aria-hidden="true">
          /
        </span>
        <span className="text-fg">{post.slug}</span>
      </nav>

      <header className="mt-6 border-b border-line pb-8">
        <h1 className="font-mono text-3xl font-bold leading-[1.15] tracking-tighter text-fg sm:text-[2.75rem]">
          {post.title}
        </h1>

        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs text-muted">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span aria-hidden="true" className="text-line">
            /
          </span>
          <span>{post.readingMinutes} min read</span>
          {post.canonicalUrl && (
            <>
              <span aria-hidden="true" className="text-line">
                /
              </span>
              <a
                href={post.canonicalUrl}
                target="_blank"
                rel="noreferrer canonical"
                className="cursor-pointer underline hover:text-accent"
              >
                also on dev.to
              </a>
            </>
          )}
        </div>

        <ul className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <li key={tag}>
              <Link
                href={`/tags/${tag}/`}
                className="inline-block cursor-pointer border border-line-soft px-2 py-0.5 font-mono text-[0.6875rem] text-muted transition-colors duration-150 hover:border-accent hover:text-accent"
              >
                {tag}
              </Link>
            </li>
          ))}
        </ul>
      </header>

      <div className="lg:flex lg:gap-12">
        <div
          className="prose-terminal mt-10 min-w-0 flex-1"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {headings.length > 2 && (
          <aside className="order-first mt-10 hidden w-56 shrink-0 lg:block">
            <nav aria-label="On this page" className="sticky top-24">
              <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted">
                On this page
              </p>
              <ul className="mt-3 space-y-1.5 border-l border-line-soft">
                {headings.map((h, i) => (
                  <li
                    key={`${h.id}-${i}`}
                    style={{ paddingLeft: h.depth === 3 ? "1.5rem" : "0.75rem" }}
                  >
                    <a
                      href={`#${h.id}`}
                      className="block cursor-pointer py-0.5 text-[0.8125rem] leading-snug text-muted transition-colors duration-150 hover:text-accent"
                    >
                      {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        )}
      </div>

      <nav
        aria-label="More posts"
        className="mt-20 grid gap-px border border-line-soft bg-line-soft sm:grid-cols-2"
      >
        {[
          { post: older, label: "← Older" },
          { post: newer, label: "Newer →" },
        ].map(
          ({ post: p, label }) =>
            p && (
              <Link
                key={p.slug}
                href={`/${p.slug}/`}
                className="group cursor-pointer bg-surface p-5 transition-colors duration-150 hover:bg-elevated"
              >
                <span className="font-mono text-xs text-muted">{label}</span>
                <span className="mt-2 block font-mono text-sm font-medium text-fg group-hover:text-accent">
                  {p.title}
                </span>
              </Link>
            ),
        )}
      </nav>
    </article>
  );
}
