import type { EyeShape, Pose } from '../pose.js'
import { h, n, path } from '../svg.js'
import { EYE_DX, EYE_Y, MOUTH_Y, PINK, type RenderContext } from './context.js'

/**
 * The `toon` face: no screen, just ink drawn straight onto the character's body, like a
 * cartoon. Same geometry as the CRT face so gaze, blinks and mouth shapes carry over.
 */
export function toonFace(p: Pose, t: number, ctx: RenderContext): string {
  const ink = ctx.character.palette.phosphor
  return [
    p.blush > 0.01 &&
      h('g', { fill: PINK, opacity: p.blush * 0.5 }, h('ellipse', { cx: -31, cy: -80, rx: 7, ry: 4 }), h('ellipse', { cx: 31, cy: -80, rx: 7, ry: 4 })),
    eye(-EYE_DX + p.lookX, EYE_Y + p.lookY, p.eye, p.eyeOpen, 'L', t, ink),
    eye(EYE_DX + p.lookX, EYE_Y + p.lookY, p.eye, p.eyeOpen, 'R', t, ink),
    p.brow > 0.02 && brows(p.brow, p.lookX, p.lookY, ink),
    mouth(p.mouthCurve, p.mouthOpen, p.mouthWidth, p.lookX * 0.3, p.lookY * 0.3, ink, ctx),
  ].join('')
}

function eye(cx: number, cy: number, shape: EyeShape, open: number, side: 'L' | 'R', t: number, ink: string): string {
  const stroke = { stroke: ink, strokeWidth: 3.2, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' }
  const dir = side === 'L' ? 1 : -1
  switch (shape) {
    case 'open': {
      if (open < 0.25) return h('path', { d: path`M ${cx - 6} ${cy} Q ${cx} ${cy + 3} ${cx + 6} ${cy}`, ...stroke })
      const ry = 7.5 * open
      return h(
        'g',
        null,
        h('ellipse', { cx, cy, rx: 5.8, ry, fill: ink }),
        open > 0.5 && h('circle', { cx: cx - 1.8, cy: cy - ry * 0.4, r: 1.9, fill: '#ffffff' }),
      )
    }
    case 'wide':
      return h(
        'g',
        null,
        h('circle', { cx, cy, r: 8.5, fill: '#ffffff', stroke: ink, strokeWidth: 2.4 }),
        h('circle', { cx, cy, r: 4, fill: ink }),
        h('circle', { cx: cx - 1.4, cy: cy - 1.6, r: 1.3, fill: '#ffffff' }),
      )
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
        stroke: ink,
        strokeWidth: 1.2,
      })
    case 'spiral': {
      let d = ''
      for (let i = 0; i <= 40; i++) {
        const a = (i / 40) * Math.PI * 4
        const r = (i / 40) * 8
        d += `${i ? 'L' : 'M'} ${n(Math.cos(a) * r)} ${n(Math.sin(a) * r)} `
      }
      return h('path', { transform: path`translate(${cx} ${cy}) rotate(${t * 540 * dir})`, d, ...stroke, strokeWidth: 2.2 })
    }
  }
}

function brows(k: number, lx: number, ly: number, ink: string): string {
  const y = EYE_Y - 15 + ly * 0.6
  const inner = 4.5 * Math.min(k, 1.3)
  return h(
    'g',
    { stroke: ink, strokeWidth: 3, strokeLinecap: 'round', opacity: Math.min(1, k * 1.5) },
    h('path', { d: path`M ${-EYE_DX - 8 + lx} ${y + 1} Q ${-EYE_DX + lx} ${y - inner * 0.2} ${-EYE_DX + 6 + lx} ${y - inner}`, fill: 'none' }),
    h('path', { d: path`M ${EYE_DX + 8 + lx} ${y + 1} Q ${EYE_DX + lx} ${y - inner * 0.2} ${EYE_DX - 6 + lx} ${y - inner}`, fill: 'none' }),
  )
}

/** A cartoon mouth: a little "w" under the nose when smiling, a gape with a tongue when open. */
function mouth(curve: number, open: number, width: number, dx: number, dy: number, ink: string, ctx: RenderContext): string {
  const w = 11 * width
  const y = MOUTH_Y + dy
  const endY = y - curve * 3
  const l = dx - w
  const r = dx + w
  const line = { stroke: ink, strokeWidth: 3, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (open < 0.05) {
    if (curve > 0.15) {
      // the two cheeks of a "w", meeting under the nose
      const dip = y + curve * 6
      return h('path', { d: path`M ${l} ${endY} Q ${dx - w * 0.5} ${dip} ${dx} ${y - 2} Q ${dx + w * 0.5} ${dip} ${r} ${endY}`, ...line })
    }
    return h('path', { d: path`M ${l} ${endY} Q ${dx} ${y + curve * 8} ${r} ${endY}`, ...line })
  }
  const k = Math.min(1, open)
  const upper = y + curve * 8 * (curve > 0 ? 1 - k * 0.75 : 1)
  const depth = curve < 0 ? 1 + k * 6 : 2 + k * 13 + curve * 2
  const bot = endY + depth / 0.75
  const d = path`M ${l} ${endY} Q ${dx} ${upper} ${r} ${endY} C ${r - w * 0.05} ${bot} ${l + w * 0.05} ${bot} ${l} ${endY} Z`
  const tongueRy = 2.5 + k * 4
  return h(
    'g',
    null,
    h('clipPath', { id: ctx.id('mouth') }, h('path', { d })),
    h('path', { d, fill: '#5a1f1f' }),
    k > 0.2 &&
      h('ellipse', { clipPath: ctx.url('mouth'), cx: dx, cy: endY + depth - tongueRy * 0.3, rx: w * 0.6, ry: tongueRy, fill: PINK }),
    h('path', { d, ...line, strokeWidth: 2.6 }),
  )
}
