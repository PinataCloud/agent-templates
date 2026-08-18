// Shared palette, canvas and DOM-shell helpers used by every chart in the
// gallery. Colours are read from CSS custom properties at call time (never
// cached at module load) so that restyling `src/styles/global.css` restyles
// every chart on its next render.
import type { OberEvent } from '../lib/types'
import { rankBy } from '../lib/aggregate'
import { hashHue } from '../lib/format'

export const SLOT_COUNT = 8
export const MAX_SERIES = 7 // slots used for ranked categories; the 8th bucket is Other
export const OTHER_KEY = 'Other'

const SLOT_FALLBACKS = [
  '#3987e5',
  '#d95926',
  '#199e70',
  '#c98500',
  '#d55181',
  '#008300',
  '#9085e9',
  '#e66767',
]

export function cssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined' || typeof getComputedStyle !== 'function') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

// --chart-1 .. --chart-8, validated for the dark surface (adjacent ΔE 8.4
// under common CVD, 19.3 for normal vision, all ≥3:1 contrast). Fixed order,
// never cycled: projects are ranked once by total spend, see projectPalette.
export function slots(): string[] {
  return SLOT_FALLBACKS.map((fallback, i) => cssVar(`--chart-${i + 1}`, fallback))
}

export const OTHER_COLOR = cssVar('--chart-other', '#5c6270')

export const INK = {
  get primary() {
    return cssVar('--ink', '#eef1f6')
  },
  get secondary() {
    return cssVar('--ink-secondary', '#c3c2b7')
  },
  get muted() {
    return cssVar('--ink-muted', '#898781')
  },
  get grid() {
    return cssVar('--chart-grid', '#272b33')
  },
  get baseline() {
    return cssVar('--chart-baseline', '#3a3f4a')
  },
  get surface() {
    return cssVar('--chart-surface', '#11141b')
  },
  get accent() {
    return cssVar('--chart-accent', '#ffd166')
  },
}

export function personColor(id: string): string {
  return `hsl(${hashHue(id)} 55% 55%)`
}

export interface Palette {
  ranked: string[]
  top: string[]
  hasOther: boolean
  key(name: string): string
  color(name: string): string
}

// Rank projects by total cost; top MAX_SERIES get fixed slots, rest fold into Other.
export function projectPalette(events: OberEvent[]): Palette {
  const ranked = rankBy(events, (e) => e.project)
  const top = ranked.slice(0, MAX_SERIES)
  const palette = slots()
  const other = cssVar('--chart-other', '#5c6270')
  const colorMap = new Map<string, string>(top.map((p, i) => [p, palette[i]]))
  return {
    ranked,
    top,
    hasOther: ranked.length > MAX_SERIES,
    key: (project: string) => (colorMap.has(project) ? project : OTHER_KEY),
    color: (project: string) => colorMap.get(project) || other,
  }
}

