import type { EyeShape, Pose } from '../pose.js'
import { h } from '../svg.js'
import { EYE_DX, EYE_Y, MOUTH_Y, PINK, SCREEN, type RenderContext } from './context.js'

/**
 * Rack's face: an LED dot-matrix panel. Everything snaps to a grid of square pixels,
 * so motion (glances, mouth flaps) steps from LED to LED like a real display.
 */
const CELL = 3.4
const DOT = 2.7

type Cell = [number, number]

const snap = (v: number) => Math.round(v / CELL) * CELL

function dots(cells: Cell[], fill: string, opacity?: number): string {
  if (!cells.length) return ''
  return h('g', { fill, opacity }, cells.map(([x, y]) => h('rect', { x: x - DOT / 2, y: y - DOT / 2, width: DOT, height: DOT, rx: 0.5 })))
}

/** Unlit LEDs behind the face, so it reads as a panel even when the face is small. */
export function matrixGrid(ctx: RenderContext): string {
  return [
    h(
      'pattern',
      { id: ctx.id('matrix'), x: -CELL / 2, y: -CELL / 2, width: CELL, height: CELL, patternUnits: 'userSpaceOnUse' },
      h('rect', { x: (CELL - DOT) / 2, y: (CELL - DOT) / 2, width: DOT, height: DOT, rx: 0.5, fill: ctx.character.palette.phosphor, opacity: 0.09 }),
    ),
    h('rect', { x: SCREEN.x, y: SCREEN.y, width: SCREEN.w, height: SCREEN.h, fill: ctx.url('matrix') }),
  ].join('')
}

export function matrixFace(p: Pose, t: number, ctx: RenderContext, hideMouth: boolean): string {
  const ink = ctx.character.palette.phosphor
  return [
    p.blush > 0.01 && blush(p.blush),
    eye(-EYE_DX + p.lookX, EYE_Y + p.lookY, p.eye, p.eyeOpen, 'L', t, p.lookX, ink),
    eye(EYE_DX + p.lookX, EYE_Y + p.lookY, p.eye, p.eyeOpen, 'R', t, p.lookX, ink),
    p.brow > 0.02 && brows(p.brow, p.lookX, p.lookY, ink),
    !hideMouth && mouth(p.mouthCurve, p.mouthOpen, p.mouthWidth, p.lookX * 0.5, MOUTH_Y + p.lookY * 0.4, ink),
  ].join('')
}

function bitmap(rows: string[], cx: number, cy: number, mirror = false): Cell[] {
  const w = rows[0].length
  const x0 = snap(cx - ((w - 1) / 2) * CELL)
  const y0 = snap(cy - ((rows.length - 1) / 2) * CELL)
  const out: Cell[] = []
  rows.forEach((row, r) => {
    for (let c = 0; c < w; c++) if ((mirror ? row[w - 1 - c] : row[c]) === '#') out.push([x0 + c * CELL, y0 + r * CELL])
  })
  return out
}

const EYES: Partial<Record<EyeShape, string[]>> = {
  happy: ['..##..', '.#..#.', '#....#'],
  closed: ['#....#', '.####.'],
  squint: ['##....', '..##..', '....##', '..##..', '##....'],
  wide: ['######', '#....#', '#.##.#', '#....#', '######'],
  x: ['#....#', '.#..#.', '..##..', '.#..#.', '#....#'],
  heart: ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'],
}

