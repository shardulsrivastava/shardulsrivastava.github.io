import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PostCard from "@/components/PostCard";
import { getPosts, getTags } from "@/lib/posts";

type Params = { params: Promise<{ tag: string }> };

export function generateStaticParams() {
  return getTags().map(({ tag }) => ({ tag }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { tag } = await params;
  return {
    title: `#${tag}`,
    description: `Posts tagged ${tag} on shardul.dev.`,
    alternates: { canonical: `/tags/${tag}/` },
  };
}

export default async function TagPage({ params }: Params) {
  const { tag } = await params;
  const posts = getPosts().filter((p) => p.tags.includes(tag));
  if (posts.length === 0) notFound();

  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <header className="border-b border-line pb-8">
        <Link
          href="/tags/"
          className="cursor-pointer font-mono text-xs text-muted hover:text-accent"
        >
          ← all topics
        </Link>
        <h1 className="mt-4 font-mono text-3xl font-bold tracking-tighter text-fg sm:text-4xl">
          <span className="text-line">#</span>
          {tag}
        </h1>
        <p className="mt-3 font-mono text-sm text-muted">
          {posts.length} {posts.length === 1 ? "post" : "posts"}
        </p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
