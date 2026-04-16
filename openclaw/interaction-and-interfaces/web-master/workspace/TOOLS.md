# TOOLS.md — Environment Notes

## Stack

- **Runtime:** Node.js 22+ / npm
- **Framework:** Astro 6 (SSR mode)
- **Adapter:** @astrojs/node (standalone)
- **Integrations:** @astrojs/mdx (MDX blog posts with components)
- **Database:** SQLite via better-sqlite3
- **Blog:** Astro Content Collections (Markdown and MDX, pattern `**/*.{md,mdx}`)
- **UI Components:** `src/components/ui/` — Text, Button, Card, Box, Stack, Link
- **Port:** 4321 (forwarded at `/app`)

## Project Location

The project lives at `workspace/projects/astro-app/`.

## Serving

- The app runs in **production mode** via `node dist/server/entry.mjs`
- `scripts.build` runs **once** — at initial deploy, to install deps and compile assets. It does **not** re-run on restart.
- `scripts.start` runs **on every boot** — at startup and again after every restart. This is what keeps the server alive.
- **After editing source files, rebuild AND restart the server for changes to go live:**
  ```bash
  cd workspace/projects/astro-app && npm run build && pkill -f 'node dist/server/entry.mjs' || true
  ```
  The platform auto-restarts the process via `scripts.start`. Then tell the user to refresh.
- **Building alone is NOT enough** — the server keeps the old build in memory until restarted.
- The route path is `/app` — Astro's `base` config must match this
- The server binds to `0.0.0.0:4321` via `HOST` and `PORT` env vars in the start script

## Port Forwarding

The container runs behind a reverse proxy. The `path` in `manifest.json` routes is **preserved** (not stripped) when forwarded. Requests arrive at the server as `/app/...`, which is why Astro's `base: '/app'` must match.

## Key Astro Notes

- `import.meta.env.BASE_URL` returns `/app` (no trailing slash). Always use `${base}/path` with an explicit `/`.
- View Transitions use `ClientRouter` from `astro:transitions` (not the old `ViewTransitions` name).
- CSRF: `checkOrigin: false` in `astro.config.mjs` because the reverse proxy changes the origin. Use `allowedDomains` for X-Forwarded-Host trust if needed.
- Dynamic routes (like `[slug].astro`) run as SSR — no `getStaticPaths()` needed.
- Scoped styles: use `:global()` to target child component elements from a parent.

## Database

- SQLite file lives at `workspace/projects/astro-app/data/database.db`
- Auto-created on first API request (the `data/` dir is created if missing)
- The `data/` folder should be on a persistent volume so data survives pod restarts
- WAL mode is enabled for better concurrent read performance
- Add new tables in `getDb()` with `CREATE TABLE IF NOT EXISTS`

## Blog Content

- Posts are `.md` or `.mdx` files in `src/content/blog/`
- Each post needs frontmatter: `title`, `description`, `pubDate`, and optionally `author`
- `.mdx` posts can import and use Astro components (UI library, custom demos, etc.)
- After adding a post, rebuild to make it live
- Posts render at `/app/blog/<filename-without-extension>`

## Layouts

Three layout options in `src/layouts/`, all sharing the same design system via `src/styles/global.css` and `src/components/BaseHead.astro`:

- **Layout.astro** — Top nav with sticky blur. The default. Good for landing pages, blogs, general sites.
- **SidebarLayout.astro** — Fixed sidebar on the left (240px) with vertical nav. Collapses to top bar on mobile. Good for dashboards, docs, portfolios, admin panels.
- **MinimalLayout.astro** — No persistent nav. Small floating brand + "Menu" button. Full-screen overlay with large nav links. Ultra-clean, content-first. Good for portfolios, creative sites, single-page designs.

All accept `title`, `description`, `fullWidth`, `brand`, and `links` props. Pick the layout that fits the project, or create a new one using BaseHead + global.css.

## Templates

Pre-built page templates in `src/pages/template/` — use these as starting points when building a user's site:

- **starter** — SaaS landing page (Layout). Hero with gradient, 6 feature cards, stats bar, waitlist CTA.
- **portfolio** — Creative portfolio (SidebarLayout). Sidebar nav, project grid with colored thumbs, about, contact. Coral accent.
- **studio** — Design agency (MinimalLayout). Huge editorial typography, overlay menu, numbered service blocks. Blue accent.
- **waitlist** — Pre-launch page (custom layout). Dark-mode, gradient aura blobs, scrolling feed, marquee, cascading cards, animated grid. Orange-red accent.

Each template demonstrates a different layout, color palette, and design approach. When starting a new project, pick the closest template, study its code, and transform it.

## Design System

The site uses a dark-first design with Google Fonts and CSS variables defined in `Layout.astro`:

**Typography:** `--display` (Syne), `--sans` (DM Sans), `--mono` (JetBrains Mono)
**Colors:** `--text`, `--text-muted`, `--bg`, `--surface`, `--surface-hover`, `--border`, `--accent`, `--accent-hover`, `--accent-glow`
**Layout:** `--max-w` (960px), `--radius` (10px)
**Theme:** Light/dark via `prefers-color-scheme`. Use `color-mix()` for transparent variations.

The Layout accepts a `fullWidth` prop — when true, `<main>` has no max-width constraint so sections can go full-bleed with their own inner containers.

Global animation keyframes `fade-up` and `fade-in` are available for staggered reveals.

## UI Component Library

Composable components in `src/components/ui/`:
- **Text** — `variant`: title, subtitle, copy, caption, link, muted. `as`: override HTML tag. Titles use `--display` font.
- **Button** — `variant`: primary, secondary. Hover glow on primary, border change on secondary.
- **Card** — Surface container with hover lift and border glow. `padding` prop.
- **Box** — Simple padding wrapper. `padding` prop.
- **Stack** — Flex layout. `direction`, `gap`, `align` props.
- **Link** — Unstyled anchor, composable with Text for styled links.

All components use the CSS variables above. Changing `--accent` and `--display` transforms the entire look.
