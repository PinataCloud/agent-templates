# Oberhahn Visualizer

An agent that watches your Oberhahn ledger and shows you where your AI spend is
going. It ships with a live dashboard, and you can ask it to explore the data,
answer questions, or build a new chart in plain English.

## What's Included

### Dashboard
- Astro 6 SSR app served at `/app` — built for you at deploy time. (Later
  code changes need a rebuild + restart, which the agent handles.)
- Same-origin API proxy (`/app/api/v0/*`) — your Oberhahn key stays on the
  server and is never sent to the browser.
- Demo mode: with no key attached, the dashboard generates realistic sample
  data and labels itself clearly as demo so you never mistake it for real spend.

### Charts
- **River** — stacked area of spend over time by project. *Which projects are
  driving the trend, and when did it start?*
- **Prism** — zoomable sunburst, project → person → model. *Where does the
  money actually go once you break it down?*
- **Rhythm** — 24-hour radial dial, spend by hour stacked by person. *When
  during the day is spend happening, and who's driving it?*
- **Loom** — session storylines per person, showing concurrent sessions.
  *Who's running multiple agents at once, and for how long?*
- **Tools** — tool wall-clock breakdown. *Which tools are eating the most
  time?*

These five are a starting gallery, not a fixed set — the agent restyles,
recombines, or adds to them on request.

### Data layer
- `workspace/DATA-GUIDE.md` documents the Oberhahn ledger contract: the
  endpoint, the normalized event shape, which rows to drop, which counters are
  session-cumulative (and so need diffing, not summing), and which fields are
  too sparse or too constant to be worth charting.
- The agent reads this guide before touching the data, so new charts respect
  the same hygiene rules as the shipped ones.

### Design tokens
- The palette is colorblind-safe and defined once as CSS custom properties in
  `src/styles/global.css` (`--chart-1` … `--chart-8`, plus ink/grid/surface
  tokens). Restyle the dashboard and every chart follows.

## Stack

| Layer      | Tech                                  |
|------------|----------------------------------------|
| Framework  | Astro 6, SSR (`output: 'server'`)      |
| Adapter    | `@astrojs/node`, standalone            |
| Charts     | d3 v7 (scales, shapes)                 |
| Runtime    | Node 22+                               |
| Data       | Oberhahn ledger API (`/v0/*`)          |

## How It Works

1. Deploy the template — the platform runs `npm ci && npm run build` once
   against `workspace/projects/dashboard`.
2. Attach your `OBERHAHN_API_KEY` as a secret (or skip it to try demo mode).
3. The platform starts the server on port 4321; it's forwarded at
   `https://<agent-id>.agents.pinata.cloud/app`, publicly reachable, no auth
   wall.
4. Open the dashboard, or just talk to the agent about your spend — it can
   read the same data it charts.
5. Ask for changes: new charts, different breakdowns, scheduled digests. The
   agent edits the Astro project directly in its workspace.

## Setup

1. In your Oberhahn dashboard, go to **Settings → API Keys** and create a
   **read** key (`oak_…`).
2. When creating the agent, attach it as the secret `OBERHAHN_API_KEY`.
3. Optionally set `OBERHAHN_URL` if you're on a self-hosted or staging
   Oberhahn instance — it defaults to `https://app.oberhahn.com`.

Without a key, the dashboard runs in **demo mode** on generated data so you can
see the charts and layout before connecting anything real. The key is
read-only, is only ever used server-side by the `/app/api/v0/*` proxy, and is
never exposed to the browser.

## Asking For New Charts

Describe the question, not the chart type — "show me who's spending the most
on Opus this month" is enough; the agent picks the shape, wires it to the
normalized data, and adds it to the gallery using the existing design tokens.

## What You Can Ask It To Do

- "Which project burned the most last week?"
- "Chart cost per model over time."
- "Add a chart showing cache-read share."
- "Break down Rhythm by project instead of by person."
- "Who ran the most concurrent sessions yesterday?"
- "Set up a daily digest at 9am with yesterday's total spend and top project."
- "Add a threshold alert if daily spend crosses $500."
- "Is our spend trending up or down this month?"

Scheduled reporting isn't hardcoded — the template ships with an empty `tasks`
list, and the agent adds entries as you ask for them. Example:

```json
{
  "name": "Daily spend digest",
  "prompt": "Summarize yesterday's Oberhahn spend: total, top project, top model, and any notable spikes.",
  "schedule": "0 9 * * *",
  "enabled": true
}
```
