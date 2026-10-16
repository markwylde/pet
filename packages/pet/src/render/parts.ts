import { h, path } from '../svg.js'
import { EYE_DX, EYE_Y, MOUTH_Y, PINK, TEAR, type RenderContext } from './context.js'

// ---------- limbs ----------

export function legs(l: number, r: number, ctx: RenderContext): string {
  const { limbs } = ctx.character
  const leg = (x: number, lift: number) =>
    h(
      'g',
      null,
      h('path', { d: path`M ${x * 0.7} -22 Q ${x * 0.95} ${-12 - lift / 2} ${x} ${-6 - lift}`, stroke: limbs.line, strokeWidth: 4, fill: 'none', strokeLinecap: 'round' }),
      h('ellipse', { cx: x + Math.sign(x) * 3, cy: -4 - lift, rx: 12, ry: 5.5, fill: limbs.foot, stroke: limbs.footStroke, strokeWidth: 2 }),
    )
  return leg(-18, l) + leg(18, r)
}

export function arm(side: 'L' | 'R', angle: number, ctx: RenderContext): string {
  const { limbs, anchors } = ctx.character
  const sx = side === 'L' ? -anchors.shoulder.x : anchors.shoulder.x
  return h(
    'g',
    { transform: path`translate(${sx} ${anchors.shoulder.y}) rotate(${side === 'L' ? angle : -angle})` },
    h('path', { d: 'M 0 0 Q 4 16 0 30', stroke: limbs.line, strokeWidth: 4, fill: 'none', strokeLinecap: 'round' }),
    h('circle', { cx: 0, cy: 0, r: 4, fill: limbs.joint, stroke: limbs.handStroke, strokeWidth: 1.5 }),
    h('circle', { cx: 0, cy: 33, r: 7, fill: limbs.hand, stroke: limbs.handStroke, strokeWidth: 2 }),
  )
}

export function antenna(sway: number, propeller: number, t: number, ctx: RenderContext): string {
  const { anchors, limbs } = ctx.character
  return h(
    'g',
    { transform: path`translate(${anchors.antenna.x} ${anchors.antenna.y}) rotate(${sway})` },
    h('path', { d: 'M 0 0 Q 2 -12 6 -24', stroke: limbs.line, strokeWidth: 3, fill: 'none', strokeLinecap: 'round' }),
    propeller > 0 ? propellerHat(t, propeller) : h('circle', { cx: 6, cy: -27, r: 5, fill: PINK, stroke: '#a33b5b', strokeWidth: 1.5 }),
  )
}

function propellerHat(t: number, speed: number): string {
  const spin = Math.cos(t * Math.PI * 2 * 3 * speed)
  const blur = speed > 2
  return h(
    'g',
    { transform: 'translate(6 -27)' },
    blur && h('ellipse', { cx: 0, cy: -2, rx: 24, ry: 3.5, fill: 'rgba(255,255,255,0.45)', stroke: 'rgba(100,90,70,0.3)' }),
    h(
      'g',
      { transform: path`scale(${spin} 1)`, opacity: blur ? 0.5 : 1 },
      h('path', { d: 'M 0 -2 C 8 -7 20 -6 22 -2 C 20 2 8 2 0 -2 Z', fill: '#4fb3ff', stroke: '#24689a', strokeWidth: 1.2 }),
      h('path', { d: 'M 0 -2 C -8 -7 -20 -6 -22 -2 C -20 2 -8 2 0 -2 Z', fill: '#ffd34f', stroke: '#a3841f', strokeWidth: 1.2 }),
    ),
    h('circle', { cx: 0, cy: -2, r: 3.5, fill: PINK, stroke: '#a33b5b', strokeWidth: 1.2 }),
  )
}

// ---------- screen overlays ----------

export function progressBar(k: number, ctx: RenderContext): string {
  const { phosphor, phosphorDim } = ctx.character.palette
  return h(
    'g',
    null,
    h('rect', { x: -28, y: -80, width: 56, height: 10, rx: 3, fill: 'none', stroke: phosphor, strokeWidth: 2 }),
    h('rect', { x: -25.5, y: -77.5, width: 51 * k, height: 5, rx: 1.5, fill: phosphor }),
    h('text', { x: 0, y: -62, textAnchor: 'middle', fontSize: 7, fontFamily: 'monospace', fill: phosphorDim }, `${Math.round(k * 100)}%`),
  )
}

const CODE_LINES = [
  [0, 22], [4, 30], [4, 14], [8, 26], [8, 18], [4, 8], [0, 4], [0, 28], [4, 20], [8, 32], [4, 12], [0, 6],
]

