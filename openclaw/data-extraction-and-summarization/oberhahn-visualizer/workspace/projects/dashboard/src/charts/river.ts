// River — where the money goes over time. Stacked area of spend per time
// bucket, one band per project (ranked palette, tail folded into Other), plus
// a distinct hatched band on top for costUnknown events: real tokens burned,
// dollars unknown, never folded into the $0 baseline.
import type { Chart, ChartApi } from '../lib/types'
import { timeBuckets, timeTicks } from '../lib/aggregate'
import { fmtMoney, fmtRange, fmtTokens, escapeHtml } from '../lib/format'
import {
  chartShell,
  statTiles,
  legendChips,
  emptyState,
  setupCanvas,
  tip,
  observeResize,
  projectPalette,
  OTHER_KEY,
  OTHER_COLOR,
  INK,
} from './common'

const BUCKET_TARGET = 100
const TOKEN_BAND_H = 44
const PAD_LEFT = 58
const PAD_RIGHT = 12
const PAD_TOP = 12
const PAD_BOTTOM = 28
const HEIGHT = 360

interface Row {
  t: number
  parts: Map<string, number>
  unknownTokens: number
  total: number
}

interface Layout {
  rows: Row[]
  order: string[]
  colorFor: (key: string) => string
  maxMoney: number
  maxTokens: number
  domainT0: number
  domainT1: number
  step: number
  plotX0: number
  plotX1: number
  moneyTop: number
  moneyBottom: number
  tokenTop: number
  tokenBottom: number
  width: number
  height: number
}

export class RiverChart implements Chart {
  private host: HTMLElement
  private api: ChartApi
  private canvas: HTMLCanvasElement | null = null
  private unsub: (() => void) | null = null
  private layout: Layout | null = null
  private hoverIndex = -1
  private boundMove = (ev: MouseEvent) => this.handleMove(ev)
  private boundLeave = () => this.handleLeave()

  constructor(host: HTMLElement, api: ChartApi) {
    this.host = host
    this.api = api
  }

  render(): void {
    // chartShell() replaces the host's DOM, so the observer from the previous
    // render is watching a detached node — drop it before observing the new one.
    if (this.unsub) {
      this.unsub()
      this.unsub = null
    }

    const events = this.api.getEvents()
    const blurb = 'Where the money goes over time' + (this.api.isDemo() ? ' · demo data' : '')
    const shell = chartShell(this.host, 'River', blurb)

    if (events.length === 0) {
      emptyState(shell.plot, 'No events in this window.')
      return
    }

    const { t0: reqT0, t1: reqT1 } = this.api.getRange()
    const buckets = timeBuckets(reqT0, reqT1, BUCKET_TARGET)
    const domainT0 = buckets.start
    const domainT1 = buckets.start + buckets.n * buckets.step

    const palette = projectPalette(events)
    const order = [...palette.top, ...(palette.hasOther ? [OTHER_KEY] : [])]
    const colorFor = (key: string) => (key === OTHER_KEY ? OTHER_COLOR : palette.color(key))

    const rows: Row[] = Array.from({ length: buckets.n }, (_, i) => ({
      t: buckets.start + i * buckets.step,
      parts: new Map<string, number>(),
      unknownTokens: 0,
      total: 0,
    }))

    for (const e of events) {
      const i = buckets.index(e.time)
      if (i < 0 || i >= rows.length) continue
      const row = rows[i]
      if (e.costUnknown) {
        const tk = e.tokens
        row.unknownTokens += tk.input + tk.output + tk.cacheRead + tk.cacheWrite
        continue
      }
      const key = palette.key(e.project)
      row.parts.set(key, (row.parts.get(key) || 0) + e.cost)
      row.total += e.cost
    }

    let maxMoney = 0
    let maxTokens = 0
    for (const row of rows) {
      if (row.total > maxMoney) maxMoney = row.total
      if (row.unknownTokens > maxTokens) maxTokens = row.unknownTokens
    }

    const width = Math.max(320, shell.plot.clientWidth || this.host.clientWidth || 640)
    const canvas = document.createElement('canvas')
    shell.plot.appendChild(canvas)
    this.canvas = canvas

    const tokenBand = maxTokens > 0 ? TOKEN_BAND_H : 0
    const tokenTop = PAD_TOP
    const tokenBottom = PAD_TOP + tokenBand
    const moneyTop = tokenBottom + (tokenBand ? 14 : 0)
    const moneyBottom = HEIGHT - PAD_BOTTOM

    this.layout = {
      rows,
      order,
      colorFor,
      maxMoney,
      maxTokens,
      domainT0,
      domainT1,
      step: buckets.step,
      plotX0: PAD_LEFT,
      plotX1: width - PAD_RIGHT,
      moneyTop,
      moneyBottom,
      tokenTop,
      tokenBottom,
      width,
      height: HEIGHT,
    }

    this.draw()

    const totalSpend = rows.reduce((s, r) => s + r.total, 0)
    const totalUnknownTokens = rows.reduce((s, r) => s + r.unknownTokens, 0)
    const peak = rows.reduce((best, r) => (r.total > best.total ? r : best), rows[0])
    const days = Math.max((reqT1 - reqT0) / 864e5, 1 / 24)
    statTiles(shell.stats, [
      { label: 'Window spend', value: fmtMoney(totalSpend) },
      {
        label: 'Peak bucket',
        value: `${fmtMoney(peak.total)} · ${fmtRange(peak.t, peak.t + buckets.step)}`,
      },
      { label: 'Daily average', value: fmtMoney(totalSpend / days) },
    ])

    const legendItems = order.map((key) => ({ label: key, color: colorFor(key) }))
    if (totalUnknownTokens > 0) {
      legendItems.push({
        label: 'Unpriced (tokens)',
        color: this.hatchCss(INK.secondary),
      })
    }
    legendChips(shell.legend, legendItems)

    canvas.addEventListener('mousemove', this.boundMove)
    canvas.addEventListener('mouseleave', this.boundLeave)
    this.unsub = observeResize(shell.plot, () => this.render())
  }

