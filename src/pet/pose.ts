export type EyeShape = 'open' | 'happy' | 'closed' | 'heart' | 'x' | 'squint' | 'spiral' | 'wide'

/**
 * A single frame of the character. Every animation is a pure function of time
 * that returns (part of) a Pose; the renderer draws whatever pose it is given.
 */
export interface Pose {
  // body transform
  x: number
  y: number
  rot: number
  sx: number
  sy: number

  // face
  eye: EyeShape
  eyeOpen: number
  lookX: number
  lookY: number
  brow: number // 0 = hidden, >0 sad tilt, <0 determined tilt
  mouthCurve: number // -1 frown … 1 smile
  mouthOpen: number // 0 … 1
  mouthWidth: number
  blush: number
  screen: number // screen brightness 0 … 1
  glitch: number // 0 … 1 scanline jitter

  // limbs (degrees from hanging down, positive = raised outward)
  armL: number
  armR: number
  legL: number // lift in px
  legR: number
  antenna: number // antenna sway in degrees

  // props / effects (0 = off, otherwise intensity or phase)
  tears: number
  sweat: number
  hearts: number
  zzz: number
  sparkles: number
  cloud: number
  gears: number
  progress: number // -1 = hidden, 0 … 1 fill
  code: number
  spinner: number
  keyboard: number
  propeller: number // 0 = hidden, otherwise spin speed
  flame: number
  speedLines: number
  speedAngle: number // direction of travel (deg) for speed lines
}

export const BASE_POSE: Pose = {
  x: 0,
  y: 0,
  rot: 0,
  sx: 1,
  sy: 1,
  eye: 'open',
  eyeOpen: 1,
  lookX: 0,
  lookY: 0,
  brow: 0,
  mouthCurve: 0.5,
  mouthOpen: 0,
  mouthWidth: 1,
  blush: 0,
  screen: 1,
  glitch: 0,
  armL: 8,
  armR: 8,
  legL: 0,
  legR: 0,
  antenna: 0,
  tears: 0,
  sweat: 0,
  hearts: 0,
  zzz: 0,
  sparkles: 0,
  cloud: 0,
  gears: 0,
  progress: -1,
  code: 0,
  spinner: 0,
  keyboard: 0,
  propeller: 0,
  flame: 0,
  speedLines: 0,
  speedAngle: 0,
}

type NumericKey = { [K in keyof Pose]: Pose[K] extends number ? K : never }[keyof Pose]

const NUMERIC_KEYS = (Object.keys(BASE_POSE) as (keyof Pose)[]).filter(
  (k) => typeof BASE_POSE[k] === 'number',
) as NumericKey[]

/** Blend two poses; discrete fields snap halfway through. */
export function lerpPose(a: Pose, b: Pose, k: number): Pose {
  if (k >= 1) return b
  const out = { ...b }
  for (const key of NUMERIC_KEYS) out[key] = a[key] + (b[key] - a[key]) * k
  // effects that are "off" should stay off rather than fade through odd values
  if (a.progress < 0 || b.progress < 0) out.progress = k < 0.5 ? a.progress : b.progress
  out.eye = k < 0.5 ? a.eye : b.eye
  return out
}