export function code(t: number, ctx: RenderContext): string {
  const { phosphor, phosphorDim } = ctx.character.palette
  const lineH = 6
  const offset = (t * 22) % lineH
  const first = Math.floor((t * 22) / lineH)
  const rows: string[] = []
  for (let i = 0; i < 6; i++) {
    const [indent, len] = CODE_LINES[(first + i) % CODE_LINES.length]
    rows.push(h('rect', { x: -34 + indent, y: -86 + i * lineH - offset, width: len, height: 2.6, rx: 1.3, fill: i % 3 === 1 ? phosphor : phosphorDim }))
  }
  return h(
    'g',
    null,
    h('clipPath', { id: ctx.id('code') }, h('rect', { x: -40, y: -88, width: 80, height: 28 })),
    h('g', { clipPath: ctx.url('code') }, rows),
    Math.floor(t * 4) % 2 === 0 && h('rect', { x: 0, y: -64, width: 5, height: 3, fill: phosphor }),
  )
}

export function spinner(t: number, ctx: RenderContext): string {
  const dots = 8
  const head = Math.floor(t * 12) % dots
  return h(
    'g',
    { transform: path`translate(0 ${MOUTH_Y + 2})` },
    Array.from({ length: dots }, (_, i) => {
      const a = (i / dots) * Math.PI * 2
      const age = (head - i + dots) % dots
      return h('circle', { cx: Math.cos(a) * 9, cy: Math.sin(a) * 9, r: 2.2, fill: ctx.character.palette.phosphor, opacity: 1 - age / dots })
    }),
  )
}

export function tears(k: number, t: number, lx: number, outline?: string): string {
  const drops: string[] = []
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const ph = (t * 1.6 + i / 3 + (side > 0 ? 0.15 : 0)) % 1
      const x = side * (EYE_DX + 4) + lx + side * ph * 6
      const y = EYE_Y + 8 + ph * 40
      drops.push(h('path', { transform: path`translate(${x} ${y}) scale(${0.9 + ph * 0.3})`, d: 'M 0 -4 Q 3 0 0 3 Q -3 0 0 -4 Z', fill: TEAR, stroke: outline, strokeWidth: outline && 0.8, opacity: k * (1 - ph * 0.6) }))
    }
  }
  return drops.join('')
}

/** Where screen overlays sit: (0, MOUTH_Y + 2) is the middle of the progress bar, code and spinner. */
const OVERLAY_CENTRE_Y = MOUTH_Y + 2

/** Highest the bubble's centre may go (stage coordinates), so its top stays inside the stage. */
const BUBBLE_MAX_Y = -215

/**
 * A cartoon thought bubble above the head. Toon characters have no screen, so progress,
 * code and spinner overlays are drawn in here instead. Lives in the effects layer.
 */
export function thoughtBubble(content: string, offsetY: number, ctx: RenderContext): string {
  const bx = -30
  // offsetY is the effects layer's shift; clamp in stage coordinates
  const by = Math.max(BUBBLE_MAX_Y - offsetY, -178)
  const { screenInner, screenOuter } = ctx.character.palette
  const puffs: [number, number, number][] = [
    [-30, 4, 16], [-12, -8, 20], [12, -8, 20], [30, 4, 16], [0, 8, 20], [-18, 12, 14], [18, 12, 14],
    [22, 34, 5], [32, 45, 3.5],
  ]
  const circles = (grow: number, fill: string) =>
    h('g', { fill }, puffs.map(([x, y, r]) => h('circle', { cx: bx + x, cy: by + y, r: r + grow })))
  return h(
    'g',
    { class: 'mwpet-thought' },
    circles(2, screenOuter),
    circles(0, screenInner),
    h('g', { transform: path`translate(${bx} ${by}) scale(0.85) translate(0 ${-OVERLAY_CENTRE_Y})` }, content),
  )
}

// ---------- props & effects ----------

export function keyboard(k: number, t: number): string {
  const keys: string[] = []
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 9; col++) {
      const pressed = Math.floor(t * 14 + col * 3 + row * 5) % 11 === 0
      keys.push(h('rect', { x: -43 + col * 9.6, y: -46 + row * 6 + (pressed ? 1 : 0), width: 7.5, height: 4.5, rx: 1, fill: pressed ? '#cfc2a6' : '#f4eddc' }))
    }
  }
  return h(
    'g',
    { opacity: k, transform: path`translate(0 ${(1 - k) * 25})` },
    h('path', { d: 'M -50 -48 L 50 -48 L 54 -32 L -54 -32 Z', fill: '#a8977a', stroke: '#6f6148', strokeWidth: 2, strokeLinejoin: 'round' }),
    keys,
  )
}

export function sweat(k: number, t: number, ctx: RenderContext): string {
  const at = ctx.character.anchors.sweat
  const slide = (t * 0.8) % 1
  return h('path', {
    transform: path`translate(${at.x} ${at.y + slide * 14}) scale(1.3)`,
    d: 'M 0 -6 Q 5 1 0 4 Q -5 1 0 -6 Z',
    fill: TEAR,
    stroke: '#3c8fbf',
    strokeWidth: 1,
    opacity: k * (1 - slide * 0.5),
  })
}

export function flame(t: number, k: number, ctx: RenderContext): string {
  const len = 34 * k * (1 + Math.sin(t * 60) * 0.15)
  return [-16, 16].map((x) => h('path', { d: path`M ${x - 8} -2 Q ${x} ${len * 1.1} ${x + 8} -2 Z`, fill: ctx.url('flame'), opacity: 0.95 })).join('')
}

