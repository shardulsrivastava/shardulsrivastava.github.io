import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings, {
  type Options as AutolinkOptions,
} from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

export type Post = {
  slug: string;
  title: string;
  date: string;
  description: string;
  image: string;
  tags: string[];
  categories: string[];
  featured: boolean;
  canonicalUrl?: string;
  body: string;
  readingMinutes: number;
};

export type Heading = { depth: number; text: string; id: string };

function toPost(file: string): Post {
  const slug = file.replace(/\.md$/, "");
  const { data, content } = matter(
    fs.readFileSync(path.join(POSTS_DIR, file), "utf-8"),
  );
  const words = content.trim().split(/\s+/).length;
  return {
    slug,
    title: String(data.title ?? slug),
    date: String(data.date),
    description: String(data.description ?? ""),
    image: String(data.image ?? ""),
    tags: (data.tags ?? []) as string[],
    categories: (data.categories ?? []) as string[],
    featured: Boolean(data.featured),
    canonicalUrl: data.canonicalUrl ? String(data.canonicalUrl) : undefined,
    body: content,
    readingMinutes: Math.max(1, Math.round(words / 220)),
  };
}

export function getPosts(): Post[] {
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map(toPost)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(slug: string): Post | undefined {
  return getPosts().find((p) => p.slug === slug);
}

export function getTags(): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const post of getPosts())
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function getHeadings(body: string): Heading[] {
  return body
    .split("\n")
    .filter((line) => /^#{2,3}\s/.test(line))
    .map((line) => {
      const depth = line.match(/^#+/)![0].length;
      const text = line.replace(/^#+\s*/, "").replace(/[`*_]/g, "").trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      return { depth, text, id };
    });
}

const autolinkOptions: AutolinkOptions = {
  behavior: "wrap",
  properties: { className: ["heading-anchor"] },
};

export async function renderMarkdown(body: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, autolinkOptions)
    .use(rehypePrettyCode, {
      theme: "github-dark-default",
      keepBackground: false,
    })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(body);
  return String(file);
}

export function formatDate(date: string): string {
  return new Date(date + "T00:00:00Z").toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
