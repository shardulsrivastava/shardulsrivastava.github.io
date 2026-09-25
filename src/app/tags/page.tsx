import type { Metadata } from "next";
import Link from "next/link";
import { getTags } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Topics",
  description: "Every topic covered on shardul.dev, by post count.",
  alternates: { canonical: "/tags/" },
};

export default function TagsPage() {
  const tags = getTags();

  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <header className="border-b border-line pb-8">
        <p className="font-mono text-sm text-accent">
          <span className="text-muted">$</span> grep -rho &apos;tags&apos; .
          | sort | uniq -c
        </p>
        <h1 className="mt-4 font-mono text-3xl font-bold tracking-tighter text-fg sm:text-4xl">
          Topics
        </h1>
      </header>

      <ul className="mt-8 grid gap-px border border-line-soft bg-line-soft sm:grid-cols-2 lg:grid-cols-3">
        {tags.map(({ tag, count }) => (
          <li key={tag}>
            <Link
              href={`/tags/${tag}/`}
              className="flex cursor-pointer items-center justify-between bg-surface px-4 py-3 font-mono text-sm text-fg transition-colors duration-150 hover:bg-elevated hover:text-accent"
            >
              <span>
                <span className="text-line">#</span> {tag}
              </span>
              <span className="text-xs text-muted">{count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
