import type { EyeShape, Pose } from '../pose.js'
import { h, n, path } from '../svg.js'
import { defineCharacter } from './define.js'

const FUR = '#f29a4a'
const FUR_DARK = '#e07b2c'
const STRIPE = '#c4621f'
const CREAM = '#fde7c8'
const LINE = '#8a4318'
const INK = '#2a1a10'
const IRIS = '#8fd14f'
const PINK = '#ff8fab'
const TEAR = '#8fdcff'

const EYE_Y = -110
const EYE_DX = 20
const NOSE_Y = -95
const MOUTH_Y = -89

const outline = { stroke: LINE, strokeWidth: 2.5, strokeLinejoin: 'round' }
const inkStroke = { stroke: INK, strokeWidth: 3.5, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' }

// ---------- body ----------

function tail(t: number, busy: boolean, flying: boolean): string {
  const s = Math.sin(t * (busy ? 9 : 2)) * (flying ? 0.3 : 1)
  const d = flying
    ? path`M 18 -24 C 38 -22 48 -8 ${56 + s * 6} ${10 + s * 2}`
    : path`M 18 -24 C 56 -24 ${60 + s * 6} -58 ${52 + s * 14} -84 Q ${48 + s * 20} -102 ${34 + s * 22} -98`
  return h(
    'g',
    { fill: 'none', strokeLinecap: 'round' },
    h('path', { d, stroke: LINE, strokeWidth: 15 }),
    h('path', { d, stroke: FUR, strokeWidth: 10 }),
    h('path', { d, stroke: STRIPE, strokeWidth: 10, strokeDasharray: '0 40 6 12 6 12 6 100' }),
  )
}

function backPaw(x: number, lift: number): string {
  const y = -6 - lift
  return h(
    'g',
    null,
    h('ellipse', { cx: x, cy: y, rx: 13, ry: 7, fill: CREAM, ...outline }),
    h('path', { d: path`M ${x - 4} ${y + 2} L ${x - 4} ${y + 6} M ${x + 4} ${y + 2} L ${x + 4} ${y + 6}`, stroke: LINE, strokeWidth: 1.5, strokeLinecap: 'round' }),
  )
}

function torso(url: (name: string) => string): string {
  return h(
    'g',
    null,
    h('ellipse', { cx: 0, cy: -40, rx: 33, ry: 32, fill: url('whiskers-fur'), ...outline }),
    h('ellipse', { cx: 0, cy: -34, rx: 19, ry: 21, fill: CREAM }),
    [-1, 1].map((side) =>
      h('path', {
        d: path`M ${side * 31} -50 Q ${side * 25} -48 ${side * 22} -44 M ${side * 32} -38 Q ${side * 26} -36 ${side * 23} -32`,
        stroke: STRIPE,
        strokeWidth: 3,
        strokeLinecap: 'round',
        fill: 'none',
      }),
    ),
  )
}

/** Ears turn with the antenna sway; while flying they fold back. */
function ears(sway: number, flying: boolean): string {
  const ear = (side: -1 | 1, angle: number) =>
    h(
      'g',
      { transform: path`translate(${side * 32} -140) rotate(${angle})` },
      h('path', { d: path`M ${side * -20} 6 L ${side * 10} -36 L ${side * 22} 12 Z`, fill: FUR, ...outline, strokeWidth: 3 }),
      h('path', { d: path`M ${side * -9} 2 L ${side * 9} -24 L ${side * 15} 6 Z`, fill: PINK, strokeLinejoin: 'round' }),
    )
  const back = flying ? 45 : 0
  return ear(-1, sway * 0.6 - back) + ear(1, -sway * 0.4 + back)
}

function head(url: (name: string) => string): string {
  const tuft = (side: -1 | 1) =>
    h('path', {
      d: path`M ${side * 46} -102 L ${side * 63} -92 L ${side * 51} -87 L ${side * 61} -78 L ${side * 40} -74 Z`,
      fill: FUR_DARK,
      ...outline,
    })
  return h(
    'g',
    null,
    tuft(-1),
    tuft(1),
    h('ellipse', { cx: 0, cy: -108, rx: 54, ry: 44, fill: url('whiskers-fur'), ...outline }),
    h('ellipse', { cx: 0, cy: -108, rx: 54, ry: 44, fill: url('body-side') }),
    h(
      'g',
      { stroke: STRIPE, strokeWidth: 3.5, strokeLinecap: 'round', fill: 'none' },
      h('path', { d: 'M -10 -149 L -7 -138 M 0 -151 L 0 -139 M 10 -149 L 7 -138' }),
      h('path', { d: 'M -53 -114 L -42 -112 M -52 -104 L -43 -103 M 53 -114 L 42 -112 M 52 -104 L 43 -103' }),
    ),
  )
}

/** Front paws hang from the shoulders and swing out and up with the arm angles. */
function frontPaw(side: 'L' | 'R', angle: number): string {
  const x = side === 'L' ? -27 : 27
  return h(
    'g',
    { transform: path`translate(${x} -60) rotate(${side === 'L' ? angle : -angle})` },
    h('path', { d: 'M 0 0 L 0 22', stroke: LINE, strokeWidth: 15, strokeLinecap: 'round' }),
    h('path', { d: 'M 0 0 L 0 22', stroke: FUR, strokeWidth: 10, strokeLinecap: 'round' }),
    h('circle', { cx: 0, cy: 25, r: 8, fill: CREAM, ...outline }),
    h('path', { d: 'M -3 29 L -3 32 M 3 29 L 3 32', stroke: LINE, strokeWidth: 1.5, strokeLinecap: 'round' }),
  )
}

// ---------- face ----------

function eye(cx: number, cy: number, shape: EyeShape, open: number, side: -1 | 1, t: number): string {
  switch (shape) {
    case 'open': {
      if (open < 0.2) return h('path', { d: path`M ${cx - 8} ${cy} Q ${cx} ${cy + 4} ${cx + 8} ${cy}`, ...inkStroke })
      const ry = 11 * open
      return h(
        'g',
        null,
        h('ellipse', { cx, cy, rx: 9, ry, fill: IRIS, stroke: INK, strokeWidth: 2.5 }),
        h('ellipse', { cx, cy, rx: 2.8, ry: ry * 0.8, fill: INK }),
        open > 0.5 && h('circle', { cx: cx - 3.5, cy: cy - ry * 0.45, r: 2.2, fill: '#fff' }),
      )
    }
    case 'wide':
      return h(
        'g',
        null,
        h('circle', { cx, cy, r: 11, fill: IRIS, stroke: INK, strokeWidth: 2.5 }),
        h('circle', { cx, cy, r: 7, fill: INK }),
        h('circle', { cx: cx - 3, cy: cy - 4, r: 2.4, fill: '#fff' }),
      )
    case 'happy':
      return h('path', { d: path`M ${cx - 8} ${cy + 3} Q ${cx} ${cy - 9} ${cx + 8} ${cy + 3}`, ...inkStroke })
    case 'closed':
      return h('path', { d: path`M ${cx - 8} ${cy} Q ${cx} ${cy + 6} ${cx + 8} ${cy}`, ...inkStroke })
    case 'squint': {
      const dir = side === -1 ? 1 : -1
      return h('path', { d: path`M ${cx - 6 * dir} ${cy - 6} L ${cx + 5 * dir} ${cy} L ${cx - 6 * dir} ${cy + 6}`, ...inkStroke })
    }
    case 'x':
      return h('path', { d: path`M ${cx - 6} ${cy - 6} L ${cx + 6} ${cy + 6} M ${cx + 6} ${cy - 6} L ${cx - 6} ${cy + 6}`, ...inkStroke })
    case 'heart':
      return h('path', {
        transform: path`translate(${cx} ${cy}) scale(${1.3 * open})`,
        d: 'M 0 7 C -10 0 -9 -8 -4 -8 C -1.5 -8 0 -6 0 -4 C 0 -6 1.5 -8 4 -8 C 9 -8 10 0 0 7 Z',
        fill: PINK,
        stroke: '#c23d66',
        strokeWidth: 1,
      })
    case 'spiral': {
      let d = ''
      for (let i = 0; i <= 40; i++) {
        const a = (i / 40) * Math.PI * 4
        const r = (i / 40) * 9
        d += `${i ? 'L' : 'M'} ${n(Math.cos(a) * r)} ${n(Math.sin(a) * r)} `
      }
      return h('path', { transform: path`translate(${cx} ${cy}) rotate(${-t * 540 * side})`, d, ...inkStroke, strokeWidth: 2.4 })
    }
  }
}

function brows(k: number, lx: number, ly: number): string {
  const y = EYE_Y - 16 + ly * 0.6
  const inner = 5 * Math.max(-1, Math.min(k, 1.3))
  return h(
    'g',
    { stroke: INK, strokeWidth: 3, strokeLinecap: 'round', opacity: Math.min(1, Math.abs(k) * 1.5) },
    h('line', { x1: -EYE_DX - 8 + lx, y1: y + 1, x2: -EYE_DX + 6 + lx, y2: y - inner }),
    h('line', { x1: EYE_DX + 8 + lx, y1: y + 1, x2: EYE_DX - 6 + lx, y2: y - inner }),
  )
}

/** A cat's "ω" mouth that opens into a rounded mouth with a tongue. */
function mouth(curve: number, open: number, width: number, dx: number, dy: number): string {
  const w = 9 * width
  const y = MOUTH_Y + dy
  const bend = curve * 5
  const lips = path`M ${dx - w} ${y - bend * 0.4} Q ${dx - w / 2} ${y + bend} ${dx} ${y} Q ${dx + w / 2} ${y + bend} ${dx + w} ${y - bend * 0.4}`
  if (open < 0.05) return h('path', { d: lips, ...inkStroke, strokeWidth: 2.5 })
  const k = Math.min(1, open)
  const depth = 4 + k * 12
  const mw = w * (0.7 + k * 0.3)
  const d = path`M ${dx - mw} ${y + 1} Q ${dx} ${y - 1} ${dx + mw} ${y + 1} C ${dx + mw} ${y + depth} ${dx - mw} ${y + depth} ${dx - mw} ${y + 1} Z`
  return h(
    'g',
    null,
    h('path', { d, fill: '#5a1f1f', stroke: INK, strokeWidth: 2.5, strokeLinejoin: 'round' }),
    k > 0.3 && h('ellipse', { cx: dx, cy: y + depth * 0.62, rx: mw * 0.55, ry: 1.5 + k * 2.5, fill: PINK }),
    h('path', { d: lips, ...inkStroke, strokeWidth: 2.5 }),
  )
}

function tears(k: number, t: number, lx: number, ly: number): string {
  const drops: string[] = []
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const ph = (t * 1.6 + i / 3 + (side > 0 ? 0.15 : 0)) % 1
      const x = side * (EYE_DX + 6) + lx + side * ph * 8
      const y = EYE_Y + ly + 9 + ph * 36
      drops.push(h('path', { transform: path`translate(${x} ${y}) scale(${0.9 + ph * 0.3})`, d: 'M 0 -4 Q 3 0 0 3 Q -3 0 0 -4 Z', fill: TEAR, opacity: k * (1 - ph * 0.6) }))
    }
  }
  return drops.join('')
}

