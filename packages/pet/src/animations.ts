import type { Pose } from './pose.js'

/** Names of the animations every character ships with. */
export type BuiltInAnimation =
  | 'idle1'
  | 'idle2'
  | 'idle3'
  | 'happy1'
  | 'happy2'
  | 'happy3'
  | 'sad1'
  | 'sad2'
  | 'sad3'
  | 'busy1'
  | 'busy2'
  | 'busy3'
  | 'flying-slow'
  | 'flying-fast'
  | 'talk'
  | 'hide'
  | 'show'

/**
 * Any animation name: a built-in one, or one you registered through the `animations` option.
 * (The `string & {}` keeps editor autocomplete for the built-ins.)
 */
export type AnimationName = BuiltInAnimation | (string & {})

/**
 * Animation groups. `pet.play('happy')` picks a random animation from a group.
 * `system` animations (hide/show) are used internally and never picked at random.
 */
export type Category = 'idle' | 'happy' | 'sad' | 'busy' | 'flying' | 'talk' | 'system'

/** Extra input for poses that react to movement (the flying animations lean into it). */
export interface MotionContext {
  /** Horizontal velocity in px/s. */
  vx: number
  /** Vertical velocity in px/s. */
  vy: number
}

/**
 * An animation is a pure function of time: given `t` seconds since it started, return the
 * parts of the {@link Pose} that differ from the resting pose. The renderer does the rest,
 * and blends smoothly between animations.
 *
 * @example
 * const wiggle: Animation = {
 *   name: 'wiggle',
 *   category: 'happy',
 *   duration: 1.2,
 *   pose: (t) => ({ rot: motion.wave(t, 3, 10), mouthOpen: 0.4 }),
 * }
 */
export interface Animation {
  name: AnimationName
  category: Category
  /** Seconds for one play-through. */
  duration: number
  /** Human-friendly label, e.g. for buttons. */
  label?: string
  /** Lines the pet may say (in a speech bubble) when this is played with `speech: true`. */
  speech?: string[]
  pose: (t: number, ctx: MotionContext) => Partial<Pose>
}

type AnimationDef = Animation

// ---------- helpers ----------

const TAU = Math.PI * 2
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const easeInOut = (k: number) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2)

/** 0 → 1 eased progress of t through [a, b]. */
const seg = (t: number, a: number, b: number) => easeInOut(clamp((t - a) / (b - a)))

/** Value that ramps in over [a, a+fade] and out over [b-fade, b]. */
const window_ = (t: number, a: number, b: number, fade = 0.25) => seg(t, a, a + fade) * (1 - seg(t, b - fade, b))

/** Eye openness with quick blinks at the given times. */
function blink(t: number, at: number[], len = 0.16): number {
  for (const b of at) {
    const d = Math.abs(t - b)
    if (d < len / 2) return clamp(d / (len / 2)) ** 0.7
  }
  return 1
}

const wave = (t: number, freq: number, amp = 1, phase = 0) => Math.sin(t * TAU * freq + phase) * amp

/** Small helpers for writing your own animations. All take `t` in seconds. */
export const motion = {
  /** Sine wave: `freq` in Hz, `amp` peak value. */
  wave,
  /** Eye openness (0…1) with quick blinks at the given times. */
  blink,
  /** Eased 0 → 1 progress of `t` through `[a, b]`. */
  seg,
  /** Ramps 0 → 1 over `[a, a + fade]`, holds, then back to 0 over `[b - fade, b]`. */
  window: window_,
  /** Clamp to `[a, b]` (default 0…1). */
  clamp,
  /** Ease-in-out curve for 0…1 input. */
  easeInOut,
}

// ---------- animations ----------

// The resting loop: deliberately quiet so it can run most of the time without pulling focus.
const idle1: AnimationDef = {
  name: 'idle1',
  label: 'Idle 1 · rest',
  category: 'idle',
  duration: 4,
  pose: (t) => ({
    y: wave(t, 0.25, 1),
    sy: 1 + wave(t, 0.25, 0.008),
    sx: 1 - wave(t, 0.25, 0.005),
    eyeOpen: blink(t, [2.6]),
    armL: 8 + wave(t, 0.25, 1.2),
    armR: 8 + wave(t, 0.25, 1.2, 0.6),
    antenna: wave(t, 0.25, 2.5),
  }),
}

