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

**No page-load entrance animations.** Don't add `fade-up` / `fade-in` keyframes that start at `opacity: 0` and rely on first-render to animate to visible. They break under Astro's `<ClientRouter />` — back/forward navigation doesn't replay CSS animations, so content stays invisible. If you want motion, use hover transitions or looping decorative animations only.

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
- **Private data or login needed?** Default is **no auth**. Keep it only if something on the site is meant for the owner alone (internal reports, dashboards, drafts) or stores end-user information tied to identity (customer accounts, saved state). If all outputs flow through a channel the user already owns — Telegram bot, email, Slack — no login needed. If unclear, ask before deciding: "who should see this?" See **Authentication Module → When to keep this module** below for the decision criteria and examples.

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
- **`<ClientRouter />` + inline `<script>` event handlers don't survive SPA navigation.** A plain `<script>` runs once on initial load, attaches a listener, then never re-runs as the user navigates SPA-style — so the new DOM's button has no handler, and clicks do nothing until a hard reload happens. Symptom: "I had to click sign-out many times." Fix: wrap the binding in a function and call it from both initial load AND `astro:page-load`. Guard with `dataset.bound` so re-attachment doesn't double-fire. Pattern: `function bind() { const el = document.getElementById('x'); if (!el || el.dataset.bound) return; el.dataset.bound = 'true'; el.addEventListener(...); } bind(); document.addEventListener('astro:page-load', bind);`

---

# Modules

The vanilla template ships a working example of each module so users can see what's possible and you have a working reference. When the user tells you what kind of site they want, **delete the modules they don't need** — don't ask them to install missing ones. Their docs stay here if they want to re-add later.

## Authentication Module

