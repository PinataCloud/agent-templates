// The chart registry. The dashboard page builds its tab bar from this array,
// in this order — a chart is not live until it appears here.
import type { ChartMeta } from '../lib/types'
import { RiverChart } from './river'
import { PrismChart } from './prism'
import { RhythmChart } from './rhythm'
import { LoomChart } from './loom'
import { ToolsChart } from './tools'

export const CHARTS: ChartMeta[] = [
  {
    id: 'river',
    title: 'River',
    blurb: 'Where does the money go over time?',
    ctor: RiverChart,
  },
  {
    id: 'prism',
    title: 'Prism',
    blurb: 'How does spend decompose across project, person and model?',
    ctor: PrismChart,
  },
  {
    id: 'rhythm',
    title: 'Rhythm',
    blurb: 'When does the organization work?',
    ctor: RhythmChart,
  },
  {
    id: 'loom',
    title: 'Loom',
    blurb: 'Who is running what, in parallel?',
    ctor: LoomChart,
  },
  {
    id: 'tools',
    title: 'Tools',
    blurb: 'Where does the wall-clock go?',
    ctor: ToolsChart,
  },
]

export function chartById(id: string | null): ChartMeta {
  return CHARTS.find((c) => c.id === id) || CHARTS[0]
}
