import type { EyeShape, Pose } from '../pose.js'
import { h, n, path } from '../svg.js'
import { defineCharacter } from './define.js'

const FEATHER = '#9C6A44'
const BAR = '#6E4529'
const DISC = '#F6E7CB'
const BELLY = '#EFD8B0'
const IRIS = '#F5A623'
const ORANGE = '#F08A24'
const FRAME = '#3A2A1F'
const INK = '#1E1A17'
const PINK = '#F09A9E'
const TEAR = '#8fdcff'

const EYE_Y = -110
const EYE_DX = 26
/** Radius of the pale disc each eye sits in. */
const DISC_R = 27
/** Radius of the iris: owls are mostly eye. */
const IRIS_R = 15.5
const LENS_R = 20
/** Where the head turns on the body. */
const NECK = { x: 0, y: -70 }

/** Thick, rounded ink lines, shared with Whiskers so the animals look like one family. */
const ink = (w = 3.6) => ({ stroke: INK, strokeWidth: w, strokeLinejoin: 'round', strokeLinecap: 'round' })

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

/**
 * The head, with its ear tufts as the top corners of the silhouette, and the pear-shaped
 * body. They overlap a lot, and are drawn as outlines first then fills on top, so they merge
 * into one egg-shaped owl with no neck however far the head tilts.
 */
const HEAD = 'M -60 -104 C -63 -128 -62 -152 -56 -178 C -40 -161 -24 -151 0 -151 C 24 -151 40 -161 56 -178 C 62 -152 63 -128 60 -104 C 58 -80 34 -64 0 -64 C -34 -64 -58 -80 -60 -104 Z'
const BODY = 'M -46 -96 C -66 -80 -70 -46 -62 -24 C -54 -6 -30 -2 0 -2 C 30 -2 54 -6 62 -24 C 70 -46 66 -80 46 -96 Z'

/**
 * How busy Ollie looks, 0 … 1. It comes from the numeric busy fields, which blend between
 * animations, so the glasses and feathers ease back to rest instead of snapping.
 */
export function busyLevel(p: Pose): number {
  return clamp(Math.max(p.code, p.spinner, p.gears, p.progress >= 0 ? 1 : 0), 0, 1)
}

/** Head tilt in degrees: antenna sway plus a slow, curious drift that fades out while busy. */
export function headTilt(p: Pose, time: number): number {
  return clamp(p.antenna * 0.5 + (1 - busyLevel(p)) * 4 * Math.sin(time * 0.7), -10, 10)
}

/** How far each wing is raised, in degrees. In flight both wings flap, as Biscuit's ears do. */
function wingAngle(p: Pose, rest: number, time: number): number {
  const k = Math.min(1, Math.max(p.propeller, p.flame))
  if (k <= 0) return rest
  const flap = 75 + 25 * Math.sin(time * Math.PI * 2 * (2 + 2 * p.propeller))
  return rest + (flap - rest) * k
}

// ---------- body ----------

function tailFeathers(flying: boolean): string {
  const spread = flying ? 30 : 18
  return h(
    'g',
    { class: 'ollie-tail' },
    [-1, 1, 0].map((i) =>
      h('path', {
        d: 'M -8 0 C -9 10 -6 18 0 20 C 6 18 9 10 8 0 Z',
        transform: path`translate(0 -14) rotate(${i * spread})`,
        fill: i ? BAR : FEATHER,
        ...ink(3),
      }),
    ),
  )
}

/** The merged silhouette: both outlines, then both fills, with the head turned by `tilt`. */
function silhouette(tilt: number): string {
  const turn = path`rotate(${tilt} ${NECK.x} ${NECK.y})`
  const outline = { fill: 'none', stroke: INK, strokeWidth: 7.2, strokeLinejoin: 'round' }
  return [
    h('path', { d: BODY, ...outline }),
    h('path', { d: HEAD, transform: turn, ...outline }),
    h('path', { d: BODY, fill: FEATHER }),
    h('path', { d: HEAD, transform: turn, fill: FEATHER }),
    h('ellipse', { cx: 0, cy: -34, rx: 38, ry: 30, fill: BELLY }),
  ].join('')
}

