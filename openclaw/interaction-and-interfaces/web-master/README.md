# Web Master

A web developer agent that builds custom websites through conversation. Tell it what you need — a portfolio, a landing page, a restaurant site, a SaaS product page — and it designs, codes, and deploys it live.

## What's Included

This isn't a blank canvas. Web Master ships with a full toolkit so it can build distinctive sites fast:

### Design System (Framer-Inspired Default)
- Ships with a Framer-inspired dark canvas design (`designs/framer/DESIGN.md`) — pure black backgrounds, electric blue accent (`#0099ff`), tight typography
- Instantly swap to 60+ other brand designs (Stripe, Vercel, Linear, Apple, Nike, Notion...) via `npx getdesign` from [VoltAgent's awesome-design-md](https://github.com/VoltAgent/awesome-design-md)
- CSS variables for every color, font, radius, and spacing value — change the design and the entire site transforms
- Google Fonts (Space Grotesk + Inter) with easy font swapping via `--display` and `--sans` variables

### Three Layouts
- **Layout** — Top nav with sticky blur. Best for landing pages, blogs, general sites.
- **SidebarLayout** — Fixed sidebar with vertical nav. Best for dashboards, docs, portfolios.
- **MinimalLayout** — Floating brand + full-screen overlay menu. Best for creative sites, studios, portfolios.

### Four Page Templates
Pre-built pages the agent uses as starting points — each demonstrates a different layout and design approach:
- **Starter** — SaaS landing page with hero, feature grid, stats bar, and waitlist CTA
- **Portfolio** — Creative portfolio with sidebar nav, project grid, and contact section
- **Studio** — Design agency with dramatic typography, numbered service blocks, and overlay menu
- **Waitlist** — Dark pre-launch page with gradient auras, scrolling feed, marquee, cascading cards, and animated grid

### UI Components
Composable Astro components in `src/components/ui/`: Text, Button, Card, Box, Stack, Link — all wired to the design system variables.

### Stock Image Library
39 royalty-free images (hosted on IPFS) with AI-generated descriptions including subject, mood, colors, and best use case. The agent picks the right photo for heroes, cards, and galleries based on what the user is building.

### Data & Content
- **SQLite database** via better-sqlite3 — auto-initializes on first request, WAL mode for performance
- **MDX blog** — Content collections supporting Markdown and MDX with interactive components
- **Waitlist API** — Email signup endpoint with form validation, ready to use

### VoltAgent Design Integration
Web Master uses [VoltAgent's awesome-design-md](https://github.com/VoltAgent/awesome-design-md) as its primary design source. The Framer design ships as the default, but you can ask the agent to switch to any of the 60+ brand designs in the collection. The agent downloads the DESIGN.md via `npx getdesign`, maps the design tokens to the project's CSS variables, updates fonts, and rebuilds — the entire site transforms to match the new brand.

## Stack

| Layer | Tech |
|-------|------|
| Framework | Astro 6 (SSR mode) |
| Adapter | @astrojs/node (standalone) |
| Integrations | @astrojs/mdx |
| Database | SQLite via better-sqlite3 |
| Blog | Astro Content Collections (`.md` and `.mdx`) |
| Styling | Vanilla CSS with custom properties |

## How It Works

1. **Deploy the template** and open the chat
2. **Pick a design** — the Framer design is active by default, or choose from 60+ brand designs (Stripe, Vercel, Linear, etc.)
3. **Tell it about your project** — what the site is for, any reference sites, what content you need
4. **It picks a page template**, applies the design system, and builds your pages
5. **Visit your live site** at the agent's public URL under `/app`
6. **Iterate** — ask for changes, new pages, blog posts, data models, and it rebuilds and deploys

The agent backs up the original template code before transforming the project, so it can reference patterns later. It keeps the infrastructure (layouts, components, database, API routes) and replaces the content with yours.

## Setup

No secrets required. The agent runs out of the box.

After deploying, the site is live at the agent's public URL under `/app`. The SQLite database is created automatically on first API request.

## What You Can Ask It To Do

- **"Use the Stripe design"** — instantly reskins the site using a brand's `DESIGN.md` from VoltAgent
- **"Switch to the Vercel design"** — swap between designs at any time
- Build a complete website from a description or reference URL
- Add new pages, sections, or features
- Write and publish blog posts (Markdown or MDX with interactive components)
- Change colors, fonts, layouts, or any design element
- Add new data models (products, listings, contacts) with SQLite tables and API routes
- Check waitlist signups and generate reports
