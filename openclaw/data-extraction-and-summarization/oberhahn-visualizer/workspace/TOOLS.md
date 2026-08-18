# TOOLS.md — Environment Fact Sheet

## Stack

- Node 22+
- Astro 6, `output: 'server'`
- `@astrojs/node` standalone adapter
- d3 v7 for chart rendering
- Serves on port **4321**, forwarded by the platform at path **`/app`**

## Project Location

The dashboard lives at `workspace/projects/dashboard/`. Everything below is
relative to that directory unless noted.

## Serving

Rebuild and restart every time you change code — building alone does not push
changes live, because the running process keeps the old build in memory:

```bash
cd workspace/projects/dashboard && npm run build && pkill -f 'node dist/server/entry.mjs' || true
```

The platform restarts the process automatically after the `pkill`. Give it a
few seconds, then verify with `curl -sf http://localhost:4321/app`.

## Port Forwarding

The platform's reverse proxy forwards `/app` straight through to port 4321
without stripping the prefix, which is why `astro.config.mjs` sets
`base: '/app'`. If `base` ever drifts from the forwarded path, every asset and
link on the page breaks. The config also sets
`security: { checkOrigin: false }` — the proxy rewrites the request origin, and
Astro's origin check would otherwise reject legitimate requests.

## Key Astro Notes

- `import.meta.env.BASE_URL` returns `/app` with no trailing slash. Build links
  and fetches as `` `${base}/path` ``, not string concatenation that assumes a
  slash either way.
- `src/pages/api/v0/[...path].ts` is SSR, not a static route — there's no
  `getStaticPaths()` to write. It's a same-origin GET proxy: it forwards
  `GET /v0/*` to `OBERHAHN_URL`, attaches the `Authorization` header
  server-side, and refuses anything that isn't a GET to a `/v0/` path. This is
  the only place the API key ever exists — the browser never sees it.

## Data Layer (`src/lib/`)

- `types.ts` — shared types: `OberEvent` (the normalized per-action record) and
  `ChartApi` (what a chart module gets handed at render time).
- `oberhahn.ts` — server-side fetch against the real ledger; holds the API key.
- `normalize.ts` — turns raw ledger rows into `OberEvent[]`.
- `aggregate.ts` — `sessionCounter`, `parseToolMs`, `CumSeries`, and bucketing
  helpers. Read `DATA-GUIDE.md` before touching this file — several of the
  counters it wraps are session-cumulative, not per-event.
- `format.ts` — money/duration/int/name formatting, so every chart renders
  numbers the same way.
- `client.ts` — browser-side `loadHistory` / `pollNew`, the only thing that
  calls the `/app/api/v0/*` proxy from the client.
- `demo.ts` — generated demo ledger, used automatically when no API key is
  configured.

## Chart Modules (`src/charts/`)

Each chart is a class exported from its own file: `constructor(host, api)`,
`render()`, `destroy()`. `common.ts` holds the shared palette, tooltip, and
canvas setup every chart should build on rather than reinvent. `index.ts`
exports the `CHARTS` registry the dashboard page reads to build its tabs — a
new chart isn't live until it's added there.

Current charts: `river` (stacked-area spend over time by project), `prism`
(zoomable sunburst project → person → model), `rhythm` (24h radial clock of
spend by hour, stacked by person), `loom` (session storylines per person over
time), `tools` (tool wall-clock breakdown).

## Design Tokens

`src/styles/global.css` defines the categorical slots `--chart-1` through
`--chart-8` plus `--chart-other`, and the chart ink: `--ink`,
`--ink-secondary`, `--ink-muted`, `--chart-grid`, `--chart-baseline`,
`--chart-surface`, `--chart-accent`. `charts/common.ts` reads them through
`cssVar()` at render time, so restyling the dashboard restyles every chart on
its next draw. Keep hex values out of chart modules — that link is what breaks.

## Page Shell

- `src/components/BaseHead.astro` — charset, viewport, canonical URL, Open
  Graph and Twitter tags, favicon, and the global stylesheet.
- `src/layouts/DashLayout.astro` — the dashboard chrome: brand, mode badge
  (`live` / `demo`), window-spend readout, range switcher, chart tab bar, and
  the `#chart-host` element every chart draws into.
- `src/pages/index.astro` — the client script that loads the ledger, builds the
  tabs from the `CHARTS` registry, implements `ChartApi`, polls every 30s, and
  keeps `?chart=` and `?range=` in the URL so a view can be linked to.

## Environment Variables

- `OBERHAHN_API_KEY` — a read key (`oak_…`) created in the Oberhahn dashboard
  under Settings. Required for real data; without it the dashboard runs in
  demo mode on generated data.
- `OBERHAHN_URL` — optional, defaults to `https://app.oberhahn.com`.