/** Rows of little chevron feathers on the belly. While busy each one shivers on its own phase. */
function chest(busy: number, t: number): string {
  const rows = [
    { y: -50, xs: [-16, 0, 16] },
    { y: -38, xs: [-24, -8, 8, 24] },
    { y: -26, xs: [-16, 0, 16] },
  ]
  const k = busy * 1.5
  let i = 0
  let d = ''
  for (const { y, xs } of rows) {
    for (const x of xs) {
      const dx = k * Math.sin(t * 14 + i * 1.7)
      const dy = k * Math.cos(t * 17 + i * 2.3)
      d += path`M ${x - 5 + dx} ${y - 2 + dy} L ${x + dx} ${y + 3 + dy} L ${x + 5 + dx} ${y - 2 + dy} `
      i++
    }
  }
  return h('path', { class: 'ollie-chest', d: d.trim(), fill: 'none', stroke: BAR, strokeWidth: 2.8, strokeLinecap: 'round', strokeLinejoin: 'round' })
}

/** An orange foot of three round toes. `lift` raises it in px; in flight the feet tuck up. */
function talons(side: -1 | 1, lift: number, flying: boolean): string {
  const x = side * 17
  const up = flying ? 8 : lift
  return h(
    'g',
    { transform: path`translate(0 ${-up})` },
    [-7, 7, 0].map((dx) => h('ellipse', { cx: x + dx, cy: dx ? -3 : -2, rx: 4.8, ry: 6, fill: ORANGE, ...ink(2.8) })),
  )
}

/**
 * A teardrop wing hangs from the shoulder along the body's side and ends in three feather
 * tips. Raising it swings it out and up, and the tips spread like fingers.
 */
function wing(side: 'L' | 'R', angle: number): string {
  const s = side === 'L' ? -1 : 1
  const raise = clamp((angle - 8) / 110, 0, 1)
  const fan = raise * 3
  return h(
    'g',
    { class: 'ollie-wing', transform: path`translate(${s * 52} -80) rotate(${-s * (angle - 8)})` },
    h('path', {
      d: path`M -13 0 C -20 18 -18 40 -10 58 L ${-6 - fan} ${52 - fan} L 0 ${62 + fan} L ${5 + fan} ${52 - fan} L 10 58 C 18 40 18 16 13 0 C 9 -12 -9 -12 -13 0 Z`,
      fill: FEATHER,
      ...ink(),
    }),
    h('path', { d: 'M -9 24 Q 0 30 9 24 M -9 38 Q 0 44 9 38', fill: 'none', stroke: BAR, strokeWidth: 2.8, strokeLinecap: 'round' }),
  )
}

// ---------- face ----------

function eye(cx: number, cy: number, shape: EyeShape, open: number, side: -1 | 1, t: number): string {
  const line = { fill: 'none', ...ink() }
  const r = IRIS_R
  switch (shape) {
    case 'open': {
      if (open < 0.25) return h('path', { d: path`M ${cx - 12} ${cy} Q ${cx} ${cy + 5} ${cx + 12} ${cy}`, ...line })
      return h(
        'g',
        null,
        h('ellipse', { cx, cy, rx: r, ry: r * open, fill: IRIS, ...ink(3) }),
        h('ellipse', { cx, cy, rx: r * 0.6, ry: r * 0.6 * open, fill: INK }),
        open > 0.6 && h('circle', { cx: cx - 3, cy: cy - 3.5 * open, r: 3, fill: '#fff' }),
        open > 0.6 && h('circle', { cx: cx + 3.5, cy: cy + 3.5 * open, r: 1.4, fill: '#fff' }),
      )
    }
    case 'wide':
      return h(
        'g',
        null,
        h('circle', { cx, cy, r: r + 2, fill: IRIS, ...ink(3) }),
        h('circle', { cx, cy, r: r * 0.85, fill: INK }),
        h('circle', { cx: cx - 4, cy: cy - 4, r: 4, fill: '#fff' }),
        h('circle', { cx: cx + 4, cy: cy + 5, r: 1.8, fill: '#fff' }),
      )
    case 'happy':
      return h('path', { d: path`M ${cx - 12} ${cy + 4} Q ${cx} ${cy - 10} ${cx + 12} ${cy + 4}`, ...line })
    case 'closed':
      return h('path', { d: path`M ${cx - 12} ${cy - 1} Q ${cx} ${cy + 8} ${cx + 12} ${cy - 1}`, ...line })
    case 'squint': {
      const dir = -side
      return h('path', { d: path`M ${cx - 8 * dir} ${cy - 8} L ${cx + 7 * dir} ${cy} L ${cx - 8 * dir} ${cy + 8}`, ...line })
    }
    case 'x':
      return h('path', { d: path`M ${cx - 8} ${cy - 8} L ${cx + 8} ${cy + 8} M ${cx + 8} ${cy - 8} L ${cx - 8} ${cy + 8}`, ...line })
    case 'heart':
      return h('path', {
        transform: path`translate(${cx} ${cy}) scale(${1.7 * Math.max(0.3, open)})`,
        d: 'M 0 7 C -10 0 -9 -8 -4 -8 C -1.5 -8 0 -6 0 -4 C 0 -6 1.5 -8 4 -8 C 9 -8 10 0 0 7 Z',
        fill: '#E5484D',
        ...ink(1.8),
      })
    case 'spiral': {
      let d = ''
      for (let i = 0; i <= 40; i++) {
        const a = (i / 40) * Math.PI * 4
        const rr = (i / 40) * 12
        d += `${i ? 'L' : 'M'} ${n(Math.cos(a) * rr)} ${n(Math.sin(a) * rr)} `
      }
      return h('path', { transform: path`translate(${cx} ${cy}) rotate(${-t * 540 * side})`, d, ...line, strokeWidth: 2.8 })
    }
  }
}