const idle2: AnimationDef = {
  name: 'idle2',
  label: 'Idle 2 · look & wave',
  category: 'idle',
  duration: 5,
  pose: (t) => {
    const look = -5 * seg(t, 0.1, 0.5) + 10 * seg(t, 1.1, 1.5) - 5 * seg(t, 2, 2.3)
    const waving = window_(t, 2.4, 3.9, 0.35)
    return {
      y: wave(t, 0.25, 1),
      rot: look * 0.3,
      lookX: look,
      eyeOpen: blink(t, [0.8, 2.15, 4.7]),
      armR: 8 + waving * (115 + wave(t, 2, 14)),
      mouthCurve: 0.5 + waving * 0.5,
      mouthOpen: waving * 0.45,
      blush: waving * 0.6,
      antenna: -look * 1.2,
    }
  },
}

const idle3: AnimationDef = {
  name: 'idle3',
  label: 'Idle 3 · yawn & doze',
  category: 'idle',
  duration: 6.5,
  speech: ['*yaaawn*'],
  pose: (t) => {
    const yawn = window_(t, 0, 1.6, 0.5)
    const doze = window_(t, 1.8, 5, 0.3)
    const startle = window_(t, 5, 5.6, 0.1)
    const bob = doze * wave(t, 0.4, 2)
    return {
      y: bob + doze * 4 - startle * 12,
      sy: 1 + yawn * 0.07 - doze * 0.03 + startle * 0.05,
      sx: 1 - yawn * 0.03,
      rot: doze * (4 + wave(t, 0.4, 2)),
      eye: startle > 0.1 ? 'wide' : yawn > 0.3 || doze > 0.3 ? 'closed' : 'open',
      eyeOpen: blink(t, [5.9]),
      mouthCurve: 0.5 - yawn * 0.6 - doze * 0.4 - startle * 0.5,
      mouthOpen: yawn * 1 + doze * (0.15 + wave(t, 0.4, 0.05)) + startle * 0.5,
      mouthWidth: 1 - yawn * 0.3,
      armL: 8 + yawn * 150,
      armR: 8 + yawn * 150,
      zzz: doze > 0.05 ? t : 0,
      screen: 1 - doze * 0.35,
      antenna: doze * 20 - startle * 25,
      sweat: startle,
    }
  },
}

const happy1: AnimationDef = {
  name: 'happy1',
  label: 'Happy 1 · bounce',
  category: 'happy',
  duration: 2.4,
  speech: ['Yay!', 'Woohoo!'],
  pose: (t) => {
    const phase = (t / 0.8) % 1
    const air = Math.sin(Math.PI * phase)
    const ground = 1 - clamp(air * 3)
    return {
      y: -air * 30,
      sy: 1 - ground * 0.14 + air * 0.06,
      sx: 1 + ground * 0.12 - air * 0.04,
      eye: 'happy',
      mouthCurve: 1,
      mouthOpen: 0.65,
      blush: 0.7,
      armL: 120 + air * 30,
      armR: 120 + air * 30,
      legL: air * 6,
      legR: air * 6,
      antenna: -air * 18,
    }
  },
}

const happy2: AnimationDef = {
  name: 'happy2',
  label: 'Happy 2 · love',
  category: 'happy',
  duration: 3.6,
  speech: ['I ♥ you!', 'Aww, thanks!'],
  pose: (t) => ({
    x: wave(t, 0.6, 6),
    y: -Math.abs(wave(t, 1.2, 4)),
    rot: wave(t, 0.6, 7),
    eye: 'heart',
    eyeOpen: 1 + Math.abs(wave(t, 1.2, 0.15)),
    mouthCurve: 1,
    mouthOpen: 0.3,
    blush: 1,
    armL: 55 + wave(t, 1.2, 10),
    armR: 55 + wave(t, 1.2, 10, Math.PI),
    hearts: t + 0.01,
    antenna: wave(t, 0.6, -14),
  }),
}

const happy3: AnimationDef = {
  name: 'happy3',
  label: 'Happy 3 · flip',
  category: 'happy',
  duration: 3,
  speech: ['Ta-da!'],
  pose: (t) => {
    const crouch = window_(t, 0, 0.5, 0.25)
    const jumpK = clamp((t - 0.45) / 1.0)
    const inAir = t > 0.45 && t < 1.45
    const land = window_(t, 1.4, 1.8, 0.15)
    const tada = seg(t, 1.7, 2.0)
    return {
      y: crouch * 8 - (inAir ? Math.sin(Math.PI * jumpK) * 80 : 0) + land * 8,
      rot: inAir ? easeInOut(jumpK) * 360 : 0,
      sy: 1 - crouch * 0.18 - land * 0.16 + (inAir ? 0.05 : 0),
      sx: 1 + crouch * 0.12 + land * 0.12,
      eye: inAir || tada > 0 ? 'happy' : 'squint',
      mouthCurve: 1,
      mouthOpen: inAir ? 0.8 : 0.4 + tada * 0.3,
      blush: 0.5,
      armL: inAir ? 165 : 20 + tada * 145 + wave(t, 2, tada * 8),
      armR: inAir ? 165 : 20 + tada * 145 + wave(t, 2, tada * 8, 1),
      legL: inAir ? 8 : 0,
      legR: inAir ? 8 : 0,
      sparkles: t > 1.0 ? t : 0,
    }
  },
}

