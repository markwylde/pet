import type { EyeShape, Pose } from '../pose.js'
import { h, n, path } from '../svg.js'
import { EYE_DX, EYE_Y, MOUTH_Y, PINK, type RenderContext } from './context.js'

/** Pixel's face: smooth, glowing phosphor strokes. */
export function crtFace(p: Pose, t: number, ctx: RenderContext, hideMouth: boolean): string {
  const ink = ctx.character.palette.phosphor
  return [
    p.blush > 0.01 &&
      h('g', { fill: PINK, opacity: p.blush * 0.55 }, h('ellipse', { cx: -29, cy: -82, rx: 7, ry: 4 }), h('ellipse', { cx: 29, cy: -82, rx: 7, ry: 4 })),
    eye(-EYE_DX + p.lookX, EYE_Y + p.lookY, p.eye, p.eyeOpen, 'L', t, ink),
    eye(EYE_DX + p.lookX, EYE_Y + p.lookY, p.eye, p.eyeOpen, 'R', t, ink),
    p.brow > 0.02 && brows(p.brow, p.lookX, p.lookY, ink),
    !hideMouth && mouth(p.mouthCurve, p.mouthOpen, p.mouthWidth, p.lookX * 0.5, p.lookY * 0.4, ink, ctx),
  ].join('')
}

function eye(cx: number, cy: number, shape: EyeShape, open: number, side: 'L' | 'R', t: number, ink: string): string {
  const stroke = { stroke: ink, strokeWidth: 3.5, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' }
  const dir = side === 'L' ? 1 : -1
  switch (shape) {
    case 'open': {
      const ht = Math.max(2, 17 * open)
      return h(
        'g',
        null,
        h('rect', { x: cx - 5, y: cy - ht / 2, width: 10, height: ht, rx: 5, fill: ink }),
        open > 0.5 && h('rect', { x: cx - 2.5, y: cy - ht / 2 + 2.5, width: 3, height: 4, rx: 1.5, fill: '#ffffff', opacity: 0.7 }),
      )
    }
    case 'wide':
      return h('g', null, h('circle', { cx, cy, r: 9, ...stroke, strokeWidth: 2.5 }), h('circle', { cx, cy, r: 3.5, fill: ink }))
    case 'happy':
      return h('path', { d: path`M ${cx - 7} ${cy + 3} Q ${cx} ${cy - 9} ${cx + 7} ${cy + 3}`, ...stroke })
    case 'closed':
      return h('path', { d: path`M ${cx - 7} ${cy} Q ${cx} ${cy + 6} ${cx + 7} ${cy}`, ...stroke })
    case 'squint':
      return h('path', { d: path`M ${cx - 6 * dir} ${cy - 6} L ${cx + 5 * dir} ${cy} L ${cx - 6 * dir} ${cy + 6}`, ...stroke })
    case 'x':
      return h('path', { d: path`M ${cx - 6} ${cy - 6} L ${cx + 6} ${cy + 6} M ${cx + 6} ${cy - 6} L ${cx - 6} ${cy + 6}`, ...stroke })
    case 'heart':
      return h('path', {
        transform: path`translate(${cx} ${cy}) scale(${1.15 * open})`,
        d: 'M 0 7 C -10 0 -9 -8 -4 -8 C -1.5 -8 0 -6 0 -4 C 0 -6 1.5 -8 4 -8 C 9 -8 10 0 0 7 Z',
        fill: PINK,
      })
    case 'spiral': {
      let d = ''
      for (let i = 0; i <= 40; i++) {
        const a = (i / 40) * Math.PI * 4
        const r = (i / 40) * 8
        d += `${i ? 'L' : 'M'} ${n(Math.cos(a) * r)} ${n(Math.sin(a) * r)} `
      }
      return h('path', { transform: path`translate(${cx} ${cy}) rotate(${t * 540 * dir})`, d, ...stroke, strokeWidth: 2.4 })
    }
  }
}

function brows(k: number, lx: number, ly: number, ink: string): string {
  const y = EYE_Y - 14 + ly * 0.6
  const inner = 4.5 * Math.min(k, 1.3)
  return h(
    'g',
    { stroke: ink, strokeWidth: 3, strokeLinecap: 'round', opacity: Math.min(1, k * 1.5) },
    h('line', { x1: -EYE_DX - 8 + lx, y1: y + 1, x2: -EYE_DX + 6 + lx, y2: y - inner }),
    h('line', { x1: EYE_DX + 8 + lx, y1: y + 1, x2: EYE_DX - 6 + lx, y2: y - inner }),
  )
}

function mouth(curve: number, open: number, width: number, dx: number, dy: number, ink: string, ctx: RenderContext): string {
  const w = 12 * width
  const y = MOUTH_Y + dy
  const endY = y - curve * 3
  const l = dx - w
  const r = dx + w
  if (open < 0.05) {
    return h('path', { d: path`M ${l} ${endY} Q ${dx} ${y + curve * 8} ${r} ${endY}`, stroke: ink, strokeWidth: 3.5, fill: 'none', strokeLinecap: 'round' })
  }
  const k = Math.min(1, open)
  // A smile's top lip flattens as it opens, so it reads as an opening rather than a thin
  // crescent; a frown keeps its arch (crying wail).
  const upper = y + curve * 8 * (curve > 0 ? 1 - k * 0.75 : 1)
  const depth = curve < 0 ? 1 + k * 6 : 2 + k * 13 + curve * 2 // how far the bottom lip drops below the corners
  const bot = endY + depth / 0.75 // cubic control so the curve actually reaches `depth`
  const d = path`M ${l} ${endY} Q ${dx} ${upper} ${r} ${endY} C ${r - w * 0.05} ${bot} ${l + w * 0.05} ${bot} ${l} ${endY} Z`
  const tongueRy = 2 + k * 3.5
  return h(
    'g',
    null,
    h('clipPath', { id: ctx.id('mouth') }, h('path', { d })),
    h('path', { d, fill: '#0a1a14' }),
    k > 0.3 &&
      h('ellipse', { clipPath: ctx.url('mouth'), cx: dx, cy: endY + depth - tongueRy * 0.4, rx: w * 0.55, ry: tongueRy, fill: PINK, opacity: 0.85 }),
    h('path', { d, fill: 'none', stroke: ink, strokeWidth: 3, strokeLinejoin: 'round' }),
  )
}