function face(p: Pose, t: number): string {
  const lx = p.lookX
  const ly = p.lookY
  const mx = lx * 0.6
  const my = ly * 0.4
  return h(
    'g',
    null,
    // muzzle
    h('ellipse', { cx: mx - 8, cy: MOUTH_Y + my, rx: 11, ry: 8, fill: CREAM }),
    h('ellipse', { cx: mx + 8, cy: MOUTH_Y + my, rx: 11, ry: 8, fill: CREAM }),
    p.blush > 0.01 &&
      h('g', { fill: PINK, opacity: p.blush * 0.6 }, h('ellipse', { cx: -34 + lx, cy: -94 + ly, rx: 7, ry: 4 }), h('ellipse', { cx: 34 + lx, cy: -94 + ly, rx: 7, ry: 4 })),
    eye(-EYE_DX + lx, EYE_Y + ly, p.eye, p.eyeOpen, -1, t),
    eye(EYE_DX + lx, EYE_Y + ly, p.eye, p.eyeOpen, 1, t),
    Math.abs(p.brow) > 0.02 && brows(p.brow, lx, ly),
    // whiskers
    h(
      'g',
      { stroke: INK, strokeWidth: 1.4, strokeLinecap: 'round', opacity: 0.75 },
      [-1, 1].map((side) =>
        [-4, 1, 6].map((dy, i) =>
          h('line', { x1: mx + side * 16, y1: MOUTH_Y + my + dy * 0.5 - 2, x2: mx + side * 48, y2: MOUTH_Y + my + dy * 1.6 - 4 + i * 0.5 }),
        ),
      ),
    ),
    // nose
    h('path', { d: path`M ${mx - 5} ${NOSE_Y + my - 3} L ${mx + 5} ${NOSE_Y + my - 3} L ${mx} ${NOSE_Y + my + 3} Z`, fill: PINK, stroke: '#c2566f', strokeWidth: 2, strokeLinejoin: 'round' }),
    h('line', { x1: mx, y1: NOSE_Y + my + 3, x2: mx, y2: MOUTH_Y + my, stroke: INK, strokeWidth: 2, strokeLinecap: 'round' }),
    mouth(p.mouthCurve, p.mouthOpen, p.mouthWidth, mx, my),
    p.tears > 0.01 && tears(p.tears, t, lx, ly),
  )
}

