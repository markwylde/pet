/**
 * @markwylde/pet: little animated pets for web apps, desktop apps and websites.
 *
 * @example
 * import Pet, { Pixel } from '@markwylde/pet'
 *
 * const pet = Pet({ character: Pixel })
 * await pet.play('happy')
 *
 * @packageDocumentation
 */
import { createPet } from './pet.js'

export { createPet }
/** Alias of {@link createPet}, so `Pet({ … })` reads naturally. */
export const Pet = createPet
export default createPet

export { Biscuit, Pixel, Rack, Whiskers, characters, defineCharacter } from './characters/index.js'
export type { Anchor, BodyContext, Character, CharacterInput, LimbContext } from './characters/index.js'

export { ANIMATIONS, ANIMATION_GROUPS, motion } from './animations.js'
export type { Animation, AnimationName, BuiltInAnimation, Category, MotionContext } from './animations.js'
export { BASE_POSE } from './pose.js'
export type { EyeShape, Pose } from './pose.js'

export { STAGE_VIEWBOX, renderIcon } from './render/index.js'
export type { IconOptions } from './render/index.js'
export { css, injectStyles } from './styles.js'

export type {
  Assistant,
  AssistantChunk,
  AssistantContext,
  ChatMessage,
  ChatOptions,
  DockTarget,
  HideOptions,
  Insets,
  MoveOptions,
  PetChat,
  PetClickEvent,
  PetEvents,
  PetInstance,
  PetOptions,
  PetState,
  PlayOptions,
  Point,
  Position,
  SayOptions,
  Size,
  Theme,
  UpdatableOptions,
} from './types.js'
