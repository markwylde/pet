import { defineCharacter } from './define.js'

/** Pixel: a cheerful beige CRT terminal with a green phosphor face. */
export const Pixel = defineCharacter({
  id: 'pixel',
  name: 'Pixel',
  kind: 'desktop terminal',
  face: 'crt',
  palette: { phosphor: '#62ffb0', phosphorDim: '#2f9e6a', screenInner: '#14432d', screenOuter: '#06180f' },
  iconViewBox: '-72 -168 144 172',
  body: ({ h, id, url }) =>
    [
      h(
        'defs',
        null,
        h(
          'linearGradient',
          { id: id('pixel-body'), x1: 0, y1: 0, x2: 0, y2: 1 },
          h('stop', { offset: 0, stopColor: '#f3ead6' }),
          h('stop', { offset: 1, stopColor: '#d9cbad' }),
        ),
      ),
      // stand
      h('rect', { x: -14, y: -40, width: 28, height: 12, fill: '#cbbb9c', stroke: '#8a7a5c', strokeWidth: 2 }),
      h('rect', { x: -34, y: -31, width: 68, height: 11, rx: 5, fill: url('pixel-body'), stroke: '#8a7a5c', strokeWidth: 2.5 }),
      // monitor
      h('rect', { x: -58, y: -142, width: 116, height: 106, rx: 22, fill: url('pixel-body'), stroke: '#8a7a5c', strokeWidth: 2.5 }),
      h('rect', { x: -58, y: -142, width: 116, height: 106, rx: 22, fill: url('body-side') }),
      h('rect', { x: -47, y: -129, width: 94, height: 76, rx: 14, fill: '#b8a888', stroke: '#8a7a5c', strokeWidth: 1.5 }),
      // vents + power LED
      [0, 1, 2, 3].map((i) => h('line', { x1: -40 + i * 7, y1: -45, x2: -37 + i * 7, y2: -41, stroke: '#a8977a', strokeWidth: 2, strokeLinecap: 'round' })),
      h('circle', { cx: 40, cy: -44, r: 2.6, fill: '#62ffb0', filter: url('glow') }),
    ]
      .flat()
      .join(''),
})