function sweatDrop(k: number, t: number): string {
  const slide = (t * 0.8) % 1
  return h('path', {
    transform: path`translate(52 ${-142 + slide * 14}) scale(1.3)`,
    d: 'M 0 -6 Q 5 1 0 4 Q -5 1 0 -6 Z',
    fill: TEAR,
    stroke: '#3c8fbf',
    strokeWidth: 1,
    opacity: k * (1 - slide * 0.5),
  })
}

/** Whiskers: a ginger cartoon cat with white socks and a tail that swishes faster when busy. */
export const Whiskers = defineCharacter({
  id: 'whiskers',
  name: 'Whiskers',
  kind: 'cartoon cat',
  skeleton: false,
  palette: { phosphor: INK, phosphorDim: LINE, screenInner: FUR, screenOuter: FUR_DARK },
  effectsOffsetY: -30,
  iconViewBox: '-80 -190 172 196',
  body: ({ id, url, pose: p, time }) => {
    const busy = p.code > 0 || p.spinner > 0 || p.progress >= 0 || p.gears > 0
    const flying = p.propeller > 0 || p.flame > 0
    return [
      h(
        'defs',
        null,
        h(
          'linearGradient',
          { id: id('whiskers-fur'), x1: 0, y1: 0, x2: 0, y2: 1 },
          h('stop', { offset: 0, stopColor: FUR }),
          h('stop', { offset: 1, stopColor: FUR_DARK }),
        ),
      ),
      tail(time, busy, flying),
      torso(url),
      backPaw(-16, p.legL),
      backPaw(16, p.legR),
      ears(p.antenna, flying),
      head(url),
      face(p, time),
      frontPaw('L', p.armL),
      frontPaw('R', p.armR),
      p.sweat > 0.01 && sweatDrop(p.sweat, time),
    ]
      .filter(Boolean)
      .join('')
  },
})
