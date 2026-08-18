// Prism — how spend decomposes across project → person → model. A zoomable
// d3 sunburst; arc angle at each ring is proportional to dollars because
// d3.partition allocates angular extent by hierarchy value.
import type { Chart, ChartApi } from '../lib/types'
import { hierarchy, partition, arc, interpolate, select } from 'd3'
import type { HierarchyRectangularNode } from 'd3'
import { fmtMoney, escapeHtml, shortName } from '../lib/format'
import {
  chartShell,
  statTiles,
  legendChips,
  emptyState,
  tip,
  observeResize,
  projectPalette,
  OTHER_KEY,
  OTHER_COLOR,
  INK,
} from './common'

interface RawNode {
  name: string
  value?: number
  children?: RawNode[]
}

interface ArcDatum {
  x0: number
  x1: number
  y0: number
  y1: number
}

type PNode = HierarchyRectangularNode<RawNode> & { current: ArcDatum; target?: ArcDatum }

// Deeper rings drift toward the ink so depth reads at a glance, regardless of
// which CSS colour the project slot resolves to.
function shade(color: string, towards: string, amount: number): string {
  return `color-mix(in srgb, ${color} ${Math.round((1 - amount) * 100)}%, ${towards})`
}

export class PrismChart implements Chart {
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
    const blurb = 'How spend decomposes: project, person, model' + (this.api.isDemo() ? ' · demo data' : '')
    const shell = chartShell(this.host, 'Prism', blurb)

    const priced = events.filter((e) => !e.costUnknown && e.cost > 0)
    if (priced.length === 0) {
      emptyState(shell.plot, 'No priced events in this window.')
      return
    }

    const palette = projectPalette(events)
    const colorFor = (project: string) => (palette.top.includes(project) ? palette.color(project) : OTHER_COLOR)

    const tree = new Map<string, Map<string, Map<string, number>>>()
    for (const e of priced) {
      const projectKey = palette.key(e.project)
      const modelKey = e.model || 'unknown-model'
      if (!tree.has(projectKey)) tree.set(projectKey, new Map())
      const people = tree.get(projectKey)!
      if (!people.has(e.user)) people.set(e.user, new Map())
      const models = people.get(e.user)!
      models.set(modelKey, (models.get(modelKey) || 0) + e.cost)
    }

    const data: RawNode = {
      name: 'root',
      children: [...tree.entries()].map(([project, people]) => ({
        name: project,
        children: [...people.entries()].map(([person, models]) => ({
          name: person,
          children: [...models.entries()].map(([model, cost]) => ({ name: model, value: cost })),
        })),
      })),
    }

    const width = Math.max(320, shell.plot.clientWidth || this.host.clientWidth || 640)
    const size = Math.max(280, Math.min(width, 520))
    const radius = size / 6

