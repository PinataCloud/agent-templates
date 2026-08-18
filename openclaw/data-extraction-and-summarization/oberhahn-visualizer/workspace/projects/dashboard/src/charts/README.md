# The chart gallery

Five charts ship with the dashboard. They are a starting set, not a fixed one —
adapt them, restyle them, replace them. Each answers one question, and each
reads only what it needs from the normalized ledger.

| chart | the question it answers | `OberEvent` fields it consumes |
|---|---|---|
| `river.ts` | Where does the money go over time? | `time`, `project`, `cost`, `costUnknown`, `tokens` |
| `prism.ts` | How does spend decompose across project, person and model? | `project`, `user`, `model`, `cost` |
| `rhythm.ts` | When does the organization work? | `time`, `user`, `cost` |
| `loom.ts` | Who is running what, in parallel? | `time`, `user`, `project`, `session`, `title`, `turn`, `unattended`, `cost` |
| `tools.ts` | Where does the wall-clock go? | `toolMs` (via `parseToolMs`) |

`common.ts` holds what they share: the palette (read from CSS custom properties
at render time), the single tooltip, `chartShell`, stat tiles, legend chips, the
empty state, and a debounced resize observer. `index.ts` is the registry the
dashboard page reads to build its tabs.

## Adding a chart

1. **Write the question down first.** One sentence. If it takes two, it's
   probably two charts.
2. **Check `workspace/DATA-GUIDE.md`** for the fields you need — several
   counters are session-cumulative, two fields are composite strings, and one is
   near-constant. The guide says which is which.
3. **Write `src/charts/<name>.ts`**, exporting a class that implements `Chart`:

   ```ts
   import type { Chart, ChartApi } from '../lib/types'
   import { chartShell, emptyState, tip, observeResize } from './common'

   export class MyChart implements Chart {
     private unsub: (() => void) | null = null

     constructor(private host: HTMLElement, private api: ChartApi) {}

     render(): void {
       if (this.unsub) { this.unsub(); this.unsub = null }
       const events = this.api.getEvents()
       const shell = chartShell(this.host, 'My chart', 'The question it answers')
       if (events.length === 0) return emptyState(shell.plot, 'No events in this window.')
       // …draw into shell.plot, using api.getRange() for the time domain
       this.unsub = observeResize(shell.plot, () => this.render())
     }

     destroy(): void {
       if (this.unsub) this.unsub()
       this.unsub = null
       tip().hide()
     }
   }
   ```

   `render()` runs again on new data and on resize, so it must be idempotent —
   `chartShell` clears the host for you, and dropping the previous resize
   subscription first keeps observers from stacking up.

4. **Register it in `index.ts`** with an `id`, `title` and `blurb`. It is not
   live until it appears in `CHARTS`.
5. **Rebuild and restart**, then tell your human to refresh:

   ```bash
   cd workspace/projects/dashboard && npm run build && pkill -f 'node dist/server/entry.mjs' || true
   ```

## House rules

- Colors come from `src/styles/global.css` through `common.ts`. A hex value in
  a chart module breaks restyling for everyone.
- Rank categories once by total and fold the tail into `Other` (`projectPalette`
  does this) so a project keeps its color between renders.
- Sequential ramps (`seqColor`) encode magnitude; the accent color is reserved
  for hover and selection.
- Money through `fmtMoney`, durations through `fmtDur`, time ranges through
  `fmtRange` — no ad-hoc `toFixed` in a chart.
- Ledger values (user ids, session titles, branches, project names) go through
  `escapeHtml` before they reach a tooltip.
- Take the time domain from `api.getRange()`, never from the window that was
  requested.