/** The pale discs each eye sits in, merged into one mask with a rim only around the outside. */
function discs(): string {
  const both = (attrs: Record<string, string | number>) =>
    h('circle', { cx: -EYE_DX, cy: EYE_Y, r: DISC_R, ...attrs }) + h('circle', { cx: EYE_DX, cy: EYE_Y, r: DISC_R, ...attrs })
  return both({ fill: 'none', stroke: BAR, strokeWidth: 6 }) + both({ fill: DISC })
}

/** Brows are the feathered rim of the eye discs, tilted by the pose. */
function brows(k: number, lx: number, ly: number): string {
  const y = EYE_Y - DISC_R - 2 + ly * 0.6
  const inner = 6 * clamp(k, -1, 1.3)
  return h(
    'g',
    { ...ink(3.4), opacity: Math.min(1, Math.abs(k) * 1.5) },
    h('line', { x1: -EYE_DX - 12 + lx, y1: y + 3, x2: -EYE_DX + 8 + lx, y2: y - inner }),
    h('line', { x1: EYE_DX + 12 + lx, y1: y + 3, x2: EYE_DX - 8 + lx, y2: y - inner }),
  )
}

/**
 * A hooked orange beak between the eye discs. Closed, a crease across it bends with the smile;
 * talking drops the lower half open under the upper one.
 */
function beak(curve: number, open: number, width: number, dx: number, dy: number): string {
  const w = 8 * clamp(width, 0.6, 1.4)
  const y = -104 + dy
  const parts: string[] = []
  const k = clamp(open, 0, 1)
  if (k >= 0.05) {
    const depth = 6 + k * 12
    parts.push(
      h('path', { d: path`M ${dx - w + 1} ${y + 6} Q ${dx} ${y + 6 + depth * 1.3} ${dx + w - 1} ${y + 6} Z`, fill: '#7a2a2a', ...ink(2.6) }),
      h('path', { d: path`M ${dx - w * 0.6} ${y + 5 + depth * 0.7} Q ${dx} ${y + 7 + depth} ${dx + w * 0.6} ${y + 5 + depth * 0.7} Q ${dx} ${y + 4 + depth * 1.2} ${dx - w * 0.6} ${y + 5 + depth * 0.7} Z`, fill: ORANGE, ...ink(2.4) }),
    )
  }
  const tip = y + 18 - k * 5
  parts.push(h('path', { d: path`M ${dx - w} ${y} Q ${dx} ${y - 4} ${dx + w} ${y} Q ${dx + 4} ${y + 9} ${dx} ${tip} Q ${dx - 4} ${y + 9} ${dx - w} ${y} Z`, fill: ORANGE, ...ink(3) }))
  if (k < 0.05) parts.push(h('path', { d: path`M ${dx - w * 0.6} ${y + 5} Q ${dx} ${y + 5 + curve * 3} ${dx + w * 0.6} ${y + 5}`, fill: 'none', ...ink(2.2) }))
  return parts.join('')
}

/**
 * Round reading glasses. They follow the eyes a little less than the eyes move, so the eyes
 * stay inside the lenses, and slide down the beak as Ollie gets busy.
 */
