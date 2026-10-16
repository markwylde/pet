import type { Character } from '../characters/types.js'
import { BASE_POSE, type Pose } from '../pose.js'
import { h, path } from '../svg.js'
import { SCREEN, createContext, type RenderContext } from './context.js'
import { crtFace } from './crt.js'
import { matrixFace, matrixGrid } from './matrix.js'
import * as parts from './parts.js'
import { toonFace } from './toon.js'

/** The full stage the pet is drawn in, including room above for hearts and clouds. */
export const STAGE_VIEWBOX = '-120 -250 240 290'

function defs(ctx: RenderContext): string {
  const { palette } = ctx.character
  // a toon face has no screen, so it needs none of the screen's gradients or clip
  const screenless = ctx.character.skeleton && ctx.character.face === 'toon'
  return h(
    'defs',
    null,
    h(
      'linearGradient',
      { id: ctx.id('body-side'), x1: 0, y1: 0, x2: 1, y2: 0 },
      h('stop', { offset: 0, stopColor: 'rgba(255,255,255,0.35)' }),
      h('stop', { offset: 0.25, stopColor: 'rgba(255,255,255,0)' }),
      h('stop', { offset: 0.8, stopColor: 'rgba(0,0,0,0)' }),
      h('stop', { offset: 1, stopColor: 'rgba(0,0,0,0.12)' }),
    ),
    !screenless &&
      h(
        'radialGradient',
        { id: ctx.id('screen'), cx: 0.5, cy: 0.45, r: 0.75 },
        h('stop', { offset: 0, stopColor: palette.screenInner }),
        h('stop', { offset: 1, stopColor: palette.screenOuter }),
      ),
    !screenless &&
      h(
        'linearGradient',
        { id: ctx.id('glass'), x1: 0, y1: 0, x2: 1, y2: 1 },
        h('stop', { offset: 0, stopColor: 'rgba(255,255,255,0.22)' }),
        h('stop', { offset: 0.4, stopColor: 'rgba(255,255,255,0.02)' }),
        h('stop', { offset: 1, stopColor: 'rgba(255,255,255,0)' }),
      ),
    !screenless && h('pattern', { id: ctx.id('scan'), width: 4, height: 3, patternUnits: 'userSpaceOnUse' }, h('rect', { width: 4, height: 1, fill: 'rgba(0,0,0,0.28)' })),
    h(
      'filter',
      { id: ctx.id('glow'), x: '-50%', y: '-50%', width: '200%', height: '200%' },
      h('feGaussianBlur', { stdDeviation: 1.6, result: 'b' }),
      h('feMerge', null, h('feMergeNode', { in: 'b' }), h('feMergeNode', { in: 'SourceGraphic' })),
    ),
    h(
      'linearGradient',
      { id: ctx.id('flame'), x1: 0, y1: 0, x2: 0, y2: 1 },
      h('stop', { offset: 0, stopColor: '#fff6c2' }),
      h('stop', { offset: 0.35, stopColor: '#ffb02e' }),
      h('stop', { offset: 1, stopColor: 'rgba(255,70,30,0)' }),
    ),
    screenless &&
      h(
        'radialGradient',
        { id: ctx.id('shade') },
        h('stop', { offset: 0.55, stopColor: '#1b1030' }),
        h('stop', { offset: 1, stopColor: '#1b1030', stopOpacity: 0 }),
      ),
    !screenless && h('clipPath', { id: ctx.id('screen-clip') }, h('rect', { x: SCREEN.x, y: SCREEN.y, width: SCREEN.w, height: SCREEN.h, rx: 10 })),
  )
}

function screen(p: Pose, t: number, ctx: RenderContext): string {
  const { phosphor } = ctx.character.palette
  const matrix = ctx.character.face === 'matrix'
  const jitter = p.glitch > 0 ? Math.sin(t * 91) * 4 * p.glitch : 0
  const hideMouth = p.progress >= 0 || p.code > 0 || p.spinner > 0
  const rect = { x: SCREEN.x, y: SCREEN.y, width: SCREEN.w, height: SCREEN.h }
  return h(
    'g',
    { clipPath: ctx.url('screen-clip') },
    h('rect', { ...rect, fill: ctx.url('screen') }),
    matrix && matrixGrid(ctx),
    h(
      'g',
      { transform: path`translate(${jitter} 0)`, filter: ctx.url('glow') },
      matrix ? matrixFace(p, t, ctx, hideMouth) : crtFace(p, t, ctx, hideMouth),
      p.progress >= 0 && parts.progressBar(p.progress, ctx),
      p.code > 0 && parts.code(p.code, ctx),
      p.spinner > 0 && parts.spinner(p.spinner, ctx),
      p.tears > 0.01 && parts.tears(p.tears, t, p.lookX),
    ),
    p.glitch > 0 && h('rect', { x: SCREEN.x, y: -100 + Math.sin(t * 53) * 25, width: SCREEN.w, height: 5, fill: phosphor, opacity: 0.25 * p.glitch }),
    !matrix && h('rect', { ...rect, fill: ctx.url('scan') }),
    h('rect', { ...rect, fill: '#000', opacity: (1 - p.screen) * 0.85 }),
    h('path', {
      d: path`M ${SCREEN.x + 4} ${SCREEN.y + 30} Q ${SCREEN.x + 6} ${SCREEN.y + 5} ${SCREEN.x + 34} ${SCREEN.y + 4} L ${SCREEN.x + 50} ${SCREEN.y + 4} Q ${SCREEN.x + 14} ${SCREEN.y + 10} ${SCREEN.x + 4} ${SCREEN.y + 30} Z`,
      fill: ctx.url('glass'),
    }),
  )
}

