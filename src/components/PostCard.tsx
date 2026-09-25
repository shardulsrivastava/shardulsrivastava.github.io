import Link from "next/link";
import { formatDate, type Post } from "@/lib/posts";

export default function PostCard({ post }: { post: Post }) {
  return (
    <article className="group border border-line-soft bg-surface transition-colors duration-200 hover:border-accent">
      <Link href={`/${post.slug}/`} className="block cursor-pointer p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span aria-hidden="true" className="text-line">
            /
          </span>
          <span>{post.readingMinutes} min read</span>
        </div>

        <h3 className="mt-3 font-mono text-lg font-bold leading-snug tracking-tight text-fg transition-colors duration-200 group-hover:text-accent sm:text-xl">
          {post.title}
        </h3>

        <p className="mt-2 line-clamp-3 text-[0.9375rem] leading-relaxed text-muted">
          {post.description}
        </p>

        <ul className="mt-4 flex flex-wrap gap-2">
          {post.tags.slice(0, 4).map((tag) => (
            <li
              key={tag}
              className="whitespace-nowrap border border-line-soft px-2 py-0.5 font-mono text-[0.6875rem] text-muted"
            >
              {tag}
            </li>
          ))}
        </ul>
      </Link>
    </article>
  );
}