**Status:** built-in but **off by default**. The vanilla template ships it wired up so you have a working reference, but you should **remove it unless the use case clearly needs login**. Uses [Better Auth](https://better-auth.com/docs/integrations/astro) — the current standard for Astro (Lucia was deprecated in 2025), TypeScript-first, SQLite-backed via our existing `data/database.db`.

### One rule: Better Auth or nothing

When a site needs auth, the answer is **always Better Auth**. There is no second option. Do not invent one.

**Specifically do not, ever:**
- Add a `SITE_PASSWORD` (or any single-secret) env var and check it in a page.
- Gate content with a client-side `localStorage` flag, a CSS `visibility: hidden` overlay, or any JS that "hides" content the server already rendered. The HTML still ships; anyone with devtools or `curl` reads it.
- Write a custom middleware that compares a token in a cookie/header to an env var.
- Replace, "simplify," or work around `src/lib/auth.ts` and `src/middleware.ts`. They are the auth.

If Better Auth feels heavy for the use case, the answer is **the shared-login pattern below**, not a rewrite. Better Auth gives you HttpOnly cookies, server-side session checks, and proper sign-out. Anything you write yourself in an afternoon will leak content, be trivially bypassable, or both — and we have shipped agents that proved this.

If the user pushes back on Better Auth's complexity, push back on yours: explain that the gating is one line (`if (!Astro.locals.user) return Astro.redirect(...)`), and that "just a password" *is* one Better Auth user the whole team shares. See the next section.

### Shared single login (the simple path)

When the user says *"I just want one password,"* *"only my team needs in,"* *"no signup, just a login,"* — they don't need a second auth system. They need **one Better Auth user that everyone shares**.

**The pattern:**
1. Keep Better Auth wired up (don't remove the module).
2. Disable the public sign-up page if you have one (the template doesn't ship one — only `login.astro`).
3. Create a single account whose email represents the team, e.g. `team@<their-domain>` or `employee@<their-company>.com`:
   ```bash
   cd workspace/projects/astro-app
   node --env-file=.env scripts/create-test-user.mjs team@acme.com s0me-strong-shared-password
   ```
4. Share the credentials with the user once, in chat. Tell them anyone on their team uses the same email + password to sign in.
5. Done. Every gated page works the same way: `if (!Astro.locals.user) return Astro.redirect(...)`.

This solves the "I just want one shared password" case **without** a second auth path, custom env vars, or client-side gates. It's the same Better Auth code, with one row in the user table.

If they later want per-user accounts, you add `signUp` or seed more users — no rewrite.

### When to keep this module

**Default: remove.** Most sites don't need auth. Keep the module only if one of these is true:

**Keep it when:**
- The site shows the **owner's private info** — sales numbers, internal reports, dashboards, drafts, anything "only I should see".
- The site stores **end-user information tied to identity** — customer accounts, "my orders", saved state per visitor.
- The user explicitly says "logged-in area", "admin page", "members only", "my team's dashboard".

**Remove it when:**
- All outputs flow through a channel the user already owns — **Telegram** bot receives submissions, **email** receives contact forms, **Slack** gets notifications. The site writes out; nothing on the site is read back privately.
- The site is a **landing page, marketing site, blog, public store, or portfolio**.
- Forms submit to external services (Formspree, email, webhook) without persisting per-visitor state.

**Ask before deciding when the ask is ambiguous:**
- *"I want to share my monthly sales in a website"* → who sees it? Owner-only / investors / public? If private → keep auth (shared login is fine). If public → remove.
- *"I want a store"* → do customers need "my orders" / "my account"? If yes → keep, per-user. If Stripe checkout + email receipts is enough → remove.
- *"A contact form"* → does anything persist on the site, or does it just email/Telegram the owner? Persist → maybe keep. Just forward → remove.
- Anything that mentions *"keep my users' information"*, *"track who did what"*, *"only logged-in people"* → keep, per-user.
- *"I just want one password,"* *"only my team needs to get in"* → keep auth, use the **shared single login** pattern above. Don't remove auth, don't roll your own.

**Concrete examples:**

| User says | Decision |
|---|---|
| "A store I control fully from Telegram plus a contact form" | Remove auth |
| "A blog about hiking" | Remove auth |
| "An internal dashboard for my team's monthly numbers" | Keep auth, **shared login** |
| "A site where customers can track their orders" | Keep auth, per-user accounts |
| "A portfolio" | Remove auth |
| "A place where my staff submits reports" | Keep auth (see *Advanced* below) |
| "I just want one password for my team" | Keep auth, **shared login** |

### Advanced: admin vs user roles

**Not built in. Do not implement unless the user explicitly asks.** Flag it as possible, confirm before scoping.

Signal to surface the question: the user describes a *write vs. read split* — "anyone on my team can submit reports, only I see the combined view", "clients upload files, only I review them", "staff adds entries, I approve them". Two roles (admin + user) solve this; one role doesn't.

When you spot this, say something like: *"Sounds like you want different permissions for different people — staff can submit, but only you can see everything combined. That's a second role on top of auth, a bit more complex than a single-login site. Want me to build that, or is a single shared login enough for now?"*

Then wait for an answer. If they say yes, scope it — Better Auth supports it via a `role` field on the user table (lightweight) or the official admin plugin (heavier). Don't pre-build it.

**Out of scope for this template (by design):** 2FA, email verification, password reset via email, OAuth providers, orgs/teams/workspaces, impersonation, audit logs.

### Files

| File | Purpose |
|---|---|
| `src/lib/auth.ts` | Auth instance. Reads `trustedOrigins` from env. |
| `src/pages/api/auth/[...all].ts` | Catch-all handler for all Better Auth endpoints |
| `src/middleware.ts` | Populates `Astro.locals.user` and `Astro.locals.session` on every request |
| `src/env.d.ts` | Types for `App.Locals` |
| `src/pages/login.astro` | Vanilla sign-in form (POST fallback + JS fetch) |
| `src/pages/reports.astro` | Example gated page — redirects anon users to `/app/login` |
| `scripts/create-test-user.mjs` | Seed a user without booting the server: `node --env-file=.env scripts/create-test-user.mjs <email> <password>` |

The Layout nav reads `Astro.locals.user` and shows "Sign in" or "Sign out" conditionally, plus a "Reports" link.

**Env vars** — see `.env.example` in the astro-app root for the canonical list.

| Var | Required | Purpose |
|---|---|---|
| `BETTER_AUTH_SECRET` | yes | Signs session cookies. Generate with `openssl rand -base64 32`. Fresh per deployment. |
| `BETTER_AUTH_URL` | yes | Public URL (including `/app`) the user hits in the browser. Must match origin exactly. |
| `BETTER_AUTH_TRUSTED_ORIGINS` | no | Comma-separated extras if the site is reachable under multiple hosts. |

`BETTER_AUTH_URL` must match the origin the user hits in the browser. The `trustedOrigins` list in `auth.ts` is derived from these env vars.

### Local development

Copy `.env.example` to `.env`, fill in values, keep `.env` gitignored. Already done if you're iterating on the local template.

### Deployed on Pinata managed

`.env` files are **not** used in production. The platform injects env vars into the process. The agent cannot set these itself — **ask the human to configure them** through the Pinata platform UI/API when the site first deploys (or before anyone tries to log in).

What to tell the user:

> "The auth module needs two environment variables set on the platform before anyone can sign in:
> - `BETTER_AUTH_SECRET` — I'll generate one for you: `<paste: openssl rand -base64 32>`
> - `BETTER_AUTH_URL` — your site's public URL including `/app` (e.g. `https://<agent-id>.agents.pinata.cloud/app`)
>
> Set these through the Pinata platform, then restart the agent so the server picks them up."

If you see `BETTER_AUTH_SECRET` errors in logs or sign-in/sign-up returning 500s, the env vars are missing or out of sync with the site's actual URL — walk the user through the list above.

**First-time setup on fresh deployment:**

```bash
cd workspace/projects/astro-app
npx @better-auth/cli@latest migrate   # creates user/session/account/verification tables
```

Run this once per deployment (or after any `better-auth` upgrade that changes schema).

### Gating a page

```astro
---
const base = import.meta.env.BASE_URL;
if (!Astro.locals.user) return Astro.redirect(`${base}/login`);
---
```

### Critical rules (ship-breakers)

- **`<form method="post">` on any form with a password or secret** — always. Never rely on JS `onsubmit` + `preventDefault()` alone. If JS fails for any reason, a form defaults to GET and puts the password in the URL. Also set a safe `action`.
- **No auth tokens or secrets in URLs.** Ever. Better Auth uses HttpOnly cookies by default — keep it that way.
- **No secrets printed on pages.** Not session IDs, not tokens, not passwords, not debug dumps.
- **`BETTER_AUTH_SECRET`** is fresh per deployment. Never commit or share one.
- **`.env` is gitignored** — keep it that way.
- **Rebuild + restart** after changing auth config; the running server won't pick up changes.
- **Better Auth sign-out endpoint wants JSON:** `fetch("/app/api/auth/sign-out", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })`. Empty body with `Content-Type: application/json` → 500. Body must at least be `"{}"`.

### Create a user without a server

The agent usually owns the site, so creating the initial user is an agent task — use the seed script (doesn't boot a server, uses Better Auth's server API directly):

```bash
node --env-file=.env scripts/create-test-user.mjs alice@example.com s0mething-strong
```

Share the credentials in chat once. Tell the user to change their password on first login.

### Client-side (if you need a signup page, not just login)

```ts
// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/client";
export const authClient = createAuthClient({ baseURL: "/app/api/auth" });
```

Then `authClient.signIn.email({ email, password })` / `authClient.signUp.email(...)`.

### Plugins worth knowing

- **Magic links** — agent generates the link, shares it in chat, no SMTP needed.
- **Passkeys** — WebAuthn, no passwords at all.
- **Two-factor** — TOTP on top of password.
- **Rate limiting** — built-in, enable in the config for public-facing sites.

Docs: https://better-auth.com/docs

### Removing the auth module

When the user wants a site with no auth (most marketing sites), delete:

```
rm -rf src/lib/auth.ts src/middleware.ts src/pages/api/auth src/pages/login.astro src/pages/reports.astro scripts/create-test-user.mjs
npm uninstall better-auth
```

Also remove `env.d.ts`'s `App.Locals` block (or delete the file if nothing else uses it), strip the Reports link + sign-in/out toggle from `src/layouts/Layout.astro`, and drop `BETTER_AUTH_*` env vars from `.env`. Auth tables in `data/database.db` can stay — they're inert if nothing calls them.
