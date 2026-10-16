import type { Character } from '../characters/types.js'

/** Shared geometry. Local coordinates: feet at (0, 0), the body grows upward (negative y). */
export const SCREEN = { x: -42, y: -124, w: 84, h: 66 }
export const EYE_Y = -100
export const EYE_DX = 17
export const MOUTH_Y = -75

export const TEAR = '#8fdcff'
export const PINK = '#ff6f9b'

/** Everything a render function needs besides the pose. */
export interface RenderContext {
  character: Character
  /** Namespaces an SVG id so several pets can live on one page. */
  id: (name: string) => string
  /** `url(#…)` for a namespaced id. */
  url: (name: string) => string
}

export function createContext(character: Character, uid: string): RenderContext {
  const id = (name: string) => `${uid}-${name}`
  return { character, id, url: (name) => `url(#${id(name)})` }
}
