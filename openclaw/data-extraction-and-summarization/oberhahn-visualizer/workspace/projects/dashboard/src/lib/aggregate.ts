import type { OberEvent } from './types'

/** First index where key(arr[i]) > t — an upper bound over an ascending array. */
export function bisect<T>(arr: T[], t: number, key: (x: T) => number = (x) => x as unknown as number): number {
  let lo = 0
  let hi = arr.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (key(arr[mid]) <= t) lo = mid + 1
    else hi = mid
  }
  return lo
}

/**
 * Append-only cumulative spend series. Built once over tens of thousands of
 * events, then queried in O(log n) instead of rescanning per lookup.
 */
export class CumSeries {
  private times: number[] = []
  private cums: number[] = []

  push(time: number, cost: number): void {
    const last = this.cums.length ? this.cums[this.cums.length - 1] : 0
    this.times.push(time)
    this.cums.push(last + cost)
  }

  at(t: number): number {
    const i = bisect(this.times, t)
    return i === 0 ? 0 : this.cums[i - 1]
  }

  rolling(t: number, window: number): number {
    return this.at(t) - this.at(t - window)
  }
}

/**
 * Composite strings look like `Bash*3845+Edit*25+mcp__x__y*12`. Split on `+`,
 * then split each part at its LAST `*` since tool names can contain `*`.
 */
export function parseToolMs(str: string | null): Array<[string, number]> {
  if (!str) return []
  const out: Array<[string, number]> = []
  for (const part of str.split('+')) {
    const i = part.lastIndexOf('*')
    if (i <= 0) continue
    const ms = Number(part.slice(i + 1))
    if (Number.isFinite(ms) && ms >= 0) out.push([part.slice(0, i), ms])
  }
  return out
}

export interface CounterMark {
  time: number
  event: OberEvent
  delta: number
  total: number
}

/**
 * commits/pushes/prs/toolErrors/toolsDenied are session-cumulative running
 * totals, not per-event deltas — summing them across events over-counts
 * wildly. Track the max seen per session and treat each increase as a
 * discrete milestone.
 */
export function sessionCounter(
  events: OberEvent[],
  field: 'commits' | 'pushes' | 'prs' | 'toolErrors' | 'toolsDenied',
): { total: number; marks: CounterMark[] } {
  const maxBySession = new Map<string, number>()
  const marks: CounterMark[] = []

  for (const e of events) {
    const v = e[field]
    if (!v) continue
    const key = e.session ?? `nosession:${e.user}`
    const prev = maxBySession.get(key) ?? 0
    if (v > prev) {
      maxBySession.set(key, v)
      marks.push({ time: e.time, event: e, delta: v - prev, total: v })
    }
  }

  let total = 0
  for (const v of maxBySession.values()) total += v
  return { total, marks }
}

const STEP_MS = [
  60_000,               // 1m
  5 * 60_000,            // 5m
  15 * 60_000,           // 15m
  30 * 60_000,           // 30m
  60 * 60_000,           // 1h
  3 * 60 * 60_000,       // 3h
  6 * 60 * 60_000,       // 6h
  12 * 60 * 60_000,      // 12h
  24 * 60 * 60_000,      // 1d
]

/** Snaps the bucket width to a friendly clock step so bucket edges land on boundaries. */
export function timeBuckets(t0: number, t1: number, target = 100): {
  start: number
  step: number
  n: number
  index: (t: number) => number
} {
  const span = Math.max(1, t1 - t0)
  const ideal = span / Math.max(1, target)
  let step = STEP_MS[STEP_MS.length - 1]
  for (const candidate of STEP_MS) {
    if (candidate >= ideal) {
      step = candidate
      break
    }
  }
  const start = Math.floor(t0 / step) * step
  const n = Math.max(1, Math.ceil((t1 - start) / step))
  return { start, step, n, index: (t: number) => Math.floor((t - start) / step) }
}

/** Day labels for spans over three days, 6-hour labels below that. */
export function timeTicks(t0: number, t1: number): Array<{ t: number; label: string }> {
  const ticks: Array<{ t: number; label: string }> = []
  const THREE_DAYS = 3 * 24 * 60 * 60_000

  if (t1 - t0 > THREE_DAYS) {
    const day = 24 * 60 * 60_000
    for (let t = Math.ceil(t0 / day) * day; t <= t1; t += day) {
      ticks.push({ t, label: new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) })
    }
  } else {
    const sixHours = 6 * 60 * 60_000
    for (let t = Math.ceil(t0 / sixHours) * sixHours; t <= t1; t += sixHours) {
      ticks.push({ t, label: new Date(t).toLocaleTimeString(undefined, { hour: 'numeric' }) })
    }
  }

  return ticks
}

/** The real first/last timestamps — the chart domain always comes from data received, not the window requested. */
export function extent(events: OberEvent[]): { t0: number; t1: number } {
  if (events.length === 0) {
    const now = Date.now()
    return { t0: now - 24 * 60 * 60_000, t1: now }
  }
  let t0 = Infinity
  let t1 = -Infinity
  for (const e of events) {
    if (e.time < t0) t0 = e.time
    if (e.time > t1) t1 = e.time
  }
  return { t0, t1 }
}

export function totalBy<K>(events: OberEvent[], key: (e: OberEvent) => K): Map<K, number> {
  const out = new Map<K, number>()
  for (const e of events) {
    const k = key(e)
    out.set(k, (out.get(k) ?? 0) + e.cost)
  }
  return out
}

export function rankBy<K>(events: OberEvent[], key: (e: OberEvent) => K): K[] {
  const totals = totalBy(events, key)
  return [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k)
}
