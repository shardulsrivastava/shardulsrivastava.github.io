import type { Metadata } from "next";
import PostCard from "@/components/PostCard";
import { getPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Writing",
  description:
    "Deep dives on Kubernetes, EKS, Istio, Karpenter, Spark, Kafka and the platform engineering underneath.",
  alternates: { canonical: "/blog/" },
};

export default function BlogIndex() {
  const posts = getPosts();
  const byYear = new Map<string, typeof posts>();
  for (const post of posts) {
    const year = post.date.slice(0, 4);
    byYear.set(year, [...(byYear.get(year) ?? []), post]);
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <header className="border-b border-line pb-8">
        <p className="font-mono text-sm text-accent">
          <span className="text-muted">$</span> ls -lt ./writing
        </p>
        <h1 className="mt-4 font-mono text-3xl font-bold tracking-tighter text-fg sm:text-4xl">
          Writing
        </h1>
        <p className="mt-3 max-w-[62ch] text-muted">
          {posts.length} posts on Kubernetes, AWS, service meshes and data
          infrastructure — mostly the things that cost me a weekend to work out.
        </p>
      </header>

      {[...byYear.entries()].map(([year, yearPosts]) => (
        <section key={year} className="mt-12">
          <h2 className="font-mono text-sm uppercase tracking-[0.2em] text-muted">
            {year}
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {yearPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
