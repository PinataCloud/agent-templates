# TOOLS.md — Environment Notes

Your cheat sheet for this specific project. Skills/conventions are elsewhere — this is the "how things work here" file.

## Stack

- **Runtime:** Node.js 22+ / npm
- **Framework:** Astro 6 (SSR mode), `base: '/app'`
- **Adapter:** `@astrojs/node` (standalone)
- **Integrations:** `@astrojs/mdx`
- **Database:** SQLite via `better-sqlite3` (`data/database.db`, WAL mode)
- **Blog:** Astro Content Collections (`.md` + `.mdx`, pattern `**/*.{md,mdx}`)
- **UI:** `src/components/ui/` — Text, Button, Card, Box, Stack, Link
- **Port:** 4321 (forwarded at `/app`)

## Project Location

`workspace/projects/astro-app/`

## Serving & Deploying Changes

The app runs in **production mode** via `node dist/server/entry.mjs`.

- `scripts.build` runs **once** at initial deploy.
- `scripts.start` runs **on every boot** and after every restart.
- **After editing source, rebuild AND restart:**
  ```bash
  cd workspace/projects/astro-app && npm run build && pkill -f 'node dist/server/entry.mjs' || true
  ```
  The platform auto-restarts via `scripts.start`. Then tell the user to refresh.
- **Building alone is NOT enough** — the server keeps the old build in memory until restarted.
- Server binds to `0.0.0.0:4321` via `HOST` and `PORT` env vars.

## Port Forwarding

The container runs behind a reverse proxy. The `path` in `manifest.json` routes is **preserved** (not stripped). Requests arrive as `/app/...`, so Astro's `base: '/app'` must match.

## Key Astro Notes

- `import.meta.env.BASE_URL` returns `/app` (no trailing slash). Always use `${base}/path`.
- View Transitions use `ClientRouter` from `astro:transitions`.
- CSRF: `checkOrigin: false` in `astro.config.mjs` because the proxy changes origin. Use `allowedDomains` for X-Forwarded-Host trust.
- Dynamic routes (`[slug].astro`) run SSR — no `getStaticPaths()` needed.
- Scoped styles: use `:global()` to target child component elements.
- Prefetching: add `data-astro-prefetch="hover"` on links for SPA-fast SSR.

## Database

- SQLite file: `data/database.db` (auto-created on first API call)
- `data/` should live on a persistent volume so data survives pod restarts.
- WAL mode is on. Add tables in `getDb()` with `CREATE TABLE IF NOT EXISTS`.

## Layouts

Three layouts in `src/layouts/`, all share the design system via `src/styles/global.css` and `src/components/BaseHead.astro`:

- **Layout.astro** — top nav, sticky blur. Default. Landing pages, blogs, general sites.
- **SidebarLayout.astro** — fixed 240px sidebar, collapses on mobile. Dashboards, docs, portfolios, admin.
- **MinimalLayout.astro** — floating brand + full-screen overlay menu. Portfolios, creative sites, single-page designs.

All accept `title`, `description`, `fullWidth`, `brand`, `links`. Or create a new layout using `BaseHead` + `global.css`.

## Page Templates

Pre-built starting points in `src/pages/template/`:

- **starter** — SaaS landing (Layout). Hero, 6 feature cards, stats bar, waitlist CTA.
- **portfolio** — creative portfolio (SidebarLayout). Project grid, about, contact.
- **studio** — design agency (MinimalLayout). Huge editorial type, numbered services.
- **waitlist** — pre-launch (custom layout). Dark, gradient auras, scrolling feed, marquee.

## Design System

Dark-first, CSS variables in `src/styles/global.css`:

- **Typography:** `--display`, `--sans`, `--mono`
- **Colors:** `--text`, `--text-muted`, `--bg`, `--surface`, `--surface-hover`, `--border`, `--accent`, `--accent-hover`, `--accent-glow`
- **Layout:** `--max-w`, `--radius`
- **Theme:** light/dark via `prefers-color-scheme`. Use `color-mix()` for transparent variants.

Global keyframes `fade-up` and `fade-in` are available for staggered reveals.

## UI Component Library

Composable in `src/components/ui/`:

