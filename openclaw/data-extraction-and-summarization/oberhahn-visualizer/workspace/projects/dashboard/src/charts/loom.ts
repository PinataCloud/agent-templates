// Loom — who is running what, in parallel. One lane per person; each session
// is a bar coloured by project, stacked within the lane when sessions
// overlap so concurrency reads as thickness, not switching.
import type { Chart, ChartApi, OberEvent } from '../lib/types'
import { fmtMoney, fmtDur, fmtRange, escapeHtml, shortName } from '../lib/format'
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

interface Session {
  id: string
  user: string
  project: string
  t0: number
  t1: number
  cost: number
  title: string | null
  turns: number
  unattended: boolean
  lane: number
}

const ROW_H = 30
const BAR_H = 18
const PAD_LEFT = 110
const PAD_RIGHT = 12
const PAD_TOP = 12
const PAD_BOTTOM = 26

export class LoomChart implements Chart {
  private host: HTMLElement
  private api: ChartApi
  private canvas: HTMLCanvasElement | null = null
  private unsub: (() => void) | null = null
  private sessions: Session[] = []
  private users: string[] = []
  private t0 = 0
  private t1 = 0
  private plotX0 = PAD_LEFT
  private plotX1 = 0
  private width = 0
  private height = 0
  private colorFor: (p: string) => string = () => OTHER_COLOR
  private boundMove = (ev: MouseEvent) => this.handleMove(ev)
  private boundLeave = () => tip().hide()

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
    const blurb = 'Who is running what, in parallel' + (this.api.isDemo() ? ' · demo data' : '')
    const shell = chartShell(this.host, 'Loom', blurb)
    if (events.length === 0) {
      emptyState(shell.plot, 'No events in this window.')
      return
    }

    const palette = projectPalette(events)
    this.colorFor = (p: string) => (palette.top.includes(p) ? palette.color(p) : OTHER_COLOR)

    const bySession = new Map<string, OberEvent[]>()
    for (const e of events) {
      const key = e.session || 'nosession:' + e.user + ':' + e.time
      if (!bySession.has(key)) bySession.set(key, [])
      bySession.get(key)!.push(e)
    }

    const sessions: Session[] = []
    for (const [id, list] of bySession) {
      list.sort((a, b) => a.time - b.time)
      const first = list[0]
      const last = list[list.length - 1]
      sessions.push({
        id,
        user: first.user,
        project: first.project,
        t0: first.time,
        t1: Math.max(last.time, first.time + 60_000),
        cost: list.reduce((s, e) => s + e.cost, 0),
        title: first.title,
        turns: Math.max(...list.map((e) => e.turn || 0)),
        unattended: list.some((e) => e.unattended),
        lane: 0,
      })
    }

    const { t0, t1 } = this.api.getRange()
    this.t0 = t0
    this.t1 = t1

    const users = [...new Set(sessions.map((s) => s.user))].sort(
      (a, b) => this.userCost(sessions, b) - this.userCost(sessions, a),
    )
    this.users = users
    this.sessions = sessions

    // Stack overlapping sessions within a lane so concurrency shows as thickness.
    const laneEndsByUser = new Map<string, number[]>()
    for (const user of users) {
      const own = sessions.filter((s) => s.user === user).sort((a, b) => a.t0 - b.t0)
      const laneEnds: number[] = []
      for (const s of own) {
        let lane = laneEnds.findIndex((end) => end <= s.t0)
        if (lane === -1) {
          lane = laneEnds.length
          laneEnds.push(s.t1)
        } else {
          laneEnds[lane] = s.t1
        }
        s.lane = lane
      }
      laneEndsByUser.set(user, laneEnds)
    }
    const maxLanesByUser = new Map<string, number>()
    for (const user of users) {
      const count = Math.max(1, ...sessions.filter((s) => s.user === user).map((s) => s.lane + 1))
      maxLanesByUser.set(user, count)
    }

    let y = PAD_TOP
    const rowY = new Map<string, number>()
    const rowH = new Map<string, number>()
    for (const user of users) {
      const lanes = maxLanesByUser.get(user) || 1
      const h = Math.max(ROW_H, lanes * (BAR_H + 4) + 8)
      rowY.set(user, y)
      rowH.set(user, h)
      y += h
    }

    const width = Math.max(360, shell.plot.clientWidth || this.host.clientWidth || 640)
    const height = y + PAD_BOTTOM
    this.width = width
    this.height = height
    this.plotX0 = PAD_LEFT
    this.plotX1 = width - PAD_RIGHT

    const canvas = document.createElement('canvas')
    shell.plot.appendChild(canvas)
    this.canvas = canvas
    const ctx = setupCanvas(canvas, width, height)
    ctx.clearRect(0, 0, width, height)

    const xScale = (t: number) => this.plotX0 + ((t - t0) / (t1 - t0 || 1)) * (this.plotX1 - this.plotX0)

