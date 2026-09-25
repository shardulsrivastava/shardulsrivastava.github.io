import type { MetadataRoute } from "next";
import { getPosts, getTags } from "@/lib/posts";
import { site } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getPosts();
  return [
    { url: `${site.url}/`, priority: 1 },
    { url: `${site.url}/blog/`, priority: 0.9 },
    { url: `${site.url}/about/`, priority: 0.6 },
    { url: `${site.url}/tags/`, priority: 0.5 },
    ...posts.map((p) => ({
      url: `${site.url}/${p.slug}/`,
      lastModified: new Date(p.date + "T00:00:00Z"),
      priority: 0.8,
    })),
    ...getTags().map(({ tag }) => ({
      url: `${site.url}/tags/${tag}/`,
      priority: 0.4,
    })),
  ];
}
