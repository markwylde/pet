import type { EyeShape, Pose } from '../pose.js'
import { h, n, path } from '../svg.js'
import { defineCharacter } from './define.js'

const FUR = '#ECB06F'
const STRIPE = '#D9883F'
const CREAM = '#F6DDB0'
const INK = '#1E1A17'
const PINK = '#F09A9E'
const RED = '#C9362E'
const GOLD = '#F2C230'
const TEAR = '#8fdcff'

const EYE_Y = -102
const EYE_DX = 25

/** Thick, rounded ink lines: the whole look hangs off these. */
const ink = (w = 3.6) => ({ stroke: INK, strokeWidth: w, strokeLinejoin: 'round', strokeLinecap: 'round' })

const HEAD = 'M -62 -96 C -64 -120 -60 -140 -40 -144 Q 0 -150 40 -144 C 60 -140 64 -120 62 -96 C 62 -72 36 -62 0 -62 C -36 -62 -62 -72 -62 -96 Z'

// ---------- body ----------

function tail(t: number, busy: boolean, flying: boolean): string {
  const s = Math.sin(t * (busy ? 9 : 2.2))
  const d = flying
    ? path`M 50 -24 C 70 -20 ${80 + s * 2} -10 ${92 + s * 3} ${-2 + s * 2}`
    : path`M 50 -24 C ${74 + s * 3} -26 ${86 + s * 7} -42 ${86 + s * 12} ${-62 + Math.abs(s) * 2}`
  return h(
    'g',
    { class: 'whiskers-tail', fill: 'none' },
    h('path', { d, ...ink(22) }),
    h('path', { d, stroke: FUR, strokeWidth: 14.8, strokeLinecap: 'round' }),
    h('path', { d, stroke: STRIPE, strokeWidth: 14.8, strokeDasharray: '0 18 5 8 5 8 5 100' }),
  )
}

function torso(): string {
  return [
    h('path', { d: 'M -46 -72 C -60 -52 -66 -28 -60 -8 Q -40 0 0 0 Q 40 0 60 -8 C 66 -28 60 -52 46 -72 Z', fill: FUR, ...ink() }),
    h('path', { d: 'M -18 -56 C -22 -40 -21 -18 -16 -1 L 16 -1 C 21 -18 22 -40 18 -56 Z', fill: CREAM }),
    h(
      'g',
      { stroke: STRIPE, strokeWidth: 3.5, strokeLinecap: 'round' },
      h('path', { d: 'M -56 -50 L -47 -48 M -59 -40 L -49 -39 M 56 -50 L 47 -48 M 59 -40 L 49 -39' }),
    ),
  ].join('')
}

/** A back foot, sole out with pink toe beans. `lift` raises it in px. */
function hindFoot(side: -1 | 1, lift: number): string {
  const s = side
  return h(
    'g',
    { transform: path`translate(0 ${-lift})` },
    h('ellipse', { cx: s * 60, cy: -17, rx: 19, ry: 17, transform: path`rotate(${s * -12} ${s * 60} -17)`, fill: FUR, ...ink() }),
    h('ellipse', { cx: s * 61, cy: -12, rx: 8.5, ry: 7, fill: PINK }),
    h('g', { fill: PINK }, h('circle', { cx: s * 71, cy: -21, r: 3.6 }), h('circle', { cx: s * 65, cy: -27, r: 3.6 }), h('circle', { cx: s * 57, cy: -27, r: 3.4 })),
  )
}

/**
 * A front leg hangs from the shoulder under the collar. Raising it swings it out and up
 * and shortens it a little, so a wave reads as a paw by the cheek rather than a long arm.
 */
