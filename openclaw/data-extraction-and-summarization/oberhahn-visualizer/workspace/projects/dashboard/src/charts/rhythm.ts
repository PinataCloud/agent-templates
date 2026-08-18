// Rhythm — when the organization works. A 24-hour radial dial: each hour is
// a stacked radial bar of spend by person, midnight at the top, clockwise.
// Boundary radii are sqrt(cumulative dollars) so each band's annulus AREA is
// exactly proportional to its dollars, not just its radius.
import type { Chart, ChartApi } from '../lib/types'
import { arc, select } from 'd3'
import { rankBy } from '../lib/aggregate'
import { fmtMoney, escapeHtml, shortName } from '../lib/format'
import {
  chartShell,
  statTiles,
  legendChips,
  emptyState,
  tip,
  observeResize,
  personColor,
  OTHER_KEY,
  OTHER_COLOR,
  INK,
  MAX_SERIES,
} from './common'

const HOURS = 24

interface Seg {
  hour: number
  person: string
  value: number
  cumBefore: number
  cumAfter: number
  hourTotal: number
}

export class RhythmChart implements Chart {
  private host: HTMLElement
  private api: ChartApi
  private unsub: (() => void) | null = null

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
    const blurb = 'When the organization works, by hour of day' + (this.api.isDemo() ? ' · demo data' : '')
    const shell = chartShell(this.host, 'Rhythm', blurb)

    if (events.length === 0) {
      emptyState(shell.plot, 'No events in this window.')
      return
    }

    const ranked = rankBy(events, (e) => e.user)
    const top = ranked.slice(0, MAX_SERIES)
    const hasOther = ranked.length > MAX_SERIES
    const colorFor = (person: string) => (top.includes(person) ? personColor(person) : OTHER_COLOR)
    const keyFor = (person: string) => (top.includes(person) ? person : OTHER_KEY)
    const order = [...top, ...(hasOther ? [OTHER_KEY] : [])]

    const perHour: Map<string, number>[] = Array.from({ length: HOURS }, () => new Map())
    for (const e of events) {
      const hour = new Date(e.time).getHours()
      const key = keyFor(e.user)
      const m = perHour[hour]
      m.set(key, (m.get(key) || 0) + e.cost)
    }

    const hourTotals = perHour.map((m) => [...m.values()].reduce((a, b) => a + b, 0))
    const maxHourTotal = Math.max(...hourTotals, 0) || 1
    const windowTotal = hourTotals.reduce((a, b) => a + b, 0)
    let peakHour = 0
    for (let h = 1; h < HOURS; h++) if (hourTotals[h] > hourTotals[peakHour]) peakHour = h

    const width = Math.max(280, shell.plot.clientWidth || this.host.clientWidth || 560)
    const size = Math.max(260, Math.min(width, 480))
    const R = size / 2 - 26
    const radius = (v: number) => Math.sqrt(Math.max(0, v) / maxHourTotal) * R

    const segs: Seg[] = []
    for (let h = 0; h < HOURS; h++) {
      let cum = 0
      for (const key of order) {
        const v = perHour[h].get(key) || 0
        if (v <= 0) continue
        segs.push({ hour: h, person: key, value: v, cumBefore: cum, cumAfter: cum + v, hourTotal: hourTotals[h] })
        cum += v
      }
    }

    const svg = select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'))
      .attr('viewBox', `${-size / 2} ${-size / 2} ${size} ${size}`)
      .attr('width', size)
      .attr('height', size)
      .style('max-width', '100%')
      .style('height', 'auto')
      .style('font', '10px system-ui, sans-serif')
    shell.plot.appendChild(svg.node()!)

    const angle = (h: number) => (h / HOURS) * 2 * Math.PI
    const pad = 0.02

    const arcGen = arc<Seg>()
      .startAngle((d) => angle(d.hour) + pad)
      .endAngle((d) => angle(d.hour + 1) - pad)
      .innerRadius((d) => radius(d.cumBefore))
      .outerRadius((d) => radius(d.cumAfter))

    svg
      .append('g')
      .selectAll('path')
      .data(segs)
      .join('path')
      .attr('d', (d) => arcGen(d))
      .attr('fill', (d) => colorFor(d.person))
      .style('cursor', 'default')
      .on('mousemove', (event: MouseEvent, d) => {
        const share = d.hourTotal > 0 ? Math.round((d.value / d.hourTotal) * 100) : 0
        const label = d.person === OTHER_KEY ? OTHER_KEY : shortName(d.person)
        tip().show(
          `<div class="chart-tip-title">${String(d.hour).padStart(2, '0')}:00 – ${String((d.hour + 1) % 24).padStart(2, '0')}:00</div><div>${escapeHtml(label)}: ${fmtMoney(d.value)} (${share}% of hour)</div>`,
          event.clientX,
          event.clientY,
        )
      })
      .on('mouseleave', () => tip().hide())

    // Asleep hours: no spend anywhere — faint dashed ring instead of a wedge.
    const asleepR = R * 0.12
    svg
      .append('g')
      .selectAll('path')
      .data(hourTotals.map((total, hour) => ({ hour, total })).filter((d) => d.total <= 0))
      .join('path')
      .attr(
        'd',
        (d) =>
          arc<{ hour: number; total: number }>()
            .startAngle(angle(d.hour) + pad)
            .endAngle(angle(d.hour + 1) - pad)
            .innerRadius(asleepR)
            .outerRadius(asleepR)(d) || '',
      )
      .attr('fill', 'none')
      .attr('stroke', INK.muted)
      .attr('stroke-dasharray', '2,3')
      .attr('stroke-width', 6)
      .attr('stroke-opacity', 0.5)

    // Hour tick labels every 3 hours
    const tickG = svg.append('g').attr('fill', INK.muted).attr('text-anchor', 'middle')
    for (let h = 0; h < HOURS; h += 3) {
      const a = angle(h + 0.5) - Math.PI / 2
      const x = Math.cos(a) * (R + 12)
      const y = Math.sin(a) * (R + 12)
      tickG
        .append('text')
        .attr('x', x)
        .attr('y', y)
        .attr('dominant-baseline', 'middle')
        .text(`${String(h).padStart(2, '0')}:00`)
    }

    const center = svg.append('text').attr('text-anchor', 'middle').attr('fill', INK.primary)
    center.append('tspan').attr('x', 0).attr('y', -4).style('font-size', '13px').text(fmtMoney(windowTotal))
    center
      .append('tspan')
      .attr('x', 0)
      .attr('y', 13)
      .style('font-size', '11px')
      .attr('fill', INK.muted)
      .text(`peak ${String(peakHour).padStart(2, '0')}:00`)

    const legendItems = order.map((key) => ({
      label: key === OTHER_KEY ? OTHER_KEY : shortName(key),
      color: key === OTHER_KEY ? OTHER_COLOR : personColor(key),
      note: fmtMoney(hourTotals.reduce((s, _t, h) => s + (perHour[h].get(key) || 0), 0)),
    }))
    legendChips(shell.legend, legendItems)

    const asleepCount = hourTotals.filter((t) => t <= 0).length
    statTiles(shell.stats, [
      { label: 'Window spend', value: fmtMoney(windowTotal) },
      { label: 'Peak hour', value: `${String(peakHour).padStart(2, '0')}:00 · ${fmtMoney(hourTotals[peakHour])}` },
      { label: 'Asleep hours', value: `${asleepCount} / ${HOURS}` },
    ])

    this.unsub = observeResize(shell.plot, () => this.render())
  }

  destroy(): void {
    if (this.unsub) this.unsub()
    this.unsub = null
    tip().hide()
  }
}