// Single-hue sequential ramp for the dark surface: near zero recedes toward
// the surface, magnitude brightens through blue.
const RAMP = ['#161d2c', '#1c3050', '#234a7e', '#2d67b3', '#3987e5', '#6da7ec', '#9ec5f4']
function hexToRgb(h: string): [number, number, number] {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
}
export function seqColor(t: number): string {
  const x = Math.max(0, Math.min(1, t)) * (RAMP.length - 1)
  const i = Math.min(RAMP.length - 2, Math.floor(x))
  const f = x - i
  const a = hexToRgb(RAMP[i])
  const b = hexToRgb(RAMP[i + 1])
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * f)},${Math.round(a[1] + (b[1] - a[1]) * f)},${Math.round(a[2] + (b[2] - a[2]) * f)})`
}

export function setupCanvas(canvas: HTMLCanvasElement, w: number, h: number): CanvasRenderingContext2D {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  canvas.style.width = w + 'px'
  canvas.style.height = h + 'px'
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d context unavailable')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return ctx
}

// One shared tooltip element for the whole app.
let tipEl: HTMLDivElement | null = null
export function tip(): { show(html: string, x: number, y: number): void; hide(): void } {
  if (!tipEl) {
    tipEl = document.createElement('div')
    tipEl.id = 'chart-tip'
    tipEl.className = 'hidden'
    document.body.appendChild(tipEl)
  }
  const el = tipEl
  return {
    show(html: string, x: number, y: number) {
      el.innerHTML = html
      el.classList.remove('hidden')
      const r = el.getBoundingClientRect()
      const px = Math.min(x + 14, window.innerWidth - r.width - 10)
      const py = Math.min(Math.max(10, y - r.height - 12), window.innerHeight - r.height - 10)
      el.style.left = px + 'px'
      el.style.top = (y - r.height - 12 < 10 ? y + 16 : py) + 'px'
    },
    hide() {
      el.classList.add('hidden')
    },
  }
}

export interface Shell {
  root: HTMLElement
  head: HTMLElement
  legend: HTMLElement
  stats: HTMLElement
  plot: HTMLElement
}

// Standard chart markup: title, blurb, legend row, stat tiles, plot area.
// Clears the host first so render() can be called repeatedly without
// accumulating duplicate DOM.
export function chartShell(host: HTMLElement, title: string, blurb: string): Shell {
  host.innerHTML = ''

  const root = document.createElement('div')
  root.className = 'chart'

  const head = document.createElement('div')
  head.className = 'chart-head'
  const h = document.createElement('h3')
  h.className = 'chart-title'
  h.textContent = title
  const p = document.createElement('p')
  p.className = 'chart-blurb'
  p.textContent = blurb
  head.append(h, p)

  const legend = document.createElement('div')
  legend.className = 'chart-legend'

  const stats = document.createElement('div')
  stats.className = 'chart-stats'

  const plot = document.createElement('div')
  plot.className = 'chart-plot'

  root.append(head, legend, stats, plot)
  host.appendChild(root)

  return { root, head, legend, stats, plot }
}

export function statTiles(el: HTMLElement, tiles: Array<{ label: string; value: string }>): void {
  el.innerHTML = ''
  el.className = 'chart-stats'
  for (const tile of tiles) {
    const wrap = document.createElement('div')
    wrap.className = 'chart-stat'
    const value = document.createElement('div')
    value.className = 'chart-stat-value'
    value.textContent = tile.value
    const label = document.createElement('div')
    label.className = 'chart-stat-label'
    label.textContent = tile.label
    wrap.append(value, label)
    el.appendChild(wrap)
  }
}

export function legendChips(
  el: HTMLElement,
  items: Array<{ label: string; color: string; note?: string }>,
): void {
  el.innerHTML = ''
  el.className = 'chart-legend'
  for (const item of items) {
    const chip = document.createElement('span')
    chip.className = 'chart-chip'
    const swatch = document.createElement('span')
    swatch.className = 'chart-chip-swatch'
    swatch.style.background = item.color
    const label = document.createElement('span')
    label.className = 'chart-chip-label'
    label.textContent = item.note ? `${item.label} · ${item.note}` : item.label
    chip.append(swatch, label)
    el.appendChild(chip)
  }
}

export function emptyState(el: HTMLElement, message: string): void {
  el.innerHTML = ''
  el.className = 'chart-plot chart-empty-wrap'
  const div = document.createElement('div')
  div.className = 'chart-empty'
  div.textContent = message
  el.appendChild(div)
}

// Debounced ResizeObserver; returns an unsubscribe function.
export function observeResize(el: HTMLElement, cb: () => void): () => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  let frame: number | null = null
  const fire = () => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      if (frame) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(cb)
    }, 120)
  }
  const ro = new ResizeObserver(fire)
  ro.observe(el)
  return () => {
    ro.disconnect()
    if (timeout) clearTimeout(timeout)
    if (frame) cancelAnimationFrame(frame)
  }
}
