export interface Tokens {
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
}

export interface OberEvent {
  time: number            // ms epoch
  user: string
  project: string         // 'Unassigned' when unattributed
  team: string | null
  cost: number            // USD
  costUnknown: boolean    // unpriced model — real tokens, unknown dollars
  source: string          // 'claude_code' | 'codex' | …
  model: string | null
  title: string | null
  session: string | null
  agentName: string | null
  unattended: boolean
  turn: number | null
  tools: string | null    // composite, e.g. 'Bash*10492+Read'
  genMs: number | null
  repo: string | null
  branch: string | null
  linesAdded: number      // per-event delta
  linesRemoved: number    // per-event delta
  commits: number         // session-cumulative
  pushes: number          // session-cumulative
  prs: number             // session-cumulative
  toolErrors: number      // session-cumulative
  toolsDenied: number     // session-cumulative
  apiError: boolean
  permissionMode: string | null
  toolMs: string | null   // composite, e.g. 'Bash*3845+Edit*25'
  tokens: Tokens
}

/** What a chart is given. The dashboard shell implements it. */
export interface ChartApi {
  getEvents(): OberEvent[]                // hygiene-filtered, ascending by time
  getRange(): { t0: number; t1: number }  // the domain to draw, from real data
  isDemo(): boolean
}

export interface Chart {
  render(): void      // (re)draw into the host element; called on data + resize
  destroy(): void     // drop listeners, timers, tooltips
}

export interface ChartCtor {
  new (host: HTMLElement, api: ChartApi): Chart
}

export interface ChartMeta {
  id: string          // url/tab id, kebab-case
  title: string       // 'River'
  blurb: string       // one line: the question this chart answers
  ctor: ChartCtor
}
