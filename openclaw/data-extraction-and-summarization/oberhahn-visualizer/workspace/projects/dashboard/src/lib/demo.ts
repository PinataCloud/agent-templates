import type { OberEvent, Tokens } from './types'

// mulberry32 — deterministic PRNG so the same window renders identically on every reload
function mulberry32(seed: number) {
  let a = seed >>> 0
  return function rand(): number {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Consumer {
  id: string
  // hours may exceed 24 to express a day that runs past midnight
  startHour: number
  endHour: number
}

const CONSUMERS: Consumer[] = [
  { id: 'ana@corp.com', startHour: 8, endHour: 17 },   // stops in the early evening
  { id: 'ben@corp.com', startHour: 10, endHour: 26 },  // runs past midnight
  { id: 'cy@corp.com', startHour: 23, endHour: 31 },   // day wraps around midnight
  { id: 'devi@corp.com', startHour: 9, endHour: 18 },
  { id: 'evan@corp.com', startHour: 7, endHour: 15 },
]

const PROJECT_WEIGHTS: Array<[string, number]> = [
  ['atlas-core', 40],
  ['dashboard-v2', 10],
  ['billing-svc', 8],
  ['infra-tools', 7],
  ['docs-site', 6],
  ['mobile-app', 6],
  ['search-index', 5],
  ['notif-svc', 4],
  ['design-system', 4],
  ['data-pipeline', 3],
  ['sandbox-poc', 1],  // lives only minutes
  ['spike-perf', 1],   // lives only minutes
]

const EPHEMERAL_PROJECTS = new Set(['sandbox-poc', 'spike-perf'])

const MODELS = ['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4.5', 'gpt-5-codex']
// Tool wall-clock is heavily skewed in a real ledger — Bash and Read dominate,
// MCP calls are rare. Uniform picks would render eight identical bars.
const TOOL_WEIGHTS: Array<[string, number]> = [
  ['Bash', 34],
  ['Read', 22],
  ['Edit', 13],
  ['Write', 9],
  ['Grep', 8],
  ['Glob', 6],
  ['WebFetch', 5],
  ['mcp__github__pr', 3],
]
const BRANCHES = ['main', 'feature/onboarding', 'feature/billing-v2', 'fix/flaky-tests', 'chore/deps']

function weightedPick<T>(rand: () => number, items: Array<[T, number]>): T {
  const total = items.reduce((sum, [, w]) => sum + w, 0)
  let r = rand() * total
  for (const [item, w] of items) {
    if (r < w) return item
    r -= w
  }
  return items[items.length - 1][0]
}

function pick<T>(rand: () => number, items: T[]): T {
  return items[Math.floor(rand() * items.length) % items.length]
}

function modelRate(model: string): number {
  // USD per million tokens, rough order-of-magnitude only — this is synthetic data
  if (model === 'claude-opus-5') return 15
  if (model === 'claude-sonnet-5') return 3
  if (model === 'gpt-5-codex') return 5
  return 0.8
}

function makeTokens(rand: () => number): Tokens {
  const input = 200 + Math.floor(rand() * 4000)
  const output = 50 + Math.floor(rand() * 800)
  // cache-read dominates the mix, the way a real coding-agent ledger does
  const cacheRead = Math.floor((input + output) * (6 + rand() * 10))
  const cacheWrite = Math.floor(cacheRead * (0.05 + rand() * 0.1))
  return { input, output, cacheRead, cacheWrite }
}

function compositeString(rand: () => number, total: number): string {
  const n = 1 + Math.floor(rand() * 3)
  const parts: string[] = []
  let remaining = total
  for (let i = 0; i < n; i++) {
    const tool = weightedPick(rand, TOOL_WEIGHTS)
    const share = i === n - 1 ? remaining : Math.floor(remaining * rand())
    remaining -= share
    parts.push(`${tool}*${Math.max(1, share)}`)
  }
  return parts.join('+')
}

function isWeekend(t: number): boolean {
  const day = new Date(t).getUTCDay()
  return day === 0 || day === 6
}

function buildSession(opts: {
  rand: () => number
  consumer: Consumer
  start: number
  project: string
  eventCount: number
  gapRange: [number, number]
}): OberEvent[] {
  const { rand, consumer, start, project, eventCount, gapRange } = opts
  const session = `sess-${Math.floor(start)}-${Math.floor(rand() * 1e6)}`
  const model = pick(rand, MODELS)
  const source = model === 'gpt-5-codex' ? 'codex' : 'claude_code'
  const repo = `org/${project}`
  const branch = pick(rand, BRANCHES)
  const unattendedSession = rand() < 0.15

  const events: OberEvent[] = []
  let t = start
  let commits = 0
  let pushes = 0
  let prs = 0
  let toolErrors = 0
  let toolsDenied = 0

  for (let turn = 1; turn <= eventCount; turn++) {
    t += gapRange[0] + Math.floor(rand() * (gapRange[1] - gapRange[0]))

    const tokens = makeTokens(rand)
    const costUnknown = rand() < 0.02
    const cost = costUnknown ? 0 : ((tokens.input + tokens.output) / 1_000_000) * modelRate(model)

    // session-cumulative counters only ever increase within a session
    if (rand() < 0.06 && commits < 60) commits += 1
    if (commits > pushes && rand() < 0.3) pushes += 1
    if (rand() < 0.01) prs += 1
    if (rand() < 0.03) toolErrors += 1
    if (rand() < 0.02) toolsDenied += 1

    // roughly a quarter of real events carry no tool timing at all — the Tools
    // chart's coverage tile exists to surface that, so demo data must show it
    const toolMsTotal = rand() < 0.28 ? 0 : 200 + Math.floor(rand() * 8000)

    events.push({
      time: Math.round(t),
      user: consumer.id,
      project,
      team: 'Engineering',
      cost,
      costUnknown,
      source,
      model,
      title: `${project}: session ${session.slice(-4)}`,
      session,
      agentName: source === 'codex' ? 'codex' : 'claude-code',
      unattended: unattendedSession,
      turn,
      tools: rand() < 0.85 ? compositeString(rand, 1 + Math.floor(rand() * 20)) : null,
      genMs: 400 + Math.floor(rand() * 12_000),
      repo,
      branch,
      linesAdded: Math.floor(rand() * 40),
      linesRemoved: Math.floor(rand() * 20),
      commits,
      pushes,
      prs,
      toolErrors,
      toolsDenied,
      apiError: rand() < 0.01,
      permissionMode: unattendedSession ? 'bypassPermissions' : 'default',
      toolMs: toolMsTotal > 0 ? compositeString(rand, toolMsTotal) : null,
      tokens,
    })
  }

  return events
}

export function demoHistory(days: number): OberEvent[] {
  const rand = mulberry32((0x0b117a11 ^ days) >>> 0)
  // round to the minute so re-renders within the same minute produce an identical array
  const t1 = Math.floor(Date.now() / 60_000) * 60_000
  const t0 = t1 - days * 24 * 60 * 60 * 1000

  // a company-wide quiet stretch — nobody works these hours, regardless of individual schedule
  const blackoutStart = t0 + Math.floor((t1 - t0) * 0.45)
  const blackoutEnd = blackoutStart + 4 * 60 * 60 * 1000

  const events: OberEvent[] = []
  let whaleBudget = 3
  const dayMs = 24 * 60 * 60 * 1000

  for (let dayStart = Math.floor(t0 / dayMs) * dayMs; dayStart < t1; dayStart += dayMs) {
    const weekend = isWeekend(dayStart)

    for (const consumer of CONSUMERS) {
      // Real ledgers show PARALLEL LANES, not desk-hopping: one person commonly
      // has two to five sessions alive at once, each on its own project, and a
      // single session almost never touches two projects. So sessions come in
      // bursts that start within minutes of each other and then overlap — the
      // fact the Loom chart exists to show.
      const bursts = weekend ? (rand() < 0.3 ? 1 : 0) : 1 + Math.floor(rand() * 2)

      for (let burst = 0; burst < bursts; burst++) {
        const hourSpan = consumer.endHour - consumer.startHour
        const burstStart = dayStart + (consumer.startHour + rand() * hourSpan) * 60 * 60 * 1000
        const lanes = 1 + Math.floor(rand() * 3)

        for (let lane = 0; lane < lanes; lane++) {
          const start = burstStart + Math.floor(rand() * 9 * 60 * 1000)
          if (start < t0 || start > t1) continue
          if (start >= blackoutStart && start < blackoutEnd) continue

          const project = weightedPick(rand, PROJECT_WEIGHTS)
          const ephemeral = EPHEMERAL_PROJECTS.has(project)
          const whale = !ephemeral && whaleBudget > 0 && rand() < 0.08
          if (whale) whaleBudget -= 1

          const eventCount = ephemeral
            ? 3 + Math.floor(rand() * 10)
            : whale
              ? 800 + Math.floor(rand() * 1200)
              : 10 + Math.floor(rand() * 200)

          const gapRange: [number, number] = ephemeral ? [500, 5000] : [2000, 47000]

          events.push(...buildSession({ rand, consumer, start, project, eventCount, gapRange }))
        }
      }
    }
  }

  events.sort((a, b) => a.time - b.time)
  return events
}

export function demoLiveEvent(now?: number): OberEvent {
  const t = now ?? Date.now()
  const rand = mulberry32((t ^ 0x5eed) >>> 0)
  const consumer = pick(rand, CONSUMERS)
  const project = weightedPick(rand, PROJECT_WEIGHTS)
  const model = pick(rand, MODELS)
  const source = model === 'gpt-5-codex' ? 'codex' : 'claude_code'
  const tokens = makeTokens(rand)
  const costUnknown = rand() < 0.02
  const cost = costUnknown ? 0 : ((tokens.input + tokens.output) / 1_000_000) * modelRate(model)
  const unattended = rand() < 0.15
  const toolMsTotal = Math.floor(rand() * 8000)

  return {
    time: t,
    user: consumer.id,
    project,
    team: 'Engineering',
    cost,
    costUnknown,
    source,
    model,
    title: `${project}: live event`,
    session: `sess-live-${t}`,
    agentName: source === 'codex' ? 'codex' : 'claude-code',
    unattended,
    turn: 1,
    tools: compositeString(rand, 1 + Math.floor(rand() * 20)),
    genMs: 400 + Math.floor(rand() * 12_000),
    repo: `org/${project}`,
    branch: pick(rand, BRANCHES),
    linesAdded: Math.floor(rand() * 40),
    linesRemoved: Math.floor(rand() * 20),
    commits: 0,
    pushes: 0,
    prs: 0,
    toolErrors: 0,
    toolsDenied: 0,
    apiError: rand() < 0.01,
    permissionMode: unattended ? 'bypassPermissions' : 'default',
    toolMs: toolMsTotal > 0 ? compositeString(rand, toolMsTotal) : null,
    tokens,
  }
}
