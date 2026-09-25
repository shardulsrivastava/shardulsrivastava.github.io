import type { Metadata } from "next";
import Image from "next/image";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: site.bio,
  alternates: { canonical: "/about/" },
};

const elsewhere = [
  { label: "GitHub", href: site.social.github, handle: "@shardulsrivastava" },
  { label: "LinkedIn", href: site.social.linkedin, handle: "in/shardulsrivastava" },
  { label: "Twitter", href: site.social.twitter, handle: "@shardulsrvstv" },
  { label: "Dev.to", href: site.social.devto, handle: "@shardulsrivastava" },
  { label: "Email", href: site.social.email, handle: "shardul.srivastava007@gmail.com" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <header className="border-b border-line pb-8">
        <p className="font-mono text-sm text-accent">
          <span className="text-muted">$</span> cat about.md
        </p>
        <h1 className="mt-4 font-mono text-3xl font-bold tracking-tighter text-fg sm:text-4xl">
          About me
        </h1>
      </header>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="prose-terminal">
          <Image
            src="/assets/images/shardul-portrait.jpg"
            alt="Shardul Srivastava"
            width={512}
            height={512}
            priority
            className="!mt-0 w-48 border border-line"
            sizes="192px"
          />
          <p>{site.bio}</p>
          <p>
            Most of what I publish here starts as an incident, a migration, or a
            design review that went sideways — EKS IAM and authentication,
            autoscaling with Karpenter, canary rollouts with Istio, Spark and
            Kafka on containers. If a post saved you an afternoon, that was the
            point.
          </p>
          <p>
            Most articles are cross-posted to{" "}
            <a href={site.social.devto} target="_blank" rel="noreferrer">
              Dev.to
            </a>
            . The code that goes with them lives on{" "}
            <a href={site.social.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
            .
          </p>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Elsewhere
          </h2>
          <ul className="mt-4 border-t border-line-soft">
            {elsewhere.map((l) => (
              <li key={l.label} className="border-b border-line-soft">
                <a
                  href={l.href}
                  target={l.href.startsWith("http") ? "_blank" : undefined}
                  rel={l.href.startsWith("http") ? "noreferrer" : undefined}
                  className="group flex min-h-11 cursor-pointer flex-col justify-center py-2.5"
                >
                  <span className="font-mono text-sm text-fg group-hover:text-accent">
                    {l.label}
                  </span>
                  <span className="break-all font-mono text-xs text-muted">
                    {l.handle}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
