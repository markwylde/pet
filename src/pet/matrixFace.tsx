import type { ReactNode } from 'react'
import type { EyeShape } from './pose'

/**
 * Rack's face: an LED dot-matrix panel. Everything snaps to a grid of square pixels,
 * so motion (glances, mouth flaps) steps from LED to LED like a real display.
 */
export const CELL = 3.4
const DOT = 2.7

const snap = (v: number) => Math.round(v / CELL) * CELL

function Dots({ cells, fill, opacity }: { cells: [number, number][]; fill: string; opacity?: number }) {
  return (
    <g fill={fill} opacity={opacity}>
      {cells.map(([x, y]) => (
        <rect key={`${x.toFixed(1)},${y.toFixed(1)}`} x={x - DOT / 2} y={y - DOT / 2} width={DOT} height={DOT} rx={0.5} />
      ))}
    </g>
  )
}

/** Unlit LEDs behind the face, so it reads as a panel even when the face is small. */
export function MatrixGrid({ id, color, x, y, w, h }: { id: string; color: string; x: number; y: number; w: number; h: number }) {
  return (
    <>
      <pattern id={id} x={-CELL / 2} y={-CELL / 2} width={CELL} height={CELL} patternUnits="userSpaceOnUse">
        <rect x={(CELL - DOT) / 2} y={(CELL - DOT) / 2} width={DOT} height={DOT} rx={0.5} fill={color} opacity={0.09} />
      </pattern>
      <rect x={x} y={y} width={w} height={h} fill={`url(#${id})`} />
    </>
  )
}

function bitmap(rows: string[], cx: number, cy: number, mirror = false): [number, number][] {
  const w = rows[0].length
  const h = rows.length
  const x0 = snap(cx - ((w - 1) / 2) * CELL)
  const y0 = snap(cy - ((h - 1) / 2) * CELL)
  const out: [number, number][] = []
  rows.forEach((row, r) => {
    for (let c = 0; c < w; c++) {
      const ch = mirror ? row[w - 1 - c] : row[c]
      if (ch === '#') out.push([x0 + c * CELL, y0 + r * CELL])
    }
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
const RING: [number, number][] = [
  [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [4, 1], [4, 2], [4, 3],
  [4, 4], [3, 4], [2, 4], [1, 4], [0, 4], [0, 3], [0, 2], [0, 1],
]

interface EyeProps {
  cx: number
  cy: number
  shape: EyeShape
  open: number
  side: 'L' | 'R'
  t: number
  lookX: number
  color: string
  pink: string
}

export function MatrixEye({ cx, cy, shape, open, side, t, lookX, color, pink }: EyeProps) {
  if (shape === 'open') {
    // a wide visor bar; blinking drops rows, and a dark "glint" LED slides with the gaze
    const rows = open < 0.3 ? 1 : open < 0.75 ? 2 : 3
    const cells = bitmap(Array(rows).fill('######'), cx, cy)
    const glint = rows === 3 ? Math.max(0, Math.min(5, Math.round(1 + lookX / 2))) : -1
    return <Dots cells={cells.filter((_, i) => i !== glint)} fill={color} />
  }
  if (shape === 'spiral') {
    const head = Math.floor(t * 18) % RING.length
    const x0 = snap(cx - 2 * CELL)
    const y0 = snap(cy - 2 * CELL)
    return (
      <g>
        {RING.map(([c, r], i) => {
          const age = (head - i + RING.length) % RING.length
          return age < 6 ? <Dots key={i} cells={[[x0 + c * CELL, y0 + r * CELL]]} fill={color} opacity={1 - age / 6} /> : null
        })}
        <Dots cells={[[x0 + 2 * CELL, y0 + 2 * CELL]]} fill={color} />
      </g>
    )
  }
  const rows = EYES[shape] ?? EYES.wide!
  return <Dots cells={bitmap(rows, cx, cy, side === 'R')} fill={shape === 'heart' ? pink : color} />
}

interface MouthProps {
  curve: number
  open: number
  width: number
  dx: number
  y: number
  color: string
  pink: string
}

/** Same curve maths as the CRT mouth, rasterised column by column onto the LED grid. */
export function MatrixMouth({ curve, open, width, dx, y, color, pink }: MouthProps) {
  const w = 12 * width
  const n = Math.max(2, Math.round(w / CELL))
  const x0 = snap(dx)
  const endY = y - curve * 3
  const k = Math.min(1, open)
  const isOpen = open >= 0.05
  // a closed mouth is exaggerated a little so gentle smiles survive the snap to the grid
  const upper = isOpen ? y + curve * 8 * (curve > 0 ? 1 - k * 0.75 : 1) : y + curve * 14
  const depth = curve < 0 ? 1 + k * 6 : 2 + k * 13 + curve * 2
  const bot = endY + depth / 0.75

  const lit = new Map<string, [number, number]>()
  const tongue: [number, number][] = []
  const add = (x: number, yy: number) => lit.set(`${x.toFixed(1)},${yy.toFixed(1)}`, [x, yy])
  // join neighbouring columns vertically so the line has no gaps
  const joinColumn = (x: number, from: number, to: number) => {
    for (let r = Math.min(from, to); r <= Math.max(from, to) + 0.01; r += CELL) add(x, r)
  }

  let prevTop: number | null = null
  let prevBottom: number | null = null
  for (let c = -n; c <= n; c++) {
    const u = (c + n) / (2 * n)
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
    if (k > 0.3 && curve > -0.2 && Math.abs(c) <= n / 2 && bottom - top > CELL * 1.5) tongue.push([x, bottom - CELL])
  }
  return (
    <g>
      <Dots cells={[...lit.values()]} fill={color} />
      <Dots cells={tongue} fill={pink} opacity={0.9} />
    </g>
  )
}

export function MatrixBrows({ k, lx, ly, eyeY, eyeDx, color }: { k: number; lx: number; ly: number; eyeY: number; eyeDx: number; color: string }) {
  const y = eyeY - 13 + ly * 0.6
  const inner = 4.5 * Math.min(k, 1.3)
  const cells: [number, number][] = []
  for (const side of [-1, 1]) {
    // outer end low, inner end raised (worried)
    for (let i = 0; i <= 4; i++) {
      const f = i / 4
      cells.push([snap(side * (eyeDx + 8 - f * 14) + lx), snap(y + 1 - f * (inner + 1))])
    }
  }
  return <Dots cells={cells} fill={color} opacity={Math.min(1, k * 1.5)} />
}

export function MatrixBlush({ k, pink }: { k: number; pink: string }): ReactNode {
  const cells: [number, number][] = []
  for (const side of [-1, 1]) for (let i = -1; i <= 1; i++) cells.push([snap(side * 29 + i * CELL), snap(-82)])
  return <Dots cells={cells} fill={pink} opacity={k * 0.7} />
}
