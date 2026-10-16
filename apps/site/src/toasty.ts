import { defineCharacter } from '@markwylde/pet'

/**
 * A custom character made right here on the page with defineCharacter(): a chrome toaster
 * whose toast pops up when he's happy.
 */
export const Toasty = defineCharacter({
  id: 'toasty',
  name: 'Toasty',
  kind: 'kitchen helper',
  face: 'crt',
  palette: { phosphor: '#ffb86b', phosphorDim: '#b36a2c', screenInner: '#3a1d0b', screenOuter: '#140801' },
  anchors: { shoulder: { x: 62, y: -88 }, antenna: { x: 44, y: -152 }, sweat: { x: 54, y: -146 } },
  limbs: { line: '#4b5160', hand: '#ffffff', handStroke: '#6b7280', joint: '#9aa1ad', foot: '#ff7a6b', footStroke: '#a8443a' },
  effectsOffsetY: -14,
  iconViewBox: '-80 -186 160 190',
  body: ({ h, id, url, pose, time }) => {
    const excited = pose.sparkles > 0 || pose.hearts > 0 || pose.eye === 'happy'
    const pop = (excited ? 20 : 4) + Math.sin(time * 9) * (excited ? 2 : 0)
    const slice = (x: number) =>
      h('rect', { x, y: -150 - pop, width: 24, height: 30, rx: 7, fill: '#f0c27b', stroke: '#9a6a2c', strokeWidth: 2 })
    return [
      h(
        'defs',
        null,
        h(
          'linearGradient',
          { id: id('chrome'), x1: 0, y1: 0, x2: 1, y2: 1 },
          h('stop', { offset: 0, stopColor: '#f7f8fa' }),
          h('stop', { offset: 0.55, stopColor: '#cfd4dc' }),
          h('stop', { offset: 1, stopColor: '#a9b0bb' }),
        ),
      ),
      slice(-33),
      slice(9),
      h('rect', { x: -62, y: -152, width: 124, height: 122, rx: 28, fill: url('chrome'), stroke: '#6b7280', strokeWidth: 2.5 }),
      h('rect', { x: -35, y: -156, width: 28, height: 7, rx: 3.5, fill: '#2b2f36' }),
      h('rect', { x: 7, y: -156, width: 28, height: 7, rx: 3.5, fill: '#2b2f36' }),
      h('rect', { x: -47, y: -129, width: 94, height: 76, rx: 13, fill: '#3b3f47', stroke: '#2b2f36', strokeWidth: 1.5 }),
      h('rect', { x: 62, y: -122, width: 7, height: 36, rx: 3, fill: '#9aa1ad' }),
      h('rect', { x: 64, y: excited ? -96 : -116, width: 13, height: 9, rx: 3, fill: '#ff7a6b', stroke: '#a8443a', strokeWidth: 1.5 }),
      h('circle', { cx: -38, cy: -42, r: 6, fill: '#fff', stroke: '#6b7280', strokeWidth: 1.5 }),
      h('line', { x1: -38, y1: -42, x2: -35, y2: -46, stroke: '#ff7a6b', strokeWidth: 1.6, strokeLinecap: 'round' }),
      h('text', { x: -24, y: -39, fontSize: 7, fontFamily: 'ui-rounded, sans-serif', fontWeight: 700, fill: '#6b7280' }, 'TOAST'),
      h('circle', { cx: 42, cy: -42, r: 3, fill: '#ffb86b', filter: url('glow') }),
    ].join('')
  },
})
