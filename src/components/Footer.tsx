import Link from "next/link";
import { site } from "@/lib/site";

const links = [
  { href: site.social.github, label: "github" },
  { href: site.social.linkedin, label: "linkedin" },
  { href: site.social.twitter, label: "twitter" },
  { href: site.social.devto, label: "dev.to" },
  { href: site.social.email, label: "email" },
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="font-mono text-xs text-muted">
          <p>
            <span className="text-accent">$</span> echo &quot;
            {site.name} · {new Date().getFullYear()}&quot;
          </p>
          <p className="mt-1">
            Built with Next.js · deployed on GitHub Pages ·{" "}
            <Link
              href="/feed.xml"
              className="cursor-pointer underline hover:text-accent"
            >
              rss
            </Link>
          </p>
        </div>

        <ul className="flex flex-wrap gap-x-1 gap-y-2">
          {links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                target={l.href.startsWith("http") ? "_blank" : undefined}
                rel={l.href.startsWith("http") ? "noreferrer" : undefined}
                className="inline-flex h-11 cursor-pointer items-center px-2 font-mono text-xs text-muted transition-colors duration-150 hover:text-accent"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