    ctx.font = '10px system-ui, sans-serif'
    ctx.textBaseline = 'middle'
    for (const user of users) {
      const ry = rowY.get(user)!
      const rh = rowH.get(user)!
      ctx.strokeStyle = INK.grid
      ctx.beginPath()
      ctx.moveTo(this.plotX0, ry + rh)
      ctx.lineTo(this.plotX1, ry + rh)
      ctx.stroke()
      ctx.fillStyle = INK.secondary
      ctx.textAlign = 'right'
      ctx.fillText(shortName(user), this.plotX0 - 8, ry + rh / 2)
    }

    for (const s of sessions) {
      const ry = rowY.get(s.user)!
      const x0 = Math.max(this.plotX0, xScale(s.t0))
      const x1 = Math.min(this.plotX1, xScale(s.t1))
      const y0 = ry + 6 + s.lane * (BAR_H + 4)
      ctx.fillStyle = this.colorFor(s.project)
      ctx.globalAlpha = s.unattended ? 0.55 : 0.95
      const w = Math.max(2, x1 - x0)
      this.roundRect(ctx, x0, y0, w, BAR_H, 4)
      ctx.fill()
      if (s.unattended) {
        ctx.setLineDash([2, 2])
        ctx.strokeStyle = INK.accent
        ctx.globalAlpha = 0.8
        ctx.stroke()
        ctx.setLineDash([])
      }
      ctx.globalAlpha = 1
    }

    ctx.strokeStyle = INK.grid
    ctx.fillStyle = INK.muted
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    const span = t1 - t0
    const dayMs = 864e5
    const step = span > 3 * dayMs ? dayMs : 6 * 36e5
    for (let t = Math.ceil(t0 / step) * step; t < t1; t += step) {
      const x = xScale(t)
      ctx.beginPath()
      ctx.moveTo(x, PAD_TOP)
      ctx.lineTo(x, height - PAD_BOTTOM)
      ctx.globalAlpha = 0.3
      ctx.stroke()
      ctx.globalAlpha = 1
      const label =
        step === dayMs
          ? new Date(t).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })
          : new Date(t).toLocaleTimeString(undefined, { hour: '2-digit' })
      ctx.fillText(label, x, height - PAD_BOTTOM + 6)
    }

    canvas.addEventListener('mousemove', this.boundMove)
    canvas.addEventListener('mouseleave', this.boundLeave)
    this.unsub = observeResize(shell.plot, () => this.render())

    const legendItems = [
      ...palette.top.map((p) => ({ label: p, color: palette.color(p) })),
      ...(palette.hasOther ? [{ label: OTHER_KEY, color: OTHER_COLOR }] : []),
    ]
    legendChips(shell.legend, legendItems)

    const totalSessions = sessions.length
    const concurrent = Math.max(...[...maxLanesByUser.values()], 1)
    const totalCost = sessions.reduce((s, x) => s + x.cost, 0)
    statTiles(shell.stats, [
      { label: 'Sessions', value: String(totalSessions) },
      { label: 'People', value: String(users.length) },
      { label: 'Peak concurrency (one person)', value: String(concurrent) },
      { label: 'Window spend', value: fmtMoney(totalCost) },
    ])
    this.rowY = rowY
  }

  private rowY = new Map<string, number>()

  private userCost(sessions: Session[], user: string): number {
    return sessions.filter((s) => s.user === user).reduce((a, s) => a + s.cost, 0)
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    const rr = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + rr, y)
    ctx.arcTo(x + w, y, x + w, y + h, rr)
    ctx.arcTo(x + w, y + h, x, y + h, rr)
    ctx.arcTo(x, y + h, x, y, rr)
    ctx.arcTo(x, y, x + w, y, rr)
    ctx.closePath()
  }

  private handleMove(ev: MouseEvent): void {
    if (!this.canvas) return
    const rect = this.canvas.getBoundingClientRect()
    const x = ev.clientX - rect.left
    const y = ev.clientY - rect.top
    const xScale = (t: number) => this.plotX0 + ((t - this.t0) / (this.t1 - this.t0 || 1)) * (this.plotX1 - this.plotX0)
    for (const s of this.sessions) {
      const ry = this.rowY.get(s.user)
      if (ry === undefined) continue
      const y0 = ry + 6 + s.lane * (BAR_H + 4)
      const x0 = xScale(s.t0)
      const x1 = xScale(s.t1)
      if (x >= x0 && x <= x1 && y >= y0 && y <= y0 + BAR_H) {
        const html = `<div class="chart-tip-title">${escapeHtml(s.title || 'untitled session')}</div><div>${escapeHtml(shortName(s.user))} · ${escapeHtml(s.project)}</div><div>${escapeHtml(fmtRange(s.t0, s.t1))} · ${fmtDur(s.t1 - s.t0)}</div><div>${s.turns} turns · ${fmtMoney(s.cost)}${s.unattended ? ' · unattended' : ''}</div>`
        tip().show(html, ev.clientX, ev.clientY)
        return
      }
    }
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
    tip().hide()
  }
}