export function speedLines(t: number, angle: number, k: number, transform: string): string {
  return h(
    'g',
    { transform: `${transform} translate(0 -80) rotate(${Math.round(angle + 180)})`, opacity: k },
    [-50, -25, 0, 25, 50].map((off, i) => {
      const ph = (t * 3 + i * 0.37) % 1
      const start = 60 + ph * 50
      return h('line', { x1: start, y1: off, x2: start + 30 + i * 6, y2: off, stroke: 'rgba(120,140,170,0.6)', strokeWidth: 3, strokeLinecap: 'round', opacity: 1 - ph })
    }),
  )
}

const HEART = 'M 0 7 C -10 0 -9 -8 -4 -8 C -1.5 -8 0 -6 0 -4 C 0 -6 1.5 -8 4 -8 C 9 -8 10 0 0 7 Z'

export function hearts(t: number): string {
  return [0, 1, 2, 3, 4]
    .map((i) => {
      const ph = (t * 0.45 + i / 5) % 1
      const x = Math.sin((ph + i) * 6) * 18 + (i - 2) * 16
      return h('path', {
        transform: path`translate(${x} ${-150 - ph * 90}) scale(${0.6 + ph * 0.8})`,
        d: HEART,
        fill: PINK,
        stroke: '#c23d66',
        strokeWidth: 1,
        opacity: Math.min(1, ph * 6) * (1 - ph),
      })
    })
    .join('')
}

export function zzz(t: number): string {
  return h(
    'g',
    { fontFamily: "'Comic Sans MS', 'Chalkboard SE', sans-serif", fontWeight: 700, fill: '#6b7fa8' },
    [0, 1, 2].map((i) => {
      const ph = (t * 0.5 + i / 3) % 1
      return h('text', { x: 30 + ph * 40, y: -150 - ph * 60, fontSize: 12 + ph * 14, opacity: Math.min(1, ph * 5) * (1 - ph) }, 'Z')
    }),
  )
}

export function sparkles(t: number): string {
  const star = 'M 0 -8 Q 1.5 -1.5 8 0 Q 1.5 1.5 0 8 Q -1.5 1.5 -8 0 Q -1.5 -1.5 0 -8 Z'
  return [0, 1, 2, 3, 4, 5, 6]
    .map((i) => {
      const a = (i / 7) * Math.PI * 2 + 0.3
      const tw = Math.max(0, Math.sin(t * 6 + i * 1.9))
      return h('path', {
        transform: path`translate(${Math.cos(a) * 85} ${-85 + Math.sin(a) * 75}) scale(${tw}) rotate(${t * 90})`,
        d: star,
        fill: '#ffd34f',
        stroke: '#c99a12',
        strokeWidth: 0.8,
      })
    })
    .join('')
}

export function rainCloud(k: number, t: number): string {
  const drops: string[] = []
  for (let i = 0; i < 9; i++) {
    const ph = (t * 1.8 + i * 0.37) % 1
    const x = -34 + i * 8.5
    drops.push(h('line', { x1: x, y1: -180 + ph * 50, x2: x - 1.5, y2: -172 + ph * 50, stroke: TEAR, strokeWidth: 2.2, strokeLinecap: 'round', opacity: 1 - ph * 0.7 }))
  }
  return h(
    'g',
    { opacity: k, transform: path`translate(0 ${(1 - k) * -20})` },
    drops,
    h('path', {
      d: 'M -42 -182 Q -50 -198 -32 -202 Q -28 -222 -6 -216 Q 8 -230 24 -214 Q 44 -214 42 -196 Q 52 -184 38 -180 Z',
      fill: '#8b95a6',
      stroke: '#5f6878',
      strokeWidth: 2,
    }),
  )
}

function gear(x: number, y: number, r: number, teeth: number, angle: number, color: string): string {
  let d = ''
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i / (teeth * 2)) * Math.PI * 2
    const rr = i % 2 === 0 ? r : r * 0.78
    const a2 = a + Math.PI / (teeth * 2)
    d += (i ? 'L' : 'M') + path` ${Math.cos(a) * rr} ${Math.sin(a) * rr} L ${Math.cos(a2) * rr} ${Math.sin(a2) * rr} `
  }
  return h(
    'g',
    { transform: path`translate(${x} ${y}) rotate(${angle})` },
    h('path', { d: d + 'Z', fill: color, stroke: '#555', strokeWidth: 1.5, strokeLinejoin: 'round' }),
    h('circle', { r: r * 0.3, fill: '#f5f0e6', stroke: '#555', strokeWidth: 1.5 }),
  )
}

export function gears(t: number): string {
  const k = Math.min(1, t * 3)
  return h(
    'g',
    { opacity: k, transform: path`translate(0 ${(1 - k) * 15})` },
    gear(-16, -186, 16, 8, t * 180, '#b9c3d1'),
    gear(11, -200, 11, 6, -t * 262 + 15, '#ffd34f'),
  )
}