    const rootHierarchy = hierarchy(data)
      .sum((d) => d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0))
    const maxDepth = rootHierarchy.height + 1
    const root = partition<RawNode>().size([2 * Math.PI, maxDepth])(rootHierarchy) as PNode
    root.each((d) => {
      ;(d as PNode).current = { x0: d.x0, x1: d.x1, y0: d.y0, y1: d.y1 }
    })

    function arcVisible(d: ArcDatum): boolean {
      return d.y1 <= maxDepth && d.y0 >= 0 && d.x1 > d.x0
    }
    function labelVisible(d: ArcDatum): boolean {
      return d.y1 <= maxDepth && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.06
    }
    function labelTransform(d: ArcDatum, r: number): string {
      const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI
      const y = ((d.y0 + d.y1) / 2) * r
      return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`
    }

    const arcGen = arc<ArcDatum>()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.004))
      .padRadius(radius * 1.5)
      .innerRadius((d) => d.y0 * radius)
      .outerRadius((d) => Math.max(d.y0 * radius, d.y1 * radius - 1))

    const totalCost = root.value || 0

    const svg = select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'))
      .attr('viewBox', `${-size / 2} ${-size / 2} ${size} ${size}`)
      .attr('width', size)
      .attr('height', size)
      .style('max-width', '100%')
      .style('height', 'auto')
      .style('font', '10px system-ui, sans-serif')

    shell.plot.appendChild(svg.node()!)

    const nodeColor = (d: PNode): string => {
      const ancestors = d.ancestors()
      const projectNode = ancestors[ancestors.length - 2]
      const base = projectNode ? colorFor(projectNode.data.name) : INK.muted
      if (d.depth <= 1) return base
      if (d.depth === 2) return shade(base, INK.surface, 0.35)
      return shade(base, INK.surface, 0.6)
    }

    const descendants = root.descendants().filter((d) => d.depth) as PNode[]

    const path = svg
      .append('g')
      .selectAll('path')
      .data(descendants)
      .join('path')
      .attr('fill', (d) => nodeColor(d))
      .attr('fill-opacity', (d) => (arcVisible(d.current) ? (d.children ? 0.9 : 0.7) : 0))
      .attr('pointer-events', (d) => (arcVisible(d.current) ? 'auto' : 'none'))
      .attr('d', (d) => arcGen(d.current))

    path
      .filter((d) => !!d.children)
      .style('cursor', 'pointer')
      .on('click', (event, d) => clicked(event, d))

    path
      .on('mousemove', (event: MouseEvent, d) => {
        const share = totalCost > 0 ? Math.round(((d.value || 0) / totalCost) * 100) : 0
        const crumbs = d
          .ancestors()
          .slice(0, -1)
          .reverse()
          .map((a) => escapeHtml(shortName(a.data.name)))
          .join(' › ')
        tip().show(
          `<div class="chart-tip-title">${crumbs}</div><div>${fmtMoney(d.value || 0)} · ${share}% of window</div>`,
          event.clientX,
          event.clientY,
        )
      })
      .on('mouseleave', () => tip().hide())

    const label = svg
      .append('g')
      .attr('pointer-events', 'none')
      .attr('text-anchor', 'middle')
      .style('user-select', 'none')
      .selectAll('text')
      .data(descendants)
      .join('text')
      .attr('fill', INK.primary)
      .attr('fill-opacity', (d) => +labelVisible(d.current))
      .attr('transform', (d) => labelTransform(d.current, radius))
      .text((d) => shortName(d.data.name))

    const centerLabel = svg.append('text').attr('text-anchor', 'middle').attr('fill', INK.primary)
    const centerLabel1 = centerLabel.append('tspan').attr('x', 0).attr('y', -4).style('font-size', '12px')
    const centerLabel2 = centerLabel
      .append('tspan')
      .attr('x', 0)
      .attr('y', 14)
      .style('font-size', '11px')
      .attr('fill', INK.muted)

    const setCenter = (d: PNode) => {
      centerLabel1.text(d === root ? 'All spend' : shortName(d.data.name))
      centerLabel2.text(fmtMoney(d.value || 0))
    }
    setCenter(root)

    const parentCircle = svg
      .append('circle')
      .datum(root)
      .attr('r', radius)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .style('cursor', 'pointer')
      .on('click', (event, d) => clicked(event, (d as PNode).parent || root))

    function clicked(_event: unknown, p: PNode) {
      parentCircle.datum(p.parent || root)
      setCenter(p)

      root.each((d) => {
        ;(d as PNode).target = {
          x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0) || 0)) * 2 * Math.PI,
          x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0) || 0)) * 2 * Math.PI,
          y0: Math.max(0, d.y0 - p.depth),
          y1: Math.max(0, d.y1 - p.depth),
        }
      })

      const t = svg.transition().duration(600)
      path
        .transition(t as never)
        .tween('data', (d) => {
          const i = interpolate(d.current, d.target!)
          return (time: number) => {
            d.current = i(time)
          }
        })
        .attr('fill-opacity', (d) => (arcVisible(d.target!) ? (d.children ? 0.9 : 0.7) : 0))
        .attr('pointer-events', (d) => (arcVisible(d.target!) ? 'auto' : 'none'))
        .attrTween('d', (d) => () => arcGen(d.current) || '')

      label
        .transition(t as never)
        .attr('fill-opacity', (d) => +labelVisible(d.target!))
        .attrTween('transform', (d) => () => labelTransform(d.current, radius))
    }

    const legendItems = [
      ...palette.top.map((p) => ({ label: p, color: colorFor(p) })),
      ...(palette.hasOther ? [{ label: OTHER_KEY, color: OTHER_COLOR }] : []),
    ]
    legendChips(shell.legend, legendItems)

    const unknownCount = events.length - priced.length
    statTiles(shell.stats, [
      { label: 'Window spend', value: fmtMoney(totalCost) },
      { label: 'Projects', value: String(tree.size) },
      { label: 'Unpriced events', value: String(unknownCount) },
    ])

    this.unsub = observeResize(shell.plot, () => this.render())
  }

  destroy(): void {
    if (this.unsub) this.unsub()
    this.unsub = null
    tip().hide()
  }
}
