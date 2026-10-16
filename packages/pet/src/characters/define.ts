import type { Character, CharacterInput } from './types.js'

const DEFAULT_LIMBS: Character['limbs'] = {
  line: '#5d5140',
  hand: '#f7f1e3',
  handStroke: '#8a7a5c',
  joint: '#cbbb9c',
  foot: '#e55d4f',
  footStroke: '#8a3a30',
}

const DEFAULT_ANCHORS: Character['anchors'] = {
  shoulder: { x: 57, y: -82 },
  antenna: { x: 14, y: -141 },
  sweat: { x: 52, y: -128 },
}

/**
 * Create a character. Only `id`, `name`, `palette` and `body` are required; everything
 * else falls back to Pixel's proportions.
 *
 * @example
 * const Toaster = defineCharacter({
 *   id: 'toaster',
 *   name: 'Toasty',
 *   palette: { phosphor: '#ffb86b', phosphorDim: '#a8662a', screenInner: '#3a1d0b', screenOuter: '#160902' },
 *   body: ({ h }) => h('rect', { x: -58, y: -142, width: 116, height: 106, rx: 30, fill: '#d9d9d9' }),
 * })
 */
export function defineCharacter(input: CharacterInput): Character {
  if (!/^[a-z0-9-]+$/i.test(input.id)) throw new Error(`Character id "${input.id}" must only contain letters, digits and dashes.`)
  return {
    kind: 'desktop pet',
    face: 'crt',
    antenna: true,
    rocket: true,
    effectsOffsetY: 0,
    iconViewBox: '-72 -168 144 172',
    ...input,
    limbs: { ...DEFAULT_LIMBS, ...input.limbs },
    anchors: { ...DEFAULT_ANCHORS, ...input.anchors },
  }
}
