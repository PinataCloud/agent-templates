# Oberhahn spend ledger — data guide

This is the raw event ledger behind every chart in this dashboard: each agent
action (Claude Code, Codex) that incurs or could incur cost, one row per event.
It's messy telemetry, not a clean spend table — read the gotchas section before
you chart anything.

## Getting the data

```
GET https://app.oberhahn.com/v0/events
Authorization: Bearer <API key>
Accept: application/json
```

**Query params:**

| param | meaning | typical values |
|---|---|---|
| `limit` | page size | `20000` for a full history pull, `5000` for a live poll |
| `offset` | pagination offset | `0`, `20000`, ... |
| `start_date` | ISO-8601 lower bound, inclusive, second/ms granularity | `2026-07-01T00:00:00Z` |

**Response envelope:**

```json
{ "events": [ /* raw event objects */ ], "total": 12345 }
```

**Auth: the API key never reaches a browser.** This app proxies the endpoint
server-side and injects the `Authorization` header there —
`src/pages/api/v0/[...path].ts` exposes `GET /app/api/v0/*`, forwards to `/v0/*`
upstream with the key from `OBERHAHN_API_KEY`, and refuses anything that isn't a
`GET` to a `/v0/*` path. The key lives only in the container's environment. Client
code calls the proxy through `src/lib/client.ts` and never sees a credential.

With no key configured the proxy answers `503 {"error":"no-key","demo":true}` and
the dashboard falls back to generated demo data (`src/lib/demo.ts`), labelling
itself `demo` in the header.

**Incremental polling.** Keep the max `time` (ms epoch, see below) you've seen
so far, then poll with:

```js
const url = `${base}/api/v0/events?limit=5000&start_date=${new Date(maxTime + 1).toISOString()}`
```

Still filter `event.time > maxTime` client-side after the request returns —
`start_date` is inclusive at second/ms granularity, so the boundary row can
come back again.

## Event shape

Raw rows are inconsistent across schema versions; normalize every row into
this shape before doing anything else (`src/lib/normalize.ts` does it once, for
every view). `e` = raw event, `c` = `e.custom`, `s` = `e.spend_details`.

| normalized | from | notes |
|---|---|---|
| `time` | `Date.parse(e.date)` | ms epoch; drop rows where this isn't finite |
| `user` | `e.consumer_id` | the actor |
| `project` | `c.issue_project \|\| c.task_project \|\| 'Unassigned'` | see rename note below |
| `team` | `c.issue_team \|\| c.task_team \|\| null` | near-constant, low value |
| `cost` | `e.cost \|\| 0` | USD |
| `costUnknown` | `c.cost_unknown != null \|\| c.unpriced_model != null` | unknown ≠ free — don't collapse into `cost === 0` |
| `source` | `e.source` | `claude_code` or `codex` |
| `model` | `s.model \|\| null` | null on non-spend rows |
| `title` | `c.session_title \|\| c.task_title \|\| null` | |
| `session` | `e.provider_session_id \|\| null` | groups events into one session |
| `agentName` | `c.agent_name \|\| null` | |
| `unattended` | `c.unattended === 'true' \|\| c.unattended === true` | field is string OR bool — check both |
| `turn` | `Number(c.prompt_turn) \|\| 0`, else `null` | |
| `tools` | `c.tools \|\| null` | composite string, e.g. `Bash*10492+Read` |
| `genMs` | `Number(c.gen_ms) \|\| null` | |
| `repo` | `c.git_repo \|\| null` | |
| `branch` | `c.git_branch \|\| null` | |
| `linesAdded` | `Number(c.lines_added) \|\| 0` | per-event delta |
| `linesRemoved` | `Number(c.lines_removed) \|\| 0` | per-event delta |
| `commits` | `Number(c.agent_commits) \|\| 0` | **session-cumulative** |
| `pushes` | `Number(c.agent_pushes) \|\| 0` | **session-cumulative** |
| `prs` | `Number(c.pr_opened) \|\| 0` | **session-cumulative** |
| `toolErrors` | `Number(c.tool_errors) \|\| 0` | **session-cumulative** |
| `toolsDenied` | `Number(c.tools_denied) \|\| 0` | **session-cumulative** |
| `apiError` | `c.api_error === 'true' \|\| c.api_error === true` | string OR bool |
| `permissionMode` | `c.permission_mode \|\| null` | |
| `toolMs` | `c.tool_ms \|\| null` | kept as the raw composite string, NOT a number — parse at use site |
| `tokens.input` | `s.input_tokens \|\| 0` | |
| `tokens.output` | `s.output_tokens \|\| 0` | |
| `tokens.cacheRead` | `s.cache_read_tokens \|\| 0` | |
| `tokens.cacheWrite` | `s.cache_write_tokens \|\| 0` | |

**Field rename:** around mid-2026 the ledger renamed `task_*` → `issue_*`
(and `task_title` → `session_title`). Read the new name first, fall back to
the old one — otherwise archived exports silently collapse `project` to
`Unassigned`.

Sort ascending by `time` after normalizing. Most aggregation below assumes
chronological order.

## Hygiene: rows you must drop first

These are telemetry rows, not spend. `normalize()` filters them once so no
downstream view can forget:

- `e.custom.signal` present — notification hook rows (permission prompts, idle
  pings). `model` is null, cost is $0. ~332 rows in the reference pull.
- `e.custom.test_event` present — synthetic test rows.
- `e.consumer_id === 'oberhahn-setup-test'` — the setup-test consumer.

## Gotchas that will bite you

