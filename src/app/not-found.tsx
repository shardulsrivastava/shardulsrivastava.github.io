import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-start px-5 py-32">
      <p className="font-mono text-sm text-muted">
        <span className="text-accent">$</span> curl -I {"$REQUEST_URI"}
      </p>
      <h1 className="mt-6 font-mono text-5xl font-bold tracking-tighter text-fg sm:text-7xl">
        404
      </h1>
      <p className="mt-4 max-w-[50ch] text-muted">
        That page isn&apos;t here. It may have moved, or it never existed.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-flex h-12 cursor-pointer items-center border border-accent bg-accent px-6 font-mono text-sm font-medium text-on-accent transition-colors duration-150 hover:border-accent-dim hover:bg-accent-dim"
        >
          Home
        </Link>
        <Link
          href="/blog/"
          className="inline-flex h-12 cursor-pointer items-center border border-line px-6 font-mono text-sm text-fg transition-colors duration-150 hover:border-accent hover:text-accent"
        >
          All posts
        </Link>
      </div>
    </div>
  );
}