- **Text** — `variant`: title, subtitle, copy, caption, link, muted. `as` for tag override.
- **Button** — `variant`: primary, secondary.
- **Card** — surface container with hover lift + border glow. `padding` prop.
- **Box** — simple padding wrapper.
- **Stack** — flex layout: `direction`, `gap`, `align`.
- **Link** — unstyled anchor, composable with Text.

Changing `--accent` and `--display` transforms the entire look.

---

# Workflows

## Onboarding the User

Before building, gather context. Don't interrogate — let it flow.

- **What's the site for?** Business, portfolio, blog, product, community.
- **Existing website?** Ask for the URL. Pull their colors, structure, tone. Build something close but cleaner.
- **Design system?** Ship is Framer by default (`designs/framer/DESIGN.md`). Offer the 60+ brand designs at https://github.com/VoltAgent/awesome-design-md — Stripe, Vercel, Linear, Apple, Nike, Notion, etc.
- **Brand colors?** Pull from their site or tweak the DESIGN.md palette.
- **Photos?** Ask. Sites without images look empty. Guide them on naming + `/public`.
- **Content?** What pages, listings, products, posts.

If they give you a reference site, **match it closely but improve it** — cleaner layout, better typography, modern CSS. Don't reinvent their brand. If they give nothing, use the active DESIGN.md with placeholder content they can swap.

## Starting a New Site

1. **Back up the template code** for reference later:
   ```bash
   cp -r workspace/projects/astro-app/src workspace/projects/astro-app/src-original
   ```

2. **Apply a design system** — the first step, before any pages:
   - Framer is already applied to `global.css`.
   - For a different brand:
     ```bash
     cd workspace/projects/astro-app && npx getdesign@latest add <brand> --out ./designs/<brand>/DESIGN.md
     ```
   - Read the downloaded DESIGN.md, map tokens to CSS variables (see table below).
   - Update Google Fonts in `src/components/BaseHead.astro`.
   - DESIGN.md stays in `designs/` as a reference for component styles, spacing, shadows, radii.

3. **Pick a page template** from `src/pages/template/` — closest match to what the user needs.

4. **Study the template's code** — layout choice, section structure, CSS patterns.

5. **Transform the project:**
   - Replace `src/pages/index.astro` with the user's homepage, following the template's patterns.
   - Update layout brand + nav links.
   - Apply DESIGN.md component styles beyond just CSS variables (shadows, radii, button shapes, hover effects).
   - Delete `src/pages/template/` — user doesn't need the showcase.
   - Delete sample blog posts or replace with user content.
   - Update `src/content.config.ts` default author.

6. **Keep the infrastructure** — layouts, BaseHead, global.css, UI, db.ts, API routes. Tools, not examples.

`src-original/` is your reference if you need patterns or components you deleted.

## DESIGN.md → CSS Variable Mapping

When you download a DESIGN.md, map its tokens in `src/styles/global.css`. This is the **only** place colors/fonts live — never scatter raw hex through components.

| Project Variable | What to Extract | Example (Framer) |
|---|---|---|
| `--text` | Primary text / heading color | `#ffffff` |
| `--text-muted` | Secondary / body / caption | `#a6a6a6` |
| `--bg` | Page background | `#000000` |
| `--surface` | Card / elevated surface | `#090909` |
| `--surface-hover` | Surface hover state | `rgba(255,255,255,0.1)` |
| `--border` | Default border / divider | `rgba(255,255,255,0.08)` |
| `--accent` | Primary accent / CTA / link | `#0099ff` |
| `--accent-hover` | Accent hover (darken 10-15%) | `#007acc` |
| `--accent-glow` | Focus ring / glow (12-15% opacity) | `rgba(0,153,255,0.15)` |
| `--display` | Display / heading font | `'Space Grotesk', sans-serif` |
| `--sans` | Body / UI font | `'Inter', system-ui, sans-serif` |
| `--mono` | Monospace font | `'Azeret Mono', 'SF Mono', monospace` |
| `--max-w` | Max container width | `1200px` |
| `--radius` | Default border-radius | `12px` |

**How to read a DESIGN.md:**

1. **Color Palette & Roles** → Primary → `--text`, `--bg`, `--accent`. Surface/Border → `--surface`, `--border`. Hover variants: darken/lighten 10-15%.
2. **Typography Rules** → Display + Body font families. Search Google Fonts for the closest match if proprietary (GT Walsheim → Space Grotesk, sohne-var → Inter).
3. **Layout Principles** → max width → `--max-w`.
4. **Component Stylings** → default radius → `--radius`. Apply button shapes, shadows, hover patterns directly in component `<style>` blocks.
5. **Light mode** → if the DESIGN.md is dark-only, invert: white bg, dark text, same accent.

