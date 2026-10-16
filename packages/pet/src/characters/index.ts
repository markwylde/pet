export { defineCharacter } from './define.js'
export { Pixel } from './pixel.js'
export { Rack } from './rack.js'
export { Whiskers } from './whiskers.js'
export type { Anchor, BodyContext, Character, CharacterInput } from './types.js'

import { Pixel } from './pixel.js'
import { Rack } from './rack.js'
import { Whiskers } from './whiskers.js'

/** The characters that ship with the library. */
export const characters = { Pixel, Rack, Whiskers }
