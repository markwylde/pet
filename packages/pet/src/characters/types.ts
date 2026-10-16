import type { Pose } from '../pose.js'
import type { h } from '../svg.js'

/** A point in the character's drawing space (feet at 0,0, up is negative y). */
export interface Anchor {
  x: number
  y: number
}

/** What a character's {@link Character.body} function receives each frame. */
export interface BodyContext {
  /** The current pose: lets the body react, e.g. blinking LEDs while busy. */
  pose: Pose
  /** Seconds since the pet was created. */
  time: number
  /** Namespace an SVG id (`<linearGradient id={id('body')}>`) so several pets can share a page. */
  id: (name: string) => string
  /** `url(#…)` reference to an id made with {@link BodyContext.id}. */
  url: (name: string) => string
  /** The markup helper the library uses: `h('rect', { x: 0, strokeWidth: 2 })`. */
  h: typeof h
}

/**
 * A character: everything that makes a pet look like itself. They all share one skeleton
 * (a screen face, arms, legs, an antenna and the effects), so a character only describes
 * colours, where limbs attach, and how to draw the body behind the screen.
 *
 * Drawing space: the feet sit at (0, 0) and the body grows upward. The screen is the
 * rectangle x −42…42, y −124…−58, so draw a bezel around roughly x −47…47, y −129…−53.
 *
 * Create one with {@link defineCharacter}.
 */
export interface Character {
  /** Unique id (letters, digits, dashes). */
  id: string
  /** Display name, e.g. "Pixel". Used in the chat header and accessibility labels. */
  name: string
  /** Short description used in copy, e.g. "desktop terminal". */
  kind: string
  /** `crt`: smooth glowing strokes. `matrix`: an LED dot-matrix face. */
  face: 'crt' | 'matrix'
  /**
   * `true` (default): the library draws the shared robot skeleton (screen face, arms, legs,
   * antenna and props) around your body. `false`: `body` draws the whole figure from the
   * pose; only the body motion, shadow, speed lines and the effects above the head are added.
   * `face`, `palette`, `limbs` and `anchors` are ignored then.
   */
  skeleton: boolean
  palette: {
    /** Colour of the face. */
    phosphor: string
    /** Dimmer face colour for secondary details. */
    phosphorDim: string
    /** Screen background, centre. */
    screenInner: string
    /** Screen background, edges. */
    screenOuter: string
  }
  limbs: {
    line: string
    hand: string
    handStroke: string
    joint: string
    foot: string
    footStroke: string
  }
  anchors: {
    /** Right shoulder; the left one is mirrored. */
    shoulder: Anchor
    /** Base of the antenna. */
    antenna: Anchor
    /** Where a nervous sweat drop appears. */
    sweat: Anchor
  }
  /** Shift effects drawn above the head (hearts, rain cloud, gears) for taller bodies. */
  effectsOffsetY: number
  /** viewBox that frames the character snugly, used by {@link renderIcon}. */
  iconViewBox: string
  /** Draws the body behind the screen (or, with `skeleton: false`, the whole figure). Return SVG markup. */
  body: (ctx: BodyContext) => string
}

type Simple = 'kind' | 'face' | 'skeleton' | 'effectsOffsetY' | 'iconViewBox'

/**
 * What you pass to {@link defineCharacter}: a {@link Character} where everything with a
 * sensible default is optional, and `limbs` / `anchors` can be given in part.
 */
export type CharacterInput = Omit<Character, Simple | 'limbs' | 'anchors'> &
  Partial<Pick<Character, Simple>> & {
    limbs?: Partial<Character['limbs']>
    anchors?: Partial<Character['anchors']>
  }