After `global.css`, update the Google Fonts `<link>` in `src/components/BaseHead.astro`.

## Design Standards

### Typography
Distinctive display + clean body. Google Fonts via `<link>` in `BaseHead.astro`. Avoid overused (Roboto, Arial) unless the DESIGN.md calls for them. Every project gets its own font personality via `--display` and `--sans`.

### Color
Commit to a cohesive palette. CSS variables always. Dominant color with sharp accents beats a timid, evenly-distributed palette. Use `color-mix()` for transparent variations. Define light and dark mode via `prefers-color-scheme`.

### Layout
Pick a layout that fits the project — don't default to top-nav for everything. Full-width hero with background images or gradient meshes. Pass `fullWidth` so sections can go full-bleed, then inner containers with `max-width: var(--max-w)`. CSS Grid for cards. 4-6rem padding.

### Images
Not optional. Heroes (backgrounds with overlays), cards, service/feature sections. If the user hasn't provided images, use colored placeholder blocks with the category name — not broken img tags. Reference `/public` images as `${base}/filename.jpg`.

### SEO & Metadata
Every page: `title`, `description`, `image` props to `BaseHead`. It generates Open Graph, Twitter Card, and canonical URL.

### Details That Matter
- Hover states on everything interactive — cards lift (`translateY(-4px)`), borders glow.
- Transitions on transform/color/box-shadow (0.15s–0.2s).
- Fade-up animations on page load with `animation-delay` stagger.
- Sticky nav with `backdrop-filter: blur()` + semi-transparent via `color-mix()`.
- `--radius` everywhere.
- Focus ring: `box-shadow: 0 0 0 3px var(--accent-glow)`.
- Badges/tags for categorization (uppercase, small, colored).
- `data-astro-prefetch="hover"` on links.

### What to Avoid
- Generic AI slop: purple gradients on white, Inter/Roboto everywhere, predictable layouts.
- Flat pages with no hierarchy — use alternating backgrounds, meshes, subtle patterns.
- Text-only sections with no imagery.
- Card grids with no hover effects.
- Hardcoded colors scattered through components.
- Timid, evenly-distributed palettes.

## Blog Posting

1. Create `.md` or `.mdx` in `src/content/blog/` with frontmatter: `title`, `description`, `pubDate`, `author` (optional).
2. `.mdx` can import and use Astro components.
3. Rebuild.
4. Post lives at `/app/blog/<filename>`.

## Waitlist

Check signups:
```bash
cd workspace/projects/astro-app && node -e "const db = require('better-sqlite3')('data/database.db'); console.log(db.prepare('SELECT COUNT(*) as count FROM waitlist').get());"
```

## Adding New Data Models

1. Add table in `src/lib/db.ts` inside `getDb()` with `CREATE TABLE IF NOT EXISTS`.
2. Seed data in a separate function called from `getDb()` (check row count first).
3. API routes in `src/pages/api/` for GET/POST.
4. Page routes for listing + detail views.
5. For image URLs stored in DB, use `/app/api/img/filename.jpg` (the SSR image route), not raw static paths (see Gotchas).

## Scheduled Tasks (openclaw crons / pinata tasks)

Same thing, two names. When the user has a database or collects form data, suggest setting one up. Define:

- **What to report:** counts, new entries since last run, field summaries
- **When:** cron expression (`0 9 * * *` = daily 9 AM)

Configured through the openclaw platform UI/API — tell the user the prompt + schedule you'd suggest, they add it through the platform. Tailor the prompt to their actual data.

## About `manifest.json`

**Read-only.** A snapshot of how the agent was deployed (routes, ports, scripts, initial tasks). The platform does not re-read it after boot — edits have **no effect**. Runtime config (crons, secrets, routes) goes through platform APIs. Until those exist, treat the manifest as immutable and route config requests through the platform UI.

You **can** read it to look up routes, port, and deploy scripts. Don't write.

## Known Gotchas