const sad1: AnimationDef = {
  name: 'sad1',
  label: 'Sad 1 · sigh',
  category: 'sad',
  duration: 4.2,
  speech: ['*sigh*', 'Oh well…'],
  pose: (t) => {
    const slump = window_(t, 0, 4.2, 0.6)
    const inhale = window_(t, 1.3, 2.1, 0.4)
    const exhale = window_(t, 2.1, 3.2, 0.3)
    return {
      y: slump * 7 - inhale * 4 + exhale * 2,
      sy: 1 - slump * 0.05 + inhale * 0.05 - exhale * 0.03,
      rot: -slump * 3,
      eyeOpen: (1 - slump * 0.45) * blink(t, [3.5]),
      lookY: slump * 3.5,
      lookX: -slump * 1.5,
      brow: slump,
      mouthCurve: 0.5 - slump * 1.2,
      mouthOpen: exhale * 0.35,
      mouthWidth: 1 - slump * 0.3,
      armL: 8 - slump * 6,
      armR: 8 - slump * 6,
      antenna: slump * 30,
      screen: 1 - slump * 0.2,
    }
  },
}

const sad2: AnimationDef = {
  name: 'sad2',
  label: 'Sad 2 · cry',
  category: 'sad',
  duration: 4,
  speech: ['Waaah!', '*sniff*'],
  pose: (t) => {
    const cry = window_(t, 0, 4, 0.35)
    const sob = Math.max(0, wave(t, 1.6)) ** 4
    return {
      x: cry * wave(t, 9, 1.4),
      y: cry * (3 - sob * 5),
      sy: 1 + sob * cry * 0.05,
      eye: cry > 0.2 ? 'closed' : 'open',
      brow: cry * 1.2,
      mouthCurve: 0.5 - cry * 1.5,
      mouthOpen: cry * (0.55 + wave(t, 6, 0.12)),
      mouthWidth: 1 + cry * 0.1,
      armL: 8 + cry * (75 + wave(t, 3, 8)),
      armR: 8 + cry * (75 + wave(t, 3, 8, 2)),
      tears: cry,
      antenna: cry * 35,
      blush: cry * 0.4,
    }
  },
}

const sad3: AnimationDef = {
  name: 'sad3',
  label: 'Sad 3 · rain cloud',
  category: 'sad',
  duration: 5,
  speech: ['Just my luck…'],
  pose: (t) => {
    const gloom = window_(t, 0, 5, 0.6)
    const lookUp = window_(t, 0.3, 2.2, 0.4)
    const flicker = Math.sin(t * 37) > 0.93 ? 1 : 0
    return {
      y: gloom * 6,
      sy: 1 - gloom * 0.05,
      eyeOpen: 1 - gloom * 0.4 + lookUp * 0.3,
      lookY: -lookUp * 5 + (1 - lookUp) * gloom * 3,
      brow: gloom,
      mouthCurve: 0.5 - gloom * 1.1,
      mouthWidth: 1 - gloom * 0.35,
      armL: 8 - gloom * 5,
      armR: 8 - gloom * 5,
      cloud: t > 0 ? gloom : 0,
      screen: 1 - gloom * 0.4 - flicker * 0.3,
      glitch: flicker * gloom,
      antenna: gloom * 25,
      sweat: 0,
    }
  },
}

const busy1: AnimationDef = {
  name: 'busy1',
  label: 'Busy 1 · loading',
  category: 'busy',
  duration: 4.5,
  speech: ['Hmm, let me think…', 'Loading…'],
  pose: (t) => {
    const k = t / 4.5
    // progress with a stall in the middle, like every real progress bar
    const p = k < 0.3 ? k * 1.6 : k < 0.6 ? 0.48 + (k - 0.3) * 0.15 : 0.525 + (k - 0.6) * 1.19
    const done = seg(t, 4.0, 4.3)
    return {
      y: wave(t, 0.5, 1.5),
      eyeOpen: blink(t, [1.6, 3.4]),
      eye: done > 0.5 ? 'happy' : 'open',
      lookX: 3 * (1 - done),
      lookY: -4 * (1 - done),
      progress: clamp(p),
      armR: 8 + window_(t, 0, 4.2, 0.4) * 105,
      legL: Math.max(0, wave(t, 2, 4)),
      sweat: window_(t, 1.2, 3.0, 0.3),
      antenna: wave(t, 1, 8),
    }
  },
}

