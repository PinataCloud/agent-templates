export function fmtMoney(v: number): string {
  const sign = v < 0 ? '-' : ''
  const abs = Math.abs(v)
  // sub-cent real spend (unpriced/opus edge cases) needs more precision than 2 decimals to be visible at all
  if (abs > 0 && abs < 0.01) {
    return `${sign}$${abs.toFixed(3)}`
  }
  return `${sign}$${abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function fmtDur(ms: number): string {
  const abs = Math.abs(ms)
  if (abs < 1000) return `${Math.round(ms)}ms`
  if (abs < 60_000) return `${(ms / 1000).toFixed(1)}s`
  if (abs < 3_600_000) return `${(ms / 60_000).toFixed(1)}m`
  return `${(ms / 3_600_000).toFixed(1)}h`
}

export function fmtInt(v: number): string {
  const sign = v < 0 ? '-' : ''
  const abs = Math.abs(v)
  if (abs < 10_000) return `${sign}${Math.round(abs).toLocaleString('en-US')}`
  if (abs < 1_000_000) return `${sign}${(abs / 1000).toFixed(1)}k`
  if (abs < 1_000_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`
  return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`
}

export function fmtTokens(v: number): string {
  const sign = v < 0 ? '-' : ''
  const abs = Math.abs(v)
  if (abs < 1000) return `${sign}${Math.round(abs)}`
  if (abs < 1_000_000) return `${sign}${(abs / 1000).toFixed(0)}k`
  if (abs < 1_000_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`
  return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`
}

export function fmtRange(t0: number, t1: number): string {
  const d0 = new Date(t0)
  const d1 = new Date(t1)
  const dateOpts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }

  if (d0.toDateString() === d1.toDateString()) {
    const day = d0.toLocaleDateString(undefined, dateOpts)
    const time0 = d0.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    const time1 = d1.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    return `${day}, ${time0} – ${time1}`
  }

  const sameYear = d0.getFullYear() === d1.getFullYear()
  const left = d0.toLocaleDateString(undefined, dateOpts)
  const right = d1.toLocaleDateString(undefined, sameYear ? dateOpts : { ...dateOpts, year: 'numeric' })
  return `${left} – ${right}`
}

export function shortName(id: string): string {
  if (!id) return ''
  const at = id.indexOf('@')
  const base = at > 0 ? id.slice(0, at) : id
  const MAX = 16
  return base.length > MAX ? `${base.slice(0, MAX - 1)}…` : base
}

/** Stable 0-359 hue derived from a string, so the same id always gets the same color. */
export function hashHue(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0
  }
  return Math.abs(h) % 360
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