  private hatchCss(color: string): string {
    return `repeating-linear-gradient(45deg, ${color}, ${color} 2px, transparent 2px, transparent 5px)`
  }

  private xScale(t: number): number {
    const l = this.layout!
    const span = l.domainT1 - l.domainT0 || 1
    return l.plotX0 + ((t - l.domainT0) / span) * (l.plotX1 - l.plotX0)
  }

  private draw(): void {
    const l = this.layout
    const canvas = this.canvas
    if (!l || !canvas) return
    const ctx = setupCanvas(canvas, l.width, l.height)
    ctx.clearRect(0, 0, l.width, l.height)

    // Money gridlines + axis
    ctx.strokeStyle = INK.grid
    ctx.fillStyle = INK.muted
    ctx.font = '10px system-ui, sans-serif'
    ctx.textBaseline = 'middle'
    const moneySteps = 4
    for (let i = 0; i <= moneySteps; i++) {
      const v = (l.maxMoney * i) / moneySteps
      const y = l.moneyBottom - (v / (l.maxMoney || 1)) * (l.moneyBottom - l.moneyTop)
      ctx.beginPath()
      ctx.moveTo(l.plotX0, y)
      ctx.lineTo(l.plotX1, y)
      ctx.stroke()
      ctx.textAlign = 'right'
      ctx.fillText(fmtMoney(v), l.plotX0 - 8, y)
    }

    // Stacked money bands
    const n = l.rows.length
    for (const key of l.order) {
      ctx.fillStyle = l.colorFor(key)
      ctx.beginPath()
      for (let i = 0; i < n; i++) {
        const x = this.xScale(l.rows[i].t)
        const below = this.stackBelow(l.rows[i], key, l.order)
        const y = l.moneyBottom - (below / (l.maxMoney || 1)) * (l.moneyBottom - l.moneyTop)
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      for (let i = n - 1; i >= 0; i--) {
        const x = this.xScale(l.rows[i].t)
        const above = this.stackBelow(l.rows[i], key, l.order) + (l.rows[i].parts.get(key) || 0)
        const y = l.moneyBottom - (above / (l.maxMoney || 1)) * (l.moneyBottom - l.moneyTop)
        ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.fill()
    }

    // Baseline
    ctx.strokeStyle = INK.baseline
    ctx.beginPath()
    ctx.moveTo(l.plotX0, l.moneyBottom)
    ctx.lineTo(l.plotX1, l.moneyBottom)
    ctx.stroke()

    // Unknown-token band (hatched, its own scale — real tokens, no dollar value)
    if (l.maxTokens > 0) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(l.plotX0, l.tokenTop, l.plotX1 - l.plotX0, l.tokenBottom - l.tokenTop)
      ctx.clip()
      ctx.fillStyle = INK.surface
      ctx.fillRect(l.plotX0, l.tokenTop, l.plotX1 - l.plotX0, l.tokenBottom - l.tokenTop)
      ctx.beginPath()
      for (let i = 0; i < n; i++) {
        const x = this.xScale(l.rows[i].t)
        const y = l.tokenBottom - (l.rows[i].unknownTokens / l.maxTokens) * (l.tokenBottom - l.tokenTop)
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.lineTo(l.plotX1, l.tokenBottom)
      ctx.lineTo(l.plotX0, l.tokenBottom)
      ctx.closePath()
      ctx.fillStyle = INK.secondary
      ctx.globalAlpha = 0.35
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.lineWidth = 1
      for (let x = l.plotX0; x < l.plotX1; x += 6) {
        ctx.beginPath()
        ctx.moveTo(x, l.tokenBottom)
        ctx.lineTo(x + (l.tokenBottom - l.tokenTop), l.tokenTop)
        ctx.strokeStyle = INK.secondary
        ctx.globalAlpha = 0.5
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      ctx.restore()
      ctx.fillStyle = INK.muted
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText('unpriced tokens', l.plotX0, l.tokenTop - 1)
    }

    // Time axis
    ctx.fillStyle = INK.muted
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    const ticks = timeTicks(l.domainT0, l.domainT1)
    for (const tck of ticks) {
      const x = this.xScale(tck.t)
      ctx.strokeStyle = INK.grid
      ctx.beginPath()
      ctx.moveTo(x, l.moneyTop)
      ctx.lineTo(x, l.moneyBottom)
      ctx.globalAlpha = 0.4
      ctx.stroke()
      ctx.globalAlpha = 1
      ctx.fillText(tck.label, x, l.moneyBottom + 6)
    }

    if (this.hoverIndex >= 0 && this.hoverIndex < n) {
      const row = l.rows[this.hoverIndex]
      const x = this.xScale(row.t)
      ctx.strokeStyle = INK.accent
      ctx.beginPath()
      ctx.moveTo(x, l.tokenTop)
      ctx.lineTo(x, l.moneyBottom)
      ctx.stroke()
    }
  }

  private stackBelow(row: Row, key: string, order: string[]): number {
    let sum = 0
    for (const k of order) {
      if (k === key) break
      sum += row.parts.get(k) || 0
    }
    return sum
  }

  private handleMove(ev: MouseEvent): void {
    const l = this.layout
    if (!l) return
    const rect = this.canvas!.getBoundingClientRect()
    const x = ev.clientX - rect.left
    if (x < l.plotX0 || x > l.plotX1) {
      this.handleLeave()
      return
    }
    const t = l.domainT0 + ((x - l.plotX0) / (l.plotX1 - l.plotX0)) * (l.domainT1 - l.domainT0)
    const idx = Math.min(l.rows.length - 1, Math.max(0, Math.floor((t - l.domainT0) / l.step)))
    this.hoverIndex = idx
    this.draw()

    const row = l.rows[idx]
    const lines: string[] = []
    const entries = l.order
      .map((key) => ({ key, value: row.parts.get(key) || 0 }))
      .filter((e) => e.value > 0)
      .sort((a, b) => b.value - a.value)
    for (const e of entries) {
      const share = row.total > 0 ? Math.round((e.value / row.total) * 100) : 0
      lines.push(
        `<div><span style="color:${l.colorFor(e.key)}">&#9632;</span> ${escapeHtml(e.key)}: ${fmtMoney(e.value)} (${share}%)</div>`,
      )
    }
    if (row.unknownTokens > 0) {
      lines.push(`<div class="chart-tip-muted">${fmtTokens(row.unknownTokens)} unpriced tokens</div>`)
    }
    const html = `<div class="chart-tip-title">${escapeHtml(fmtRange(row.t, row.t + l.step))}</div>${lines.join('')}<div class="chart-tip-total">Total: ${fmtMoney(row.total)}</div>`
    tip().show(html, ev.clientX, ev.clientY)
  }

  private handleLeave(): void {
    this.hoverIndex = -1
    this.draw()
    tip().hide()
  }

  destroy(): void {
    if (this.unsub) this.unsub()
    this.unsub = null
    if (this.canvas) {
      this.canvas.removeEventListener('mousemove', this.boundMove)
      this.canvas.removeEventListener('mouseleave', this.boundLeave)
    }
    this.canvas = null
    this.layout = null
    tip().hide()
  }
}