Measured over an 18,198-event reference pull:

| issue | scale | what to do |
|---|---|---|
| `consumer_type` is never `"user"` | 18,196 `agent` + 2 `service` | the user/agent split does not exist in this data — don't build a viz on it |
| missing project attribution | 1,650 events / 9.07% / $192.05 | `(none)` would rank #3 by cost; bucket it explicitly as `Unassigned`, don't hide it |
| missing `task_id` | 5,621 / 30.89% | only ~70% of spend maps to a task |
| `cost == 0` | 753 / 4.14% | 402 are real opus-5 events flagged `unpriced_model` + `cost_unknown` → spend is under-reported; 332 are notifications; 19 are `<synthetic>`. Render unknown-cost distinctly from real $0 |
| `tool_ms` is not milliseconds | 5,019 / 27.6% | it's a `+`-joined composite string; parse it, never cast it |
| `cached_tokens` ≠ `cache_read + cache_write` | 6.3M token gap | pick one convention and stay consistent |
| `task_team` near-constant | Engineering 18,027 / Support 169 | zero information — don't chart it |
| missing cache subfields | 102 / 0.56% | older schema rows |
| `duration_ms` | 158 / 0.87% populated | too sparse to use |
| `speed`, `billing_mode`, `environment`, `execution_origin` | 26–74% null | sparse, use with care |
| `/v0/events/keys` is incomplete | — | omits `task_project`, `task_title`, `tags`, `billing_mode`, `feature` — don't drive a field picker off it |
| date range lies | — | a "last 30 days" request returned the *entire* ledger; real coverage was 9.88 days (2026-07-21 → 2026-07-31). Compute your chart domain from the timestamps you actually got (`extent()`), never from the window you asked for, or you render 20 empty days |

## Aggregation patterns

**1. Session-cumulative counters.** `commits`, `pushes`, `prs`, `toolErrors`,
`toolsDenied` are running totals per session, not per-event deltas. Summing
them across events over-counts wildly. Instead, track the max seen per
session, sum the maxima for a window total, and treat each increase as a
discrete milestone event. `sessionCounter()` in `src/lib/aggregate.ts`:

```js
function sessionCounter(events, field) {
  const maxBySession = new Map()
  const marks = []
  for (const e of events) {
    const v = e[field]
    if (!v) continue
    const key = e.session || 'nosession:' + e.user
    const prev = maxBySession.get(key) || 0
    if (v > prev) {
      maxBySession.set(key, v)
      marks.push({ time: e.time, event: e, delta: v - prev, total: v })
    }
  }
  let total = 0
  for (const v of maxBySession.values()) total += v
  return { total, marks }
}
```

`linesAdded` / `linesRemoved` are the exception — those ARE per-event deltas
and can be summed directly.

**2. Composite tool strings.** `toolMs` and `tools` look like
`Bash*3845+Edit*25+mcp__x__y*12`. Split on `+`, then split each part at its
LAST `*` (tool names can themselves contain `*`). Drop any part without a
finite, non-negative numeric suffix. `parseToolMs()` in `src/lib/aggregate.ts`:

```js
function parseToolMs(str) {
  if (!str) return []
  const out = []
  for (const part of String(str).split('+')) {
    const i = part.lastIndexOf('*')
    if (i <= 0) continue
    const ms = Number(part.slice(i + 1))
    if (Number.isFinite(ms) && ms >= 0) out.push([part.slice(0, i), ms])
  }
  return out
}
```

**3. Cumulative spend lookups.** For "spend so far at time t" or rolling
windows over tens of thousands of events, build one append-only cumulative
array and binary-search it — O(log n) per query instead of rescanning
(`CumSeries` in `src/lib/aggregate.ts`).

```js
function bisect(arr, t, key = (x) => x) {
  let lo = 0, hi = arr.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (key(arr[mid]) <= t) lo = mid + 1
    else hi = mid
  }
  return lo
}

class CumSeries {
  constructor() { this.times = []; this.cums = [] }
  push(time, cost) {          // push in ascending time order
    const last = this.cums.length ? this.cums[this.cums.length - 1] : 0
    this.times.push(time); this.cums.push(last + cost)
  }
  at(t) { const i = bisect(this.times, t); return i === 0 ? 0 : this.cums[i - 1] }
  rolling(t, window) { return this.at(t) - this.at(t - window) }
}
```

## What the shipped charts use

| chart | question it answers | fields it consumes |
|---|---|---|
| River | where does the money go over time? | `time`, `project`, `cost`, `costUnknown` |
| Prism | how does spend decompose? | `project`, `user`, `model`, `cost` |
| Rhythm | when does the org work? | `time`, `user`, `cost` |
| Loom | who is running what, in parallel? | `time`, `user`, `project`, `session`, `title`, `turn`, `unattended`, `cost` |
| Tools | where does the wall-clock go? | `time`, `toolMs` via `parseToolMs` |

Highest-value fields: `time`, `cost`, `user`, `project`, `model`, `session` —
dense and reliable across the whole ledger. Anything in the gotchas table
needs an explicit decision (bucket it, parse it, or drop it) before it goes
near a chart.

Other stories this ledger can tell, if someone asks for a new chart: the token
iceberg (cache reads outweigh fresh input by two orders of magnitude), model
regime changes (one model's share of daily cost moving from 0% to 90% inside a
weekend), whale sessions (a single session can be 10% of all spend), code churn
against cost (`linesAdded`/`linesRemoved` vs dollars), and friction (`apiError`,
`toolErrors`, `toolsDenied` — the last two via `sessionCounter`).
