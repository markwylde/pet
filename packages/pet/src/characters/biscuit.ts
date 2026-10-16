import type { Pose } from '../pose.js'
import { path } from '../svg.js'
import { defineCharacter } from './define.js'

const FUR = '#d9a066'
const FUR_DARK = '#b97f48'
const CREAM = '#f6e3c4'
const BROWN = '#8a5a33'
const INK = '#2b1d14'
const OUTLINE = '#7a4e2c'
const PAD = '#e8899a'

export type Mood = 'happy' | 'busy' | 'sad' | 'neutral'

/** How Biscuit feels in this pose, which sets how the tail wags. */
export function mood(p: Pose): Mood {
  if (p.tears > 0 || p.cloud > 0) return 'sad'
  if (p.hearts > 0 || p.sparkles > 0 || p.eye === 'happy' || p.eye === 'heart') return 'happy'
  if (p.code > 0 || p.spinner > 0 || p.progress >= 0 || p.gears > 0) return 'busy'
  return 'neutral'
}

const WAG: Record<Mood, { freq: number; amp: number; base: number }> = {
  neutral: { freq: 1.2, amp: 12, base: 0 },
  busy: { freq: 3, amp: 18, base: 0 },
  happy: { freq: 5, amp: 25, base: 0 },
  sad: { freq: 0.4, amp: 4, base: 35 },
}

/** Tail rotation in degrees (positive swings it down and back). */
export function tailAngle(p: Pose, time: number): number {
  const { freq, amp, base } = WAG[mood(p)]
  return base + amp * Math.sin(time * Math.PI * 2 * freq)
}

/** How far each ear swings outward, in degrees. In flight the ears go up and flap like wings. */
export function earAngle(p: Pose, time: number): number {
  const rest = 10 + p.antenna * 0.8
  if (p.propeller <= 0) return rest
  const flap = 75 + 25 * Math.sin(time * Math.PI * 2 * (2 + 2 * p.propeller))
  const k = Math.min(1, p.propeller)
  return rest + (flap - rest) * k
}