/** A toon face has no screen: ink over the body, with glitch as a shiver and `screen` as a shadow. */
function toonLayer(p: Pose, t: number, ctx: RenderContext): string {
  const jitter = p.glitch > 0 ? Math.sin(t * 91) * 4 * p.glitch : 0
  return h(
    'g',
    { transform: path`translate(${jitter} 0)` },
    toonFace(p, t, ctx),
    p.screen < 0.999 && h('ellipse', { class: 'mwpet-shade', cx: 0, cy: -98, rx: 58, ry: 50, fill: ctx.url('shade'), opacity: (1 - p.screen) * 0.6 }),
    p.tears > 0.01 && parts.tears(p.tears, t, p.lookX, '#3c8fbf'),
  )
}

function screenOverlays(p: Pose, ctx: RenderContext): string {
  return [
    p.progress >= 0 && parts.progressBar(p.progress, ctx),
    p.code > 0 && parts.code(p.code, ctx),
    p.spinner > 0 && parts.spinner(p.spinner, ctx),
  ]
    .filter(Boolean)
    .join('')
}

/** The shared skeleton (limbs, antenna, face, props) around the character's body, with any parts the character replaces. */
function robot(p: Pose, time: number, ctx: RenderContext): string {
  const c = ctx.character
  const limb = { pose: p, time, id: ctx.id, url: ctx.url, h }
  const arm = (side: 'L' | 'R', angle: number) => {
    if (!c.arm) return parts.arm(side, angle, ctx)
    const { x, y } = c.anchors.shoulder
    return c.arm({ ...limb, side, angle, shoulder: { x: side === 'L' ? -x : x, y } })
  }
  return [
    p.flame > 0 && c.rocket && parts.flame(time, p.flame, ctx),
    c.legs ? c.legs({ ...limb, left: p.legL, right: p.legR }) : parts.legs(p.legL, p.legR, ctx),
    c.antenna && parts.antenna(p.antenna, p.propeller, time, ctx),
    c.body(limb),
    c.face === 'toon' ? toonLayer(p, time, ctx) : screen(p, time, ctx),
    p.keyboard > 0 && parts.keyboard(p.keyboard, time),
    arm('L', p.armL),
    arm('R', p.armR),
    p.sweat > 0.01 && parts.sweat(p.sweat, time, ctx),
  ]
    .filter(Boolean)
    .join('')
}

/** Inner SVG markup for one frame. */
export function renderFrame(p: Pose, time: number, ctx: RenderContext): string {
  const c = ctx.character
  const body = path`translate(${p.x} ${p.y}) translate(0 -80) rotate(${p.rot}) translate(0 80) scale(${p.sx} ${p.sy})`
  const fx = path`translate(${p.x} ${p.y})`
  const lift = Math.max(0, -p.y)
  const shadow = Math.max(0.35, 1 - lift / 120) * (p.propeller > 0 ? 0.6 : 1)
  const toon = c.skeleton && c.face === 'toon'
  const overlays = toon ? screenOverlays(p, ctx) : ''
  return [
    defs(ctx),
    h('ellipse', { cx: p.x, cy: 6, rx: 44 * shadow, ry: 7 * shadow, fill: 'rgba(0,0,0,0.22)' }),
    p.speedLines > 0 && parts.speedLines(time, p.speedAngle, p.speedLines, fx),
    h('g', { transform: body }, c.skeleton ? robot(p, time, ctx) : c.body({ pose: p, time, id: ctx.id, url: ctx.url, h })),
    h(
      'g',
      { transform: `${fx} translate(0 ${c.effectsOffsetY})` },
      p.hearts > 0 && parts.hearts(p.hearts),
      p.zzz > 0 && parts.zzz(p.zzz),
      p.sparkles > 0 && parts.sparkles(p.sparkles),
      p.cloud > 0.01 && parts.rainCloud(p.cloud, time),
      p.gears > 0 && (toon ? h('g', { transform: 'translate(56 0)' }, parts.gears(p.gears)) : parts.gears(p.gears)),
      overlays && parts.thoughtBubble(overlays, c.effectsOffsetY, ctx),
    ),
  ]
    .filter(Boolean)
    .join('')
}

let iconCount = 0

export interface IconOptions {
  /** Pose to draw; defaults to the resting pose. */
  pose?: Partial<Pose>
  /** Override the framing; defaults to `character.iconViewBox`. */
  viewBox?: string
  /** Accessible label. When omitted the icon is decorative (`aria-hidden`). */
  title?: string
}

/**
 * A static picture of a character as an `<svg>` string — for pickers, docks and tray icons.
 * Size it with CSS; it fills its container.
 *
 * @example
 * button.innerHTML = renderIcon(Rack, { title: 'Rack' })
 */
export function renderIcon(character: Character, options: IconOptions = {}): string {
  const ctx = createContext(character, `mwpet-icon${++iconCount}`)
  const pose = { ...BASE_POSE, ...options.pose }
  const a11y = options.title ? `role="img" aria-label="${options.title.replace(/"/g, '&quot;')}"` : 'aria-hidden="true"'
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${options.viewBox ?? character.iconViewBox}" width="100%" height="100%" ${a11y}>${renderFrame(pose, 0, ctx)}</svg>`
}

export { createContext }
export type { RenderContext }