function frontLeg(side: 'L' | 'R', angle: number): string {
  const s = side === 'L' ? -1 : 1
  const raise = Math.max(0, Math.min(1, (angle - 8) / 90))
  const len = 56 - raise * 20
  const outline = path`M -12 0 C -12 ${len * 0.4} -12 ${len - 14} -11 ${len - 8} Q -10 ${len} 0 ${len} Q 10 ${len} 11 ${len - 8} C 12 ${len - 14} 12 ${len * 0.4} 11 0`
  return h(
    'g',
    { transform: path`translate(${s * 27.5} -57) rotate(${-s * (angle - 8)})` },
    // once it lifts off the body the leg needs a rounded, inked shoulder to look whole
    raise > 0.05
      ? h('path', { d: outline + ' C 11 -9 6 -12 0 -12 C -6 -12 -11 -9 -12 0 Z', fill: FUR, ...ink() })
      : [h('path', { d: outline + ' Z', fill: FUR }), h('path', { d: outline, fill: 'none', ...ink() })],
    h('path', { d: path`M -4 ${len - 0.5} L -4 ${len - 6} M 4 ${len - 0.5} L 4 ${len - 6}`, ...ink(2.6) }),
    h('path', { d: path`M ${s * 11} ${len * 0.3} L ${s * 4} ${len * 0.3} M ${s * 11} ${len * 0.46} L ${s * 5} ${len * 0.46}`, stroke: STRIPE, strokeWidth: 3.5, strokeLinecap: 'round' }),
  )
}

function collar(): string {
  const d = 'M -50 -70 Q 0 -50 50 -70'
  return [
    h('path', { d, fill: 'none', ...ink(11) }),
    h('path', { d, fill: 'none', stroke: RED, strokeWidth: 6.6, strokeLinecap: 'round' }),
  ].join('')
}

function bell(): string {
  return h(
    'g',
    null,
    h('circle', { cx: 0, cy: -50, r: 9, fill: GOLD, ...ink(2.6) }),
    h('path', { d: 'M -8.2 -52 Q 0 -49 8.2 -52', fill: 'none', ...ink(2.2) }),
    h('circle', { cx: 0, cy: -46.5, r: 1.8, fill: INK }),
    h('path', { d: 'M 0 -46 L 0 -41.5', ...ink(2) }),
  )
}

/**
 * An ear is drawn over the head with only its two outer edges inked, so it blends into the
 * head outline like one shape. It turns with the antenna sway and folds back while flying.
 */
function ear(side: -1 | 1, angle: number): string {
  const s = side
  const edges = path`M ${s * 63} -116 C ${s * 63} -132 ${s * 61} -142 ${s * 58} -150 Q ${s * 55} -160 ${s * 45} -155 L ${s * 25} -142.5`
  return h(
    'g',
    { transform: path`rotate(${angle} ${s * 44} -132)` },
    h('path', { d: edges + path` L ${s * 30} -124 L ${s * 56} -110 Z`, fill: FUR }),
    h('path', { d: edges, fill: 'none', ...ink() }),
    h('path', { d: path`M ${s * 55} -134 L ${s * 53} -148 Q ${s * 51} -153 ${s * 46} -150 L ${s * 34} -142 Q ${s * 46} -139 ${s * 55} -134 Z`, fill: PINK }),
  )
}

function head(sway: number, flying: boolean): string {
  // kept small: a bigger turn would pull the ear's edges away from the head outline
  const twitch = Math.max(-10, Math.min(10, sway * 0.5))
  const back = flying ? 8 : 0
  return [
    h('path', { d: HEAD, fill: FUR, ...ink() }),
    ear(-1, -twitch - back),
    ear(1, twitch * 0.7 + back),
    h(
      'g',
      { stroke: STRIPE, strokeWidth: 4, strokeLinecap: 'round' },
      h('path', { d: 'M -10 -145 L -8 -132 M 0 -147 L 0 -129 M 10 -145 L 8 -132' }),
      h('path', { d: 'M -61 -108 L -51 -106 M -62 -98 L -52 -97 M 61 -108 L 51 -106 M 62 -98 L 52 -97' }),
    ),
  ].join('')
}

// ---------- face ----------

