// Tools — where the wall-clock goes. `toolMs` is a composite string per event
// ('Bash*3845+Edit*25'), so every bar here is the sum of parsed pairs, never a
// cast. Only ~72% of events carry the field at all, so the coverage tile is
// part of the chart: a ranking is only as honest as the share of events it saw.
import type { Chart, ChartApi } from '../lib/types'
import { parseToolMs } from '../lib/aggregate'
import { fmtDur, fmtInt, escapeHtml } from '../lib/format'
import {
  chartShell,
  statTiles,
  emptyState,
  tip,
  observeResize,
  seqColor,
  INK,
  OTHER_KEY,
  OTHER_COLOR,
} from './common'

const TOP_N = 12
const ROW_H = 26
const LABEL_W = 168
const PAD_R = 76

interface Row {
  name: string
  label: string
  ms: number
  calls: number
  share: number
}

// mcp__linear__create_issue -> linear:create_issue; anything else is left alone.
function displayName(name: string): string {
  const mcp = name.match(/^mcp__([^_]+(?:_[^_]+)*?)__(.+)$/)
  if (mcp) return `${mcp[1]}:${mcp[2]}`
  return name
}

export class ToolsChart implements Chart {
  private host: HTMLElement
  private api: ChartApi
  private unsub: (() => void) | null = null

  constructor(host: HTMLElement, api: ChartApi) {
    this.host = host
    this.api = api
  }

  render(): void {
    if (this.unsub) {
      this.unsub()
      this.unsub = null
    }

    const events = this.api.getEvents()
    const blurb =
      'Where the wall-clock goes, by tool' + (this.api.isDemo() ? ' · demo data' : '')
    const shell = chartShell(this.host, 'Tools', blurb)

    if (events.length === 0) {
      emptyState(shell.plot, 'No events in this window.')
      return
    }

    const msByTool = new Map<string, number>()
    const callsByTool = new Map<string, number>()
    let withField = 0
    for (const e of events) {
      const pairs = parseToolMs(e.toolMs)
      if (pairs.length === 0) continue
      withField++
      for (const [name, ms] of pairs) {
        msByTool.set(name, (msByTool.get(name) || 0) + ms)
        callsByTool.set(name, (callsByTool.get(name) || 0) + 1)
      }
    }

    if (msByTool.size === 0) {
      emptyState(shell.plot, 'No events in this window carry tool timings.')
      return
    }

    const total = [...msByTool.values()].reduce((a, b) => a + b, 0)
    const ranked = [...msByTool.entries()].sort((a, b) => b[1] - a[1])
    const head = ranked.slice(0, TOP_N)
    const tail = ranked.slice(TOP_N)

    const rows: Row[] = head.map(([name, ms]) => ({
      name,
      label: displayName(name),
      ms,
      calls: callsByTool.get(name) || 0,
      share: total > 0 ? ms / total : 0,
    }))
    if (tail.length > 0) {
      const ms = tail.reduce((s, [, v]) => s + v, 0)
      rows.push({
        name: OTHER_KEY,
        label: `${OTHER_KEY} (${tail.length} tools)`,
        ms,
        calls: tail.reduce((s, [n]) => s + (callsByTool.get(n) || 0), 0),
        share: total > 0 ? ms / total : 0,
      })
    }

    const width = Math.max(320, shell.plot.clientWidth || this.host.clientWidth || 640)
    const height = rows.length * ROW_H + 8
    const barMax = Math.max(40, width - LABEL_W - PAD_R)
    const peak = rows[0].ms || 1

    const NS = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(NS, 'svg')
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
    svg.setAttribute('width', String(width))
    svg.setAttribute('height', String(height))
    svg.style.maxWidth = '100%'
    svg.style.height = 'auto'
    svg.style.font = '11px system-ui, sans-serif'

    rows.forEach((row, i) => {
      const y = i * ROW_H
      const w = Math.max(1, (row.ms / peak) * barMax)

      const label = document.createElementNS(NS, 'text')
      label.setAttribute('x', String(LABEL_W - 10))
      label.setAttribute('y', String(y + ROW_H / 2))
      label.setAttribute('text-anchor', 'end')
      label.setAttribute('dominant-baseline', 'middle')
      label.setAttribute('fill', INK.secondary)
      label.textContent = row.label.length > 26 ? row.label.slice(0, 25) + '…' : row.label
      svg.appendChild(label)

      const track = document.createElementNS(NS, 'rect')
      track.setAttribute('x', String(LABEL_W))
      track.setAttribute('y', String(y + 5))
      track.setAttribute('width', String(barMax))
      track.setAttribute('height', String(ROW_H - 12))
      track.setAttribute('rx', '3')
      track.setAttribute('fill', INK.grid)
      track.setAttribute('fill-opacity', '0.45')
      svg.appendChild(track)

      const bar = document.createElementNS(NS, 'rect')
      bar.setAttribute('x', String(LABEL_W))
      bar.setAttribute('y', String(y + 5))
      bar.setAttribute('width', String(w))
      bar.setAttribute('height', String(ROW_H - 12))
      bar.setAttribute('rx', '3')
      // sequential ramp: magnitude, not identity — Other keeps the neutral slot
      bar.setAttribute('fill', row.name === OTHER_KEY ? OTHER_COLOR : seqColor(row.ms / peak))
      bar.style.cursor = 'default'
      bar.addEventListener('mousemove', (event) => {
        tip().show(
          `<div class="chart-tip-title">${escapeHtml(row.name)}</div>` +
            `<div>${fmtDur(row.ms)} · ${(row.share * 100).toFixed(1)}% of tool time</div>` +
            `<div>${fmtInt(row.calls)} event${row.calls === 1 ? '' : 's'} touched it</div>`,
          event.clientX,
          event.clientY,
        )
      })
      bar.addEventListener('mouseleave', () => tip().hide())
      svg.appendChild(bar)

      const value = document.createElementNS(NS, 'text')
      value.setAttribute('x', String(LABEL_W + barMax + 8))
      value.setAttribute('y', String(y + ROW_H / 2))
      value.setAttribute('dominant-baseline', 'middle')
      value.setAttribute('fill', INK.muted)
      value.textContent = `${fmtDur(row.ms)} · ${(row.share * 100).toFixed(0)}%`
      svg.appendChild(value)
    })

    shell.plot.appendChild(svg)

    const coverage = Math.round((withField / events.length) * 100)
    statTiles(shell.stats, [
      { label: 'Tool wall-clock', value: fmtDur(total) },
      { label: 'Distinct tools', value: fmtInt(msByTool.size) },
      { label: 'Busiest', value: rows[0].label },
      { label: 'Event coverage', value: `${coverage}%` },
    ])

    this.unsub = observeResize(shell.plot, () => this.render())
  }

  destroy(): void {
    if (this.unsub) this.unsub()
    this.unsub = null
    tip().hide()
  }
}