function glasses(busy: number, lx: number, ly: number): string {
  const x = lx * 0.8
  const y = EYE_Y + ly * 0.8 + busy * 10
  const r = LENS_R
  return h(
    'g',
    { class: 'ollie-glasses', fill: 'none', stroke: FRAME, strokeLinecap: 'round' },
    h('circle', { cx: -EYE_DX + x, cy: y, r, strokeWidth: 3.4 }),
    h('circle', { cx: EYE_DX + x, cy: y, r, strokeWidth: 3.4 }),
    h('path', { d: path`M ${-EYE_DX + r + x} ${y - 3} Q ${x} ${y - 7} ${EYE_DX - r + x} ${y - 3}`, strokeWidth: 3.2 }),
    h('path', { d: path`M ${-EYE_DX - r + x} ${y - 4} L ${-59} ${y - 9} M ${EYE_DX + r + x} ${y - 4} L ${59} ${y - 9}`, strokeWidth: 2.8 }),
    // a glint on each lens
    h('path', { d: path`M ${-EYE_DX - 12 + x} ${y - 8} Q ${-EYE_DX - 10 + x} ${y - 13} ${-EYE_DX - 5 + x} ${y - 14} M ${EYE_DX - 12 + x} ${y - 8} Q ${EYE_DX - 10 + x} ${y - 13} ${EYE_DX - 5 + x} ${y - 14}`, stroke: '#fff', strokeWidth: 2.2, opacity: 0.8 }),
  )
}

function tears(k: number, t: number, lx: number, ly: number): string {
  const drops: string[] = []
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const ph = (t * 1.6 + i / 3 + (side > 0 ? 0.15 : 0)) % 1
      const x = side * (EYE_DX + 11) + lx + side * ph * 8
      const y = EYE_Y + ly + 12 + ph * 34
      drops.push(h('path', { transform: path`translate(${x} ${y}) scale(${0.9 + ph * 0.3})`, d: 'M 0 -4 Q 3 0 0 3 Q -3 0 0 -4 Z', fill: TEAR, stroke: '#3c8fbf', strokeWidth: 0.8, opacity: k * (1 - ph * 0.6) }))
    }
  }
  return drops.join('')
}

function face(p: Pose, busy: number, t: number): string {
  const lx = p.lookX
  const ly = p.lookY
  return h(
    'g',
    null,
    discs(),
    p.blush > 0.01 &&
      h('g', { fill: PINK, opacity: p.blush * 0.7 }, h('ellipse', { cx: -36 + lx, cy: -94 + ly, rx: 8, ry: 4.5 }), h('ellipse', { cx: 36 + lx, cy: -94 + ly, rx: 8, ry: 4.5 })),
    eye(-EYE_DX + lx, EYE_Y + ly, p.eye, p.eyeOpen, -1, t),
    eye(EYE_DX + lx, EYE_Y + ly, p.eye, p.eyeOpen, 1, t),
    Math.abs(p.brow) > 0.02 && brows(p.brow, lx, ly),
    glasses(busy, lx, ly),
    beak(p.mouthCurve, p.mouthOpen, p.mouthWidth, lx * 0.6, ly * 0.4),
    p.tears > 0.01 && tears(p.tears, t, lx, ly),
  )
}

function sweatDrop(k: number, t: number): string {
  const slide = (t * 0.8) % 1
  return h('path', {
    transform: path`translate(66 ${-140 + slide * 14}) scale(1.3)`,
    d: 'M 0 -6 Q 5 1 0 4 Q -5 1 0 -6 Z',
    fill: TEAR,
    stroke: '#3c8fbf',
    strokeWidth: 1,
    opacity: k * (1 - slide * 0.5),
  })
}

/** Ollie: a little night owl in reading glasses that slide down its beak while it works. */
export const Ollie = defineCharacter({
  id: 'ollie',
  name: 'Ollie',
  kind: 'night owl',
  skeleton: false,
  palette: { phosphor: INK, phosphorDim: BAR, screenInner: DISC, screenOuter: BAR },
  effectsOffsetY: -28,
  iconViewBox: '-86 -192 172 198',
  body: ({ pose: p, time }) => {
    const busy = busyLevel(p)
    const flying = p.propeller > 0 || p.flame > 0
    const tilt = headTilt(p, time)
    return [
      tailFeathers(flying),
      silhouette(tilt),
      chest(busy, time),
      talons(-1, p.legL, flying),
      talons(1, p.legR, flying),
      h('g', { class: 'ollie-head', transform: path`rotate(${tilt} ${NECK.x} ${NECK.y})` }, face(p, busy, time)),
      wing('L', wingAngle(p, p.armL, time)),
      wing('R', wingAngle(p, p.armR, time)),
      p.sweat > 0.01 && sweatDrop(p.sweat, time),
    ]
      .filter(Boolean)
      .join('')
  },
})