/** Biscuit: a cartoon pup with an ink-drawn face, floppy ears that double as wings, and a busy tail. */
export const Biscuit = defineCharacter({
  id: 'biscuit',
  name: 'Biscuit',
  kind: 'cartoon dog',
  face: 'toon',
  antenna: false,
  rocket: false,
  palette: { phosphor: INK, phosphorDim: '#8a7560', screenInner: '#ffffff', screenOuter: '#c9b9a6' },
  limbs: { line: OUTLINE, hand: CREAM, handStroke: OUTLINE, joint: FUR, foot: CREAM, footStroke: OUTLINE },
  anchors: { shoulder: { x: 30, y: -60 }, antenna: { x: 0, y: -146 }, sweat: { x: 40, y: -128 } },
  effectsOffsetY: -14,
  iconViewBox: '-72 -160 144 168',
  body: ({ h, id, url, pose: p, time }) => {
    const ear = earAngle(p, time)
    const earShape = (side: -1 | 1) =>
      h(
        'g',
        { class: 'mwpet-ear', transform: path`translate(${side * 42} ${-134}) rotate(${-side * ear})` },
        h('path', { d: 'M -11 0 C -16 20 -13 44 0 50 C 13 44 16 20 11 0 Q 0 -6 -11 0 Z', fill: BROWN, stroke: OUTLINE, strokeWidth: 2 }),
        h('path', { d: 'M -5 8 C -8 22 -6 36 0 41', stroke: '#6e4426', strokeWidth: 2, fill: 'none', strokeLinecap: 'round', opacity: 0.6 }),
      )
    return [
      h(
        'defs',
        null,
        h(
          'linearGradient',
          { id: id('biscuit-fur'), x1: 0, y1: 0, x2: 0, y2: 1 },
          h('stop', { offset: 0, stopColor: '#e6b47e' }),
          h('stop', { offset: 1, stopColor: FUR }),
        ),
      ),
      // tail, behind everything else
      h(
        'g',
        { class: 'mwpet-tail', transform: path`translate(24 -40) rotate(${tailAngle(p, time)})` },
        h('path', { d: 'M 0 0 Q 20 -6 24 -32', stroke: OUTLINE, strokeWidth: 12, fill: 'none', strokeLinecap: 'round' }),
        h('path', { d: 'M 0 0 Q 20 -6 24 -32', stroke: FUR, strokeWidth: 8, fill: 'none', strokeLinecap: 'round' }),
        h('circle', { cx: 24, cy: -33, r: 5, fill: BROWN }),
      ),
      // broad-shouldered body whose top tucks under the head, and belly
      h('path', {
        class: 'mwpet-torso',
        d: 'M 0 -74 C 24 -74 40 -72 40 -60 C 40 -50 34 -44 34 -36 C 34 -21.6 18.8 -10 0 -10 C -18.8 -10 -34 -21.6 -34 -36 C -34 -44 -40 -50 -40 -60 C -40 -72 -24 -74 0 -74 Z',
        fill: url('biscuit-fur'),
        stroke: OUTLINE,
        strokeWidth: 2.5,
      }),
      h('ellipse', { cx: 0, cy: -31, rx: 19, ry: 16, fill: CREAM }),
      // head with cheek fluff
      h('path', {
        class: 'mwpet-head',
        d: 'M -50 -92 L -56 -84 L -48 -82 L -52 -74 L -44 -72 C -36 -56 36 -56 44 -72 L 52 -74 L 48 -82 L 56 -84 L 50 -92 C 50 -128 30 -146 0 -146 C -30 -146 -50 -128 -50 -92 Z',
        fill: url('biscuit-fur'),
        stroke: OUTLINE,
        strokeWidth: 2.5,
        strokeLinejoin: 'round',
      }),
      h('path', { d: 'M -10 -144 Q -4 -152 0 -145 Q 5 -153 10 -144', fill: FUR, stroke: OUTLINE, strokeWidth: 2, strokeLinejoin: 'round' }),
      // muzzle and nose (the toon face inks the mouth just below it)
      h('ellipse', { cx: 0, cy: -76, rx: 27, ry: 17, fill: CREAM }),
      h('path', { d: 'M -8 -89 Q 0 -92 8 -89 Q 9 -84 0 -80 Q -9 -84 -8 -89 Z', fill: INK }),
      h('ellipse', { cx: -2.5, cy: -88, rx: 2.6, ry: 1.3, fill: '#ffffff', opacity: 0.7 }),
      // eyebrow spots
      h('ellipse', { cx: -18, cy: -117, rx: 5, ry: 2.6, fill: FUR_DARK, opacity: 0.7 }),
      h('ellipse', { cx: 18, cy: -117, rx: 5, ry: 2.6, fill: FUR_DARK, opacity: 0.7 }),
      earShape(-1),
      earShape(1),
    ]
      .flat()
      .join('')
  },
  // chunky forelegs ending in round paws
  arm: ({ h, side, angle, shoulder }) =>
    h(
      'g',
      { class: 'mwpet-paw', transform: path`translate(${shoulder.x} ${shoulder.y}) rotate(${side === 'L' ? angle : -angle})` },
      h('path', { d: 'M -7 -2 Q -9 14 -6 24 L 6 24 Q 9 14 7 -2 Z', fill: FUR, stroke: OUTLINE, strokeWidth: 2, strokeLinejoin: 'round' }),
      h('ellipse', { cx: 0, cy: 27, rx: 8.5, ry: 6.5, fill: CREAM, stroke: OUTLINE, strokeWidth: 2 }),
      h('path', { d: 'M -3 30 L -3 33 M 0 30.5 L 0 33.5 M 3 30 L 3 33', stroke: OUTLINE, strokeWidth: 1.2, strokeLinecap: 'round' }),
    ),
  // stubby hind legs with big paws; the pad shows when a foot lifts
  legs: ({ h, left, right }) => {
    const leg = (x: number, lift: number) =>
      h(
        'g',
        { class: 'mwpet-hindleg' },
        h('ellipse', { cx: x * 1.1, cy: -16 - lift / 2, rx: 13, ry: 12, fill: FUR, stroke: OUTLINE, strokeWidth: 2 }),
        h('ellipse', { cx: x + Math.sign(x) * 4, cy: -5 - lift, rx: 14, ry: 7, fill: CREAM, stroke: OUTLINE, strokeWidth: 2 }),
        lift > 2 && h('ellipse', { cx: x + Math.sign(x) * 4, cy: -2 - lift, rx: 6, ry: 2.5, fill: PAD }),
      )
    return leg(-20, left) + leg(20, right)
  },
})