// clockwise perimeter of a 5×5 ring, for the "processing" eye
const RING: Cell[] = [
  [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [4, 1], [4, 2], [4, 3],
  [4, 4], [3, 4], [2, 4], [1, 4], [0, 4], [0, 3], [0, 2], [0, 1],
]

function eye(cx: number, cy: number, shape: EyeShape, open: number, side: 'L' | 'R', t: number, lookX: number, ink: string): string {
  if (shape === 'open') {
    // a wide visor bar; blinking drops rows, and a dark "glint" LED slides with the gaze
    const rows = open < 0.3 ? 1 : open < 0.75 ? 2 : 3
    const cells = bitmap(Array<string>(rows).fill('######'), cx, cy)
    const glint = rows === 3 ? Math.max(0, Math.min(5, Math.round(1 + lookX / 2))) : -1
    return dots(
      cells.filter((_, i) => i !== glint),
      ink,
    )
  }
  if (shape === 'spiral') {
    const head = Math.floor(t * 18) % RING.length
    const x0 = snap(cx - 2 * CELL)
    const y0 = snap(cy - 2 * CELL)
    const ring = RING.map(([c, r], i) => {
      const age = (head - i + RING.length) % RING.length
      return age < 6 ? dots([[x0 + c * CELL, y0 + r * CELL]], ink, 1 - age / 6) : ''
    })
    return ring.join('') + dots([[x0 + 2 * CELL, y0 + 2 * CELL]], ink)
  }
  return dots(bitmap(EYES[shape] ?? EYES.wide!, cx, cy, side === 'R'), shape === 'heart' ? PINK : ink)
}

/** Same curve maths as the CRT mouth, rasterised column by column onto the LED grid. */
function mouth(curve: number, open: number, width: number, dx: number, y: number, ink: string): string {
  const w = 12 * width
  const span = Math.max(2, Math.round(w / CELL))
  const x0 = snap(dx)
  const endY = y - curve * 3
  const k = Math.min(1, open)
  const isOpen = open >= 0.05
  // a closed mouth is exaggerated a little so gentle smiles survive the snap to the grid
  const upper = isOpen ? y + curve * 8 * (curve > 0 ? 1 - k * 0.75 : 1) : y + curve * 14
  const depth = curve < 0 ? 1 + k * 6 : 2 + k * 13 + curve * 2
  const bot = endY + depth / 0.75

  const lit = new Map<string, Cell>()
  const tongue: Cell[] = []
  const add = (x: number, yy: number) => lit.set(`${x.toFixed(1)},${yy.toFixed(1)}`, [x, yy])
  // join neighbouring columns vertically so the line has no gaps
  const joinColumn = (x: number, from: number, to: number) => {
    for (let r = Math.min(from, to); r <= Math.max(from, to) + 0.01; r += CELL) add(x, r)
  }

  let prevTop: number | null = null
  let prevBottom: number | null = null
  for (let c = -span; c <= span; c++) {
    const u = (c + span) / (2 * span)
    const x = x0 + c * CELL
    const top = snap(endY + 2 * u * (1 - u) * (upper - endY))
    add(x, top)
    if (prevTop !== null && Math.abs(prevTop - top) > CELL) joinColumn(x, prevTop + Math.sign(top - prevTop) * CELL, top)
    prevTop = top
    if (!isOpen) continue

    const bottom = Math.max(top, snap(endY + 3 * u * (1 - u) * (bot - endY)))
    add(x, bottom)
    if (prevBottom !== null && Math.abs(prevBottom - bottom) > CELL) joinColumn(x, prevBottom + Math.sign(bottom - prevBottom) * CELL, bottom)
    prevBottom = bottom
    if (k > 0.3 && curve > -0.2 && Math.abs(c) <= span / 2 && bottom - top > CELL * 1.5) tongue.push([x, bottom - CELL])
  }
  return dots([...lit.values()], ink) + dots(tongue, PINK, 0.9)
}

function brows(k: number, lx: number, ly: number, ink: string): string {
  const y = EYE_Y - 13 + ly * 0.6
  const inner = 4.5 * Math.min(k, 1.3)
  const cells: Cell[] = []
  for (const side of [-1, 1]) {
    // outer end low, inner end raised (worried)
    for (let i = 0; i <= 4; i++) {
      const f = i / 4
      cells.push([snap(side * (EYE_DX + 8 - f * 14) + lx), snap(y + 1 - f * (inner + 1))])
    }
  }
  return dots(cells, ink, Math.min(1, k * 1.5))
}

function blush(k: number): string {
  const cells: Cell[] = []
  for (const side of [-1, 1]) for (let i = -1; i <= 1; i++) cells.push([snap(side * 29 + i * CELL), snap(-82)])
  return dots(cells, PINK, k * 0.7)
}