const busy2: AnimationDef = {
  name: 'busy2',
  label: 'Busy 2 · typing',
  category: 'busy',
  duration: 4.5,
  speech: ['Compiling…', 'Almost done!'],
  pose: (t) => {
    const on = window_(t, 0, 4.5, 0.3)
    return {
      y: on * (2 + Math.abs(wave(t, 6, 1.2))),
      rot: on * 2,
      eye: 'squint',
      lookY: on * 2,
      code: t + 0.01,
      keyboard: on,
      armL: 8 - on * (36 + Math.max(0, wave(t, 6.5)) * 9),
      armR: 8 - on * (36 + Math.max(0, wave(t, 6.5, 1, 2.1)) * 9),
      sweat: window_(t, 2.4, 4.4, 0.3),
      antenna: wave(t, 3, 5),
    }
  },
}

const busy3: AnimationDef = {
  name: 'busy3',
  label: 'Busy 3 · processing',
  category: 'busy',
  duration: 4,
  speech: ['Processing…', 'Beep boop.'],
  pose: (t) => {
    const on = window_(t, 0, 4, 0.3)
    return {
      x: on * wave(t, 14, 0.8),
      y: on * wave(t, 10, 0.6),
      eye: on > 0.3 ? 'spiral' : 'open',
      spinner: t + 0.01,
      gears: t + 0.01,
      armL: 8 + on * (20 + wave(t, 2, 10)),
      armR: 8 + on * (20 + wave(t, 2, 10, Math.PI)),
      legL: Math.max(0, wave(t, 3, 4)),
      legR: Math.max(0, wave(t, 3, 4, Math.PI)),
      antenna: on * wave(t, 4, 12),
      glitch: on * (Math.sin(t * 23) > 0.96 ? 0.6 : 0),
    }
  },
}

const flyingSlow: AnimationDef = {
  name: 'flying-slow',
  label: 'Flying (slow)',
  category: 'flying',
  duration: 3,
  speech: ['Wheee~'],
  pose: (t, { vx, vy }) => ({
    y: wave(t, 0.8, 4),
    lookX: clamp(vx / 120, -4, 4),
    lookY: clamp(vy / 120, -3, 3) - 1,
    mouthCurve: 0.85,
    mouthOpen: 0.2,
    eyeOpen: blink(t % 3, [2.2]),
    armL: 70 + wave(t, 1.6, 18),
    armR: 70 + wave(t, 1.6, 18),
    legL: 2 + wave(t, 0.8, 3),
    legR: 2 + wave(t, 0.8, 3, 1.5),
    propeller: 1,
    antenna: 0,
  }),
}

const flyingFast: AnimationDef = {
  name: 'flying-fast',
  label: 'Flying (fast)',
  category: 'flying',
  duration: 3,
  speech: ['WHOOOSH!'],
  pose: (t, { vx, vy }) => {
    const speed = Math.hypot(vx, vy)
    return {
      x: wave(t, 11, 0.8),
      y: wave(t, 13, 0.8),
      sx: 1.05,
      sy: 0.95,
      eye: 'squint',
      lookX: clamp(vx / 200, -4, 4),
      mouthCurve: 0.9,
      mouthOpen: 0.85 + wave(t, 8, 0.1),
      mouthWidth: 0.9,
      blush: 0.5,
      armL: 150 + wave(t, 5, 15),
      armR: 150 + wave(t, 5, 15, 1),
      legL: 6 + wave(t, 6, 3),
      legR: 6 + wave(t, 6, 3, 2),
      propeller: 3,
      flame: 0.8 + wave(t, 15, 0.2),
      speedLines: 1,
      speedAngle: speed > 1 ? (Math.atan2(vy, vx) * 180) / Math.PI : 0,
      sweat: 0.6,
    }
  },
}

// Cheap deterministic noise per syllable, so the talking never looks like a metronome.
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/**
 * Lip flap: a stream of syllables, each with its own mouth shape —
 * wide "ah", round "oh", small "eh" — plus the odd closed "m" and a breath between phrases.
 */
