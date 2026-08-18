import type { OberEvent } from './types'
import { normalize } from './normalize'
import { demoHistory, demoLiveEvent } from './demo'

export interface Range {
  label: string
  days: number
}

export const RANGES: Range[] = [
  { label: '24h', days: 1 },
  { label: '3d', days: 3 },
  { label: '7d', days: 7 },
]

export interface LoadResult {
  events: OberEvent[]
  demo: boolean
  reason?: string
}

function apiUrl(pathAndQuery: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '')
  return `${base}/${pathAndQuery}`
}

interface EventsEnvelope {
  events?: unknown[]
  total?: number
  message?: string
}

async function readEnvelope(res: Response): Promise<EventsEnvelope> {
  try {
    return (await res.json()) as EventsEnvelope
  } catch {
    return {}
  }
}

export async function loadHistory(days: number): Promise<LoadResult> {
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const url = apiUrl(`api/v0/events?limit=20000&start_date=${encodeURIComponent(start)}`)

  try {
    const res = await fetch(url)

    if (res.status === 503) {
      const body = await readEnvelope(res)
      return { events: demoHistory(days), demo: true, reason: body.message ?? 'no API key configured on the server' }
    }
    if (!res.ok) {
      return { events: demoHistory(days), demo: true, reason: `ledger request failed (${res.status})` }
    }

    const body = await readEnvelope(res)
    const events = normalize(Array.isArray(body.events) ? body.events : [])
    if (events.length === 0) {
      // a "last N days" request can return zero rows if that window truly has no data —
      // the domain should come from real events, so fall back rather than render nothing
      return { events: demoHistory(days), demo: true, reason: 'ledger returned no events for this window' }
    }
    return { events, demo: false }
  } catch (err) {
    return { events: demoHistory(days), demo: true, reason: err instanceof Error ? err.message : 'network error' }
  }
}

// `demo` mirrors the mode loadHistory landed in. Only a demo view invents an
// event on failure — injecting a generated row into a live view would put
// fabricated spend in front of someone reading real numbers.
export async function pollNew(sinceTime: number, demo = false): Promise<OberEvent[]> {
  const start = new Date(sinceTime + 1).toISOString()
  const url = apiUrl(`api/v0/events?limit=5000&start_date=${encodeURIComponent(start)}`)
  const onFailure = () => (demo ? [demoLiveEvent()] : [])

  if (demo) return [demoLiveEvent()]

  try {
    const res = await fetch(url)
    if (res.status === 503 || !res.ok) return onFailure()

    const body = await readEnvelope(res)
    const events = normalize(Array.isArray(body.events) ? body.events : [])
    // start_date is inclusive at ms granularity, so the boundary row can come back again
    return events.filter((e) => e.time > sinceTime)
  } catch {
    return onFailure()
  }
}