function eye(cx: number, cy: number, shape: EyeShape, open: number, side: -1 | 1, t: number): string {
  const line = { fill: 'none', ...ink() }
  switch (shape) {
    case 'open': {
      if (open < 0.25) return h('path', { d: path`M ${cx - 8} ${cy} Q ${cx} ${cy + 3} ${cx + 8} ${cy}`, ...line })
      const ry = 8 * open
      return h(
        'g',
        null,
        h('ellipse', { cx, cy, rx: 6.5, ry, fill: INK }),
        open > 0.6 && h('circle', { cx: cx - 2, cy: cy - ry * 0.44, r: 2.6, fill: '#fff' }),
        open > 0.6 && h('circle', { cx: cx + 2.5, cy: cy + ry * 0.44, r: 1.1, fill: '#fff' }),
      )
    }
    case 'wide':
      return h(
        'g',
        null,
        h('ellipse', { cx, cy, rx: 8.5, ry: 10, fill: INK }),
        h('circle', { cx: cx - 2.5, cy: cy - 4, r: 3.4, fill: '#fff' }),
        h('circle', { cx: cx + 3, cy: cy + 4, r: 1.5, fill: '#fff' }),
      )
    case 'happy':
      return h('path', { d: path`M ${cx - 9} ${cy + 2} Q ${cx} ${cy - 7} ${cx + 9} ${cy + 2}`, ...line })
    case 'closed':
      return h('path', { d: path`M ${cx - 9} ${cy - 1} Q ${cx} ${cy + 6} ${cx + 9} ${cy - 1}`, ...line })
    case 'squint': {
      const dir = -side
      return h('path', { d: path`M ${cx - 6 * dir} ${cy - 6} L ${cx + 5 * dir} ${cy} L ${cx - 6 * dir} ${cy + 6}`, ...line })
    }
    case 'x':
      return h('path', { d: path`M ${cx - 6} ${cy - 6} L ${cx + 6} ${cy + 6} M ${cx + 6} ${cy - 6} L ${cx - 6} ${cy + 6}`, ...line })
    case 'heart':
      return h('path', {
        transform: path`translate(${cx} ${cy}) scale(${1.25 * Math.max(0.3, open)})`,
        d: 'M 0 7 C -10 0 -9 -8 -4 -8 C -1.5 -8 0 -6 0 -4 C 0 -6 1.5 -8 4 -8 C 9 -8 10 0 0 7 Z',
        fill: '#E5484D',
        ...ink(1.8),
      })
    case 'spiral': {
      let d = ''
      for (let i = 0; i <= 40; i++) {
        const a = (i / 40) * Math.PI * 4
        const r = (i / 40) * 8.5
        d += `${i ? 'L' : 'M'} ${n(Math.cos(a) * r)} ${n(Math.sin(a) * r)} `
      }
      return h('path', { transform: path`translate(${cx} ${cy}) rotate(${-t * 540 * side})`, d, ...line, strokeWidth: 2.6 })
    }
  }
}

function brows(k: number, lx: number, ly: number): string {
  const y = EYE_Y - 15 + ly * 0.6
  const inner = 5 * Math.max(-1, Math.min(k, 1.3))
  return h(
    'g',
    { ...ink(3), opacity: Math.min(1, Math.abs(k) * 1.5) },
    h('line', { x1: -EYE_DX - 8 + lx, y1: y + 1, x2: -EYE_DX + 6 + lx, y2: y - inner }),
    h('line', { x1: EYE_DX + 8 + lx, y1: y + 1, x2: EYE_DX - 6 + lx, y2: y - inner }),
  )
}

/** The cat "ω" mouth: its corners curl with the smile, and it drops open to talk. */
function mouth(curve: number, open: number, width: number, dx: number, dy: number): string {
  const w = 12 * width
  const y = -88 + dy
  const corner = y - 2 - curve * 2
  const lips =
    curve < -0.25
      ? path`M ${dx - w * 0.7} ${y + 4} Q ${dx} ${y - 3 + curve * 2} ${dx + w * 0.7} ${y + 4}`
      : path`M ${dx - w} ${corner} Q ${dx - w * 0.92} ${y + 4} ${dx - w / 2} ${y + 4} Q ${dx - 1} ${y + 4} ${dx} ${y} Q ${dx + 1} ${y + 4} ${dx + w / 2} ${y + 4} Q ${dx + w * 0.92} ${y + 4} ${dx + w} ${corner}`
  const parts = [h('path', { d: path`M ${dx} ${y - 3} L ${dx} ${y}`, ...ink(2.8) })]
  if (open >= 0.05) {
    const k = Math.min(1, open)
    const mw = w * (0.45 + k * 0.25)
    const depth = 5 + k * 12
    const d = path`M ${dx - mw} ${y + 2} Q ${dx} ${y - 1} ${dx + mw} ${y + 2} C ${dx + mw} ${y + 2 + depth} ${dx - mw} ${y + 2 + depth} ${dx - mw} ${y + 2} Z`
    parts.push(h('path', { d, fill: '#7a2a2a', ...ink(2.8) }))
    if (k > 0.3) parts.push(h('ellipse', { cx: dx, cy: y + 2 + depth * 0.6, rx: mw * 0.55, ry: 1.6 + k * 2.4, fill: PINK }))
  }
  parts.push(h('path', { d: lips, fill: 'none', ...ink(2.8) }))
  return parts.join('')
}