const SYLLABLES_PER_SEC = 5
const talk: AnimationDef = {
  name: 'talk',
  label: 'Talk',
  category: 'talk',
  duration: 2.4,
  pose: (t) => {
    const s = t * SYLLABLES_PER_SEC
    const i = Math.floor(s)
    const frac = s - i
    const r = hash(i)
    const breath = t % 2.4 > 2.1
    const closed = breath || r < 0.15
    // open fast, close a little slower
    const env = closed ? 0 : Math.sin(Math.PI * Math.min(1, frac < 0.35 ? frac / 0.7 : 0.5 + (frac - 0.35) / 1.3))
    const shape = r < 0.45 ? { open: 1, width: 0.95 } : r < 0.75 ? { open: 0.85, width: 0.55 } : { open: 0.5, width: 0.9 }
    const gesture = window_(t, 0.3, 1.9, 0.4)
    return {
      y: wave(t, 1.05, 1) - env * 0.6,
      rot: wave(t, 0.42, 1.5),
      eyeOpen: blink(t, [1.7]),
      lookX: wave(t, 0.21, 1.5),
      mouthCurve: 0.3,
      mouthOpen: env * shape.open,
      mouthWidth: 0.8 + (shape.width - 0.8) * env,
      armR: 8 + gesture * (40 + wave(t, 0.8, 10)),
      antenna: wave(t, 1.05, 3),
    }
  },
}

// Dives into the status bar. The controller moves the pet along its arc from HIDE_LEAP onward.
export const HIDE_LEAP = 0.25
const hide: AnimationDef = {
  name: 'hide',
  label: 'Hide',
  category: 'system',
  duration: 0.95,
  pose: (t) => {
    const crouch = window_(t, 0, HIDE_LEAP + 0.05, 0.12)
    const air = seg(t, HIDE_LEAP - 0.05, HIDE_LEAP + 0.1)
    return {
      y: crouch * 7,
      sy: 1 - crouch * 0.16 + air * 0.12,
      sx: 1 + crouch * 0.1 - air * 0.08,
      eye: air > 0.5 ? 'closed' : 'happy',
      mouthCurve: 1,
      mouthOpen: air * 0.3,
      armL: 20 + air * 145,
      armR: 20 + air * 145,
      legL: air * 6,
      legR: air * 6,
      antenna: -air * 20,
    }
  },
}

// Pops back out of the status bar. The controller moves the pet during [0, SHOW_LAND].
export const SHOW_LAND = 0.6
const show: AnimationDef = {
  name: 'show',
  label: 'Show',
  category: 'system',
  duration: 1.5,
  speech: ['Hi again!', "I'm back!", 'You called?'],
  pose: (t) => {
    const inAir = t < SHOW_LAND
    const land = window_(t, SHOW_LAND - 0.05, SHOW_LAND + 0.25, 0.1)
    const waving = window_(t, SHOW_LAND + 0.2, 1.5, 0.2)
    return {
      y: land * 7,
      sy: inAir ? 1.1 : 1 - land * 0.15,
      sx: inAir ? 0.92 : 1 + land * 0.1,
      eye: inAir ? 'wide' : 'happy',
      mouthCurve: inAir ? 0.2 : 1,
      mouthOpen: inAir ? 0.6 : 0.4,
      mouthWidth: inAir ? 0.6 : 1,
      blush: inAir ? 0 : 0.5,
      armL: inAir ? 140 : 10 + (1 - land) * 10,
      armR: inAir ? 140 : 10 + waving * (110 + wave(t, 2.5, 18)),
      legL: inAir ? 6 : 0,
      legR: inAir ? 6 : 0,
      antenna: inAir ? 15 : -land * 15,
    }
  },
}

/** Every built-in animation, keyed by name. */
export const ANIMATIONS: Record<BuiltInAnimation, Animation> = {
  idle1,
  idle2,
  idle3,
  happy1,
  happy2,
  happy3,
  sad1,
  sad2,
  sad3,
  busy1,
  busy2,
  busy3,
  'flying-slow': flyingSlow,
  'flying-fast': flyingFast,
  talk,
  hide,
  show,
}

/** The animations users normally play, grouped by category (handy for building a UI). */
export const ANIMATION_GROUPS: { category: Exclude<Category, 'system'>; names: BuiltInAnimation[] }[] = [
  { category: 'idle', names: ['idle1', 'idle2', 'idle3'] },
  { category: 'happy', names: ['happy1', 'happy2', 'happy3'] },
  { category: 'sad', names: ['sad1', 'sad2', 'sad3'] },
  { category: 'busy', names: ['busy1', 'busy2', 'busy3'] },
  { category: 'flying', names: ['flying-slow', 'flying-fast'] },
  { category: 'talk', names: ['talk'] },
]
