# shardul.dev

Personal site and blog. Next.js (App Router, static export) deployed to GitHub Pages.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build   # static site written to ./out
```

## Writing a post

Add a Markdown file to `content/posts/<slug>.md`. The filename is the URL
(`https://shardul.dev/<slug>/`).

```yaml
---
title: Post title
date: 2026-01-30
description: One-line summary used for SEO and cards.
image: /assets/images/cover.png
tags: [eks, kubernetes]
categories: [eks, kubernetes]
featured: false
canonicalUrl: https://dev.to/...   # optional, if cross-posted
---
```

## Deploy

Pushing to `master` runs `.github/workflows/deploy.yml`, which builds and
publishes `out/` to GitHub Pages. Pages source must be set to **GitHub Actions**
in repository settings.