function tears(k: number, t: number, lx: number, ly: number): string {
  const drops: string[] = []
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const ph = (t * 1.6 + i / 3 + (side > 0 ? 0.15 : 0)) % 1
      const x = side * (EYE_DX + 7) + lx + side * ph * 8
      const y = EYE_Y + ly + 8 + ph * 34
      drops.push(h('path', { transform: path`translate(${x} ${y}) scale(${0.9 + ph * 0.3})`, d: 'M 0 -4 Q 3 0 0 3 Q -3 0 0 -4 Z', fill: TEAR, stroke: '#3c8fbf', strokeWidth: 0.8, opacity: k * (1 - ph * 0.6) }))
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
    h('ellipse', { cx: mx, cy: -84 + my, rx: 24, ry: 13, fill: CREAM }),
    p.blush > 0.01 &&
      h('g', { fill: PINK, opacity: p.blush * 0.7 }, h('ellipse', { cx: -42 + lx, cy: -88 + ly, rx: 8, ry: 4.5 }), h('ellipse', { cx: 42 + lx, cy: -88 + ly, rx: 8, ry: 4.5 })),
    eye(-EYE_DX + lx, EYE_Y + ly, p.eye, p.eyeOpen, -1, t),
    eye(EYE_DX + lx, EYE_Y + ly, p.eye, p.eyeOpen, 1, t),
    Math.abs(p.brow) > 0.02 && brows(p.brow, lx, ly),
    h('path', { d: path`M ${mx - 4.5} ${-96 + my} Q ${mx} ${-98 + my} ${mx + 4.5} ${-96 + my} Q ${mx + 3.5} ${-92 + my} ${mx} ${-91 + my} Q ${mx - 3.5} ${-92 + my} ${mx - 4.5} ${-96 + my} Z`, fill: INK, ...ink(1.5) }),
    mouth(p.mouthCurve, p.mouthOpen, p.mouthWidth, mx, my),
    h(
      'g',
      { fill: 'none', ...ink(2.4) },
      h('path', { d: path`M -54 -100 Q -72 -103 -92 -100 M -54 -92 Q -72 -92 -90 -85 M -52 -85 Q -68 -80 -80 -70` }),
      h('path', { d: path`M 54 -100 Q 72 -103 92 -100 M 54 -92 Q 72 -92 90 -85 M 52 -85 Q 68 -80 80 -70` }),
    ),
    p.tears > 0.01 && tears(p.tears, t, lx, ly),
  )
}

function sweatDrop(k: number, t: number): string {
  const slide = (t * 0.8) % 1
  return h('path', {
    transform: path`translate(60 ${-136 + slide * 14}) scale(1.3)`,
    d: 'M 0 -6 Q 5 1 0 4 Q -5 1 0 -6 Z',
    fill: TEAR,
    stroke: '#3c8fbf',
    strokeWidth: 1,
    opacity: k * (1 - slide * 0.5),
  })
}

/** Whiskers: a sitting ginger tabby in thick cartoon ink, with a bell collar and a tail that swishes faster when busy. */
export const Whiskers = defineCharacter({
  id: 'whiskers',
  name: 'Whiskers',
  kind: 'cartoon cat',
  skeleton: false,
  palette: { phosphor: INK, phosphorDim: STRIPE, screenInner: FUR, screenOuter: STRIPE },
  effectsOffsetY: -14,
  iconViewBox: '-98 -166 200 172',
  body: ({ pose: p, time }) => {
    const busy = p.code > 0 || p.spinner > 0 || p.progress >= 0 || p.gears > 0
    const flying = p.propeller > 0 || p.flame > 0
    return [
      tail(time, busy, flying),
      torso(),
      hindFoot(-1, p.legL),
      hindFoot(1, p.legR),
      collar(),
      head(p.antenna, flying),
      face(p, time),
      bell(),
      frontLeg('L', p.armL),
      frontLeg('R', p.armR),
      p.sweat > 0.01 && sweatDrop(p.sweat, time),
    ]
      .filter(Boolean)
      .join('')
  },
})
