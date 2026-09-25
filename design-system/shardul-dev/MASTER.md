# shardul.dev — Design System (Master)

Source of truth for the visual system. Implemented as tokens in
`src/app/globals.css` under `@theme`; this file records the decisions and
where they came from.

Generated with the `ui-ux-pro-max` skill (v2.13.0). Where the automatic
`--design-system` pick did not fit the brief, the verified domain search that
replaced it is noted.

## Direction

Dark technical / terminal, for an infrastructure engineering audience.
Brutalist-leaning: 0px radii, visible 1px borders, a faint blueprint grid,
monospace for structure and a humanist sans for long-form reading.

## Color — `colors.csv` → "API Developer Portal"

Terminal dark with a syntax green accent.

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#020617` | page background |
| `--color-surface` | `#0E1223` | cards, panels |
| `--color-elevated` | `#1A1E2F` | inline code, table headers, hover |
| `--color-fg` | `#F8FAFC` | primary text |
| `--color-muted` | `#94A3B8` | secondary text, metadata |
| `--color-line` | `#334155` | structural borders |
| `--color-line-soft` | `#1E293B` | subdivisions inside a panel |
| `--color-accent` | `#22C55E` | links, CTA, active nav, markers |
| `--color-accent-dim` | `#16A34A` | accent hover |
| `--color-on-accent` | `#020617` | text on accent fill |

Contrast against `--color-bg`: fg 19:1, muted 7.9:1, accent 8.9:1 — all pass
WCAG AA for body text, accent passes AAA.

Body copy inside articles uses `#DBE3EE` rather than pure `--color-fg` to take
the edge off long reading passages; still 15:1.

## Typography — `typography.csv` → "Developer Mono"

JetBrains Mono (headings, nav, metadata, code) + IBM Plex Sans (body).
Loaded via `next/font/google`, self-hosted at build time.

> The `--design-system` run returned "Caveat / Quicksand" (handwritten,
> personal-blog mood). Rejected as wrong for a technical audience and replaced
> with a verified `--domain typography` search for `monospace technical
> developer code`.

- Body: 16px / 1.6
- Article body: 17px / 1.75, measure capped at `72ch` (`ux-guidelines`
  Typography → Line Length: 65–75 characters)
- Headings: mono, 700, `-0.02em` tracking
- `h2` carries a top rule — the section divider does the work a larger type
  jump would otherwise do

## Layout

- Container `max-w-5xl` (64rem), 20px side gutter
- Article: `72ch` measure with a sticky 14rem TOC from `lg:` up
- Panels are `grid gap-px` over a `bg-line-soft` parent, so the gap itself
  draws the 1px rule

## Effects & motion

Motion dial 4/10 (Standard), applied sparingly: 150–200ms `transition-colors`
on interactive elements only. No scroll choreography — the automatic pattern
pick ("Scroll-Triggered Storytelling") was rejected as wrong for a reading
site. `prefers-reduced-motion` collapses all transitions in `globals.css`.

## Non-negotiables

- 44×44px minimum hit target on every control (nav links, footer links, and
  menu button are all `h-11`/`size-11`)
- Visible focus ring: 2px `--color-accent`, 3px offset, never removed
- `cursor-pointer` on everything clickable
- SVG icons only, no emoji
- No horizontal page scroll at 375px; wide code blocks and tables scroll
  inside their own container

## Anti-patterns

Corporate template layouts, generic card grids, gray-on-gray text, rounded
corners, drop shadows standing in for structure.
