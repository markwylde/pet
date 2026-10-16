import type { Point, Size } from './types.js'

/** The pet's box at size 1, in CSS pixels. Everything scales from here. */
export const BOX = { width: 180, height: 220 }
/** Where the feet sit inside the box at size 1; the pet scales around this point. */
export const FEET = { x: 90, y: 190 }

export interface Rect {
  left: number
  top: number
  right: number
  bottom: number
}

export const feetAt = (size: number): Point => ({ x: FEET.x * size, y: FEET.y * size })

/**
 * Keep the pet's visible body inside the bounds. The box has transparent margins
 * (room for effects), so it may hang a little past the edges.
 */
export function clampPet(p: Point, size: number, b: Rect): Point {
  return {
    x: Math.min(Math.max(p.x, b.left - 20 * size), b.right - (BOX.width - 20) * size),
    y: Math.min(Math.max(p.y, b.top - 40 * size), b.bottom - (BOX.height - 10) * size),
  }
}

// ---------- chat attachment ----------
// Must match the .mwpet-chat[data-side/align] offsets in styles.ts.
export const ATTACH = { overlapX: 22, bottomGap: 40, top: 70 }
const MARGIN = 8

export interface Placement {
  side: 'left' | 'right'
  align: 'top' | 'bottom'
}

function attachRect(p: Point, size: number, att: Size, pl: Placement): Rect {
  const W = BOX.width * size
  const H = BOX.height * size
  const left = pl.side === 'right' ? p.x + W - ATTACH.overlapX * size : p.x + ATTACH.overlapX * size - att.width
  const top = pl.align === 'bottom' ? p.y + H - ATTACH.bottomGap * size - att.height : p.y + ATTACH.top * size
  return { left, top, right: left + att.width, bottom: top + att.height }
}

/** Keep the current side if it fits, otherwise flip, otherwise take the roomier side. */
export function choosePlacement(p: Point, size: number, att: Size, prev: Placement, b: Rect): Placement {
  const fitsX = (side: Placement['side']) => {
    const r = attachRect(p, size, att, { ...prev, side })
    return r.left >= b.left + MARGIN && r.right <= b.right - MARGIN
  }
  const fitsY = (align: Placement['align']) => {
    const r = attachRect(p, size, att, { ...prev, align })
    return r.top >= b.top + MARGIN && r.bottom <= b.bottom - MARGIN
  }
  const otherSide = prev.side === 'right' ? 'left' : 'right'
  const otherAlign = prev.align === 'top' ? 'bottom' : 'top'
  const roomRight = b.right - (p.x + BOX.width * size)
  const roomBelow = b.bottom - (p.y + BOX.height * size)
  return {
    side: fitsX(prev.side) ? prev.side : fitsX(otherSide) ? otherSide : roomRight > p.x - b.left ? 'right' : 'left',
    align: fitsY(prev.align) ? prev.align : fitsY(otherAlign) ? otherAlign : roomBelow > p.y - b.top ? 'top' : 'bottom',
  }
}

/** Clamp the pet so that it and its attachment are both inside the bounds. */
export function clampWithAttachment(p: Point, size: number, att: Size | null, pl: Placement, b: Rect): Point {
  const c = clampPet(p, size, b)
  if (!att) return c
  const r = attachRect(c, size, att, pl)
  const dx = r.left < b.left + MARGIN ? b.left + MARGIN - r.left : r.right > b.right - MARGIN ? b.right - MARGIN - r.right : 0
  const dy = r.top < b.top + MARGIN ? b.top + MARGIN - r.top : r.bottom > b.bottom - MARGIN ? b.bottom - MARGIN - r.bottom : 0
  return clampPet({ x: c.x + dx, y: c.y + dy }, size, b)
}

/** Largest attachment that still fits next to the pet. */
export function attachmentMax(size: number, pl: Placement, b: Rect): Size {
  const petW = BOX.width * size
  return {
    width: Math.max(200, b.right - b.left - 2 * MARGIN - (petW - (ATTACH.overlapX + 20) * size)),
    height: Math.max(200, b.bottom - b.top - 2 * MARGIN - (pl.align === 'top' ? (ATTACH.top - 40) * size : 0)),
  }
}

/** Point on a hop arc from a to b, peaking above the higher of the two. */
export function arc(a: Point, b: Point, k: number): Point {
  const c = { x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - 140 }
  const u = 1 - k
  return { x: u * u * a.x + 2 * u * k * c.x + k * k * b.x, y: u * u * a.y + 2 * u * k * c.y + k * k * b.y }
}

export const smooth = (k: number) => k * k * (3 - 2 * k)
