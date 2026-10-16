import type { h as H } from '../svg.js'
import { defineCharacter } from './define.js'

const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function driveBay(h: typeof H, glow: string, y: number, t: number, rate: number, seed: number): string {
  const tick = Math.floor(t * rate)
  const lit = (i: number) => hash(tick * 7 + seed * 13 + i) > 0.35
  return h(
    'g',
    null,
    h('rect', { x: -44, y, width: 88, height: 11, rx: 2.5, fill: '#1f2633', stroke: '#11151c', strokeWidth: 1.5 }),
    [0, 1, 2, 3, 4, 5].map((i) => h('line', { x1: -38 + i * 6, y1: y + 3, x2: -38 + i * 6, y2: y + 8, stroke: '#3a4458', strokeWidth: 1.6, strokeLinecap: 'round' })),
    h('circle', { cx: 28, cy: y + 5.5, r: 2, fill: lit(0) ? '#4ade80' : '#14532d', filter: lit(0) ? glow : undefined }),
    h('circle', { cx: 36, cy: y + 5.5, r: 2, fill: lit(1) ? '#fbbf24' : '#5b4410', filter: lit(1) ? glow : undefined }),
  )
}

/** Rack: a little slate home server with an LED dot-matrix face and chattering drive lights. */
export const Rack = defineCharacter({
  id: 'rack',
  name: 'Rack',
  kind: 'little home server',
  face: 'matrix',
  palette: { phosphor: '#7cd4ff', phosphorDim: '#3a86b0', screenInner: '#103252', screenOuter: '#050f1c' },
  anchors: { shoulder: { x: 52, y: -96 }, antenna: { x: 14, y: -174 }, sweat: { x: 48, y: -170 } },
  effectsOffsetY: -32,
  iconViewBox: '-80 -204 160 208',
  limbs: { line: '#2b3140', hand: '#e8ecf2', handStroke: '#4a5568', joint: '#4a5568', foot: '#3b82f6', footStroke: '#1e3a8a' },
  body: ({ h, id, url, pose: p, time }) => {
    // drive lights chatter much faster while it's working
    const working = p.code > 0 || p.spinner > 0 || p.progress >= 0 || p.gears > 0
    const rate = working ? 14 : 2.5
    return [
      h(
        'defs',
        null,
        h(
          'linearGradient',
          { id: id('rack-body'), x1: 0, y1: 0, x2: 0, y2: 1 },
          h('stop', { offset: 0, stopColor: '#4a5568' }),
          h('stop', { offset: 1, stopColor: '#2d3748' }),
        ),
      ),
      h('rect', { x: -52, y: -174, width: 104, height: 152, rx: 10, fill: url('rack-body'), stroke: '#161b25', strokeWidth: 2.5 }),
      h('rect', { x: -52, y: -174, width: 104, height: 152, rx: 10, fill: url('body-side') }),
      // rack ears
      h('rect', { x: -57, y: -168, width: 6, height: 26, rx: 2, fill: '#3a4458', stroke: '#161b25', strokeWidth: 1.5 }),
      h('rect', { x: 51, y: -168, width: 6, height: 26, rx: 2, fill: '#3a4458', stroke: '#161b25', strokeWidth: 1.5 }),
      driveBay(h, url('glow'), -166, time, rate, 1),
      driveBay(h, url('glow'), -151, time, rate, 2),
      // screen bezel
      h('rect', { x: -47, y: -129, width: 94, height: 76, rx: 8, fill: '#1a202c', stroke: '#11151c', strokeWidth: 1.5 }),
      // vents, label, power button
      [0, 1, 2].map((i) => h('line', { x1: -40, y1: -45 + i * 6, x2: -6, y2: -45 + i * 6, stroke: '#1a202c', strokeWidth: 2.4, strokeLinecap: 'round' })),
      h('text', { x: 10, y: -31, fontSize: 5.5, fontFamily: 'ui-monospace, monospace', fill: '#8a96aa' }, 'SRV-01'),
      h('circle', { cx: 38, cy: -38, r: 5.5, fill: '#0f172a', stroke: '#161b25', strokeWidth: 1.5 }),
      h('circle', { cx: 38, cy: -38, r: 2.6, fill: '#60a5fa', filter: url('glow') }),
    ]
      .flat()
      .join('')
  },
})