- **SQLite string literals:** single quotes in SQL (`WHERE status = 'active'`). Double quotes are column identifiers in SQLite → "no such column" errors.
- **Static files don't reach origin through the proxy:** files in `public/` build locally but the reverse proxy serves from CDN and blocks origin fallback. Any image not cached returns 404 externally. For user-uploaded images, use the `/api/img/[file].ts` SSR route (`/app/api/img/filename.jpg`). Stock images should use IPFS URLs.
- **Astro 6 Content Layer:** use `post.id`, not `post.slug`. The `slug` property doesn't exist in Astro 6 with the `glob()` loader.

---

# Authentication (optional)

**When to use this:** the user asks for a login, a password-protected page, admin-only reports, or any gated content. Public marketing sites don't need it — don't install proactively.

**What to use:** [Better Auth](https://better-auth.com/docs/integrations/astro). It's the current standard for Astro (Lucia was deprecated in 2025), TypeScript-first, plays with our existing SQLite DB, and has first-class Astro integration including middleware.

**What NOT to do:**
- Query param tokens (`?token=abc`). They leak via browser history, referrers, server logs, CDN logs.
- Tokens or secrets printed on the page. Ever.
- Rolling your own password hashing. Let Better Auth handle it (scrypt, timing-safe comparisons, HttpOnly/Secure/SameSite cookies).

## Install

```bash
cd workspace/projects/astro-app
npm install better-auth
```

Add to `.env` (and make sure `.env` is gitignored):

```
BETTER_AUTH_SECRET=<run: openssl rand -base64 32>
BETTER_AUTH_URL=<your agent's public URL>/app
```

## Wire It Up

**1. Create `src/lib/auth.ts`:**

```ts
import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import { join } from "path";

export const auth = betterAuth({
  database: new Database(join(process.cwd(), "data", "database.db")),
  emailAndPassword: { enabled: true },
  basePath: "/app/api/auth",
});
```

**2. Generate the auth tables:**

```bash
cd workspace/projects/astro-app && npx @better-auth/cli@latest migrate
```

This creates the `user`, `session`, `account`, `verification` tables in `data/database.db`. Re-run after upgrading Better Auth.

**3. Mount the catch-all API route at `src/pages/api/auth/[...all].ts`:**

```ts
import type { APIRoute } from "astro";
import { auth } from "../../../lib/auth";

export const ALL: APIRoute = async (ctx) => auth.handler(ctx.request);
```

**4. Middleware at `src/middleware.ts` — populates `Astro.locals` with user/session on every request:**

```ts
import { defineMiddleware } from "astro:middleware";
import { auth } from "./lib/auth";

export const onRequest = defineMiddleware(async (ctx, next) => {
  const result = await auth.api.getSession({ headers: ctx.request.headers });
  ctx.locals.user = result?.user ?? null;
  ctx.locals.session = result?.session ?? null;
  return next();
});
```

Add to `src/env.d.ts`:

```ts
declare namespace App {
  interface Locals {
    user: import("better-auth").User | null;
    session: import("better-auth").Session | null;
  }
}
```

**5. Gate a page — redirect anonymous visitors:**

```astro
---
if (!Astro.locals.user) return Astro.redirect("/app/login");
---
<h1>Secret report</h1>
```

**6. Client-side sign-in / sign-up:** create `src/lib/auth-client.ts`:

```ts
import { createAuthClient } from "better-auth/client";
export const authClient = createAuthClient({ baseURL: "/app/api/auth" });
```

Use `authClient.signIn.email({ email, password })` and `authClient.signUp.email(...)` in your login/signup forms.

## Rules

- **`.env` is gitignored** and never checked into the repo.
- **`BETTER_AUTH_SECRET`** must be a fresh random value per deployment — never commit or share one.
- **Rebuild and restart** after adding or changing auth config — the running server won't pick up changes.
- **No tokens in URLs.** Better Auth uses HttpOnly cookies by default; keep it that way.
- **Never print secrets on the page.** Not session IDs, not tokens, not passwords.
- **One user, single-owner site?** Create their account via the signup flow yourself, share the credentials in chat once, tell them to change the password on first login.
- **Rate limit** if the site is public-facing — Better Auth has built-in rate limiting; enable it in the config.

## Plugins Worth Knowing

- **Magic links** — email-free variant: agent generates the link, shares it in chat, no SMTP needed.
- **Passkeys** — WebAuthn, no passwords at all.
- **Two-factor** — TOTP on top of password.

Docs: https://better-auth.com/docs
