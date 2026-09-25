import Link from "next/link";
import PostCard from "@/components/PostCard";
import { getPosts, getTags, formatDate } from "@/lib/posts";
import { site } from "@/lib/site";

const focus = [
  {
    k: "kubernetes",
    v: "EKS at scale — IAM, auth, autoscaling with Karpenter, service mesh with Istio.",
  },
  {
    k: "platform",
    v: "Multi-cloud infrastructure, GitOps, and the paved roads teams actually want to use.",
  },
  {
    k: "data",
    v: "Spark, Kafka and streaming pipelines running on containers instead of pet clusters.",
  },
  {
    k: "leadership",
    v: "Building and growing engineering teams around infrastructure and reliability.",
  },
];

export default function Home() {
  const posts = getPosts();
  const featured = posts.filter((p) => p.featured).slice(0, 4);
  const recent = posts.slice(0, 6);
  const tags = getTags().slice(0, 12);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-5xl px-5 py-20 sm:py-28">
          <p className="font-mono text-sm text-accent">
            <span className="text-muted">$</span> whoami
          </p>

          <h1 className="mt-5 font-mono text-4xl font-bold leading-[1.1] tracking-tighter text-fg sm:text-6xl">
            {site.name}
          </h1>

          <p className="mt-4 font-mono text-sm text-muted sm:text-base">
            {site.role}
          </p>

          <p className="mt-7 max-w-[62ch] text-lg leading-relaxed text-[#dbe3ee]">
            {site.bio}
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/blog/"
              className="inline-flex h-12 cursor-pointer items-center border border-accent bg-accent px-6 font-mono text-sm font-medium text-on-accent transition-colors duration-150 hover:bg-accent-dim hover:border-accent-dim"
            >
              Read the writing
            </Link>
            <a
              href={site.social.github}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 cursor-pointer items-center border border-line px-6 font-mono text-sm text-fg transition-colors duration-150 hover:border-accent hover:text-accent"
            >
              GitHub
            </a>
          </div>

          <dl className="mt-14 grid gap-px border border-line-soft bg-line-soft sm:grid-cols-2">
            {focus.map((f) => (
              <div key={f.k} className="bg-surface p-5">
                <dt className="font-mono text-xs text-accent">
                  <span className="text-line">#</span> {f.k}
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted">
                  {f.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="border-b border-line">
          <div className="mx-auto max-w-5xl px-5 py-16">
            <h2 className="font-mono text-sm uppercase tracking-[0.2em] text-muted">
              Featured deep dives
            </h2>
            <ol className="mt-8 border-t border-line-soft">
              {featured.map((post, i) => (
                <li key={post.slug} className="border-b border-line-soft">
                  <Link
                    href={`/${post.slug}/`}
                    className="group flex cursor-pointer flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:gap-6"
                  >
                    <span
                      aria-hidden="true"
                      className="font-mono text-xs text-line sm:w-8"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 font-mono text-base font-medium text-fg transition-colors duration-150 group-hover:text-accent sm:text-lg">
                      {post.title}
                    </span>
                    <time
                      dateTime={post.date}
                      className="font-mono text-xs text-muted"
                    >
                      {formatDate(post.date)}
                    </time>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* Recent */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-mono text-sm uppercase tracking-[0.2em] text-muted">
            Latest posts
          </h2>
          <Link
            href="/blog/"
            className="cursor-pointer font-mono text-sm text-accent underline-offset-4 hover:underline"
          >
            all {posts.length} →
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {recent.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-2">
          <span className="mr-1 font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Topics
          </span>
          {tags.map(({ tag, count }) => (
            <Link
              key={tag}
              href={`/tags/${tag}/`}
              className="cursor-pointer border border-line-soft px-2.5 py-1 font-mono text-xs text-muted transition-colors duration-150 hover:border-accent hover:text-accent"
            >
              {tag}
              <span className="ml-1.5 text-line">{count}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
