import { afterEach, describe, expect, it } from 'vitest'
import Pet, {
  ANIMATIONS,
  BASE_POSE,
  Biscuit,
  Pixel,
  STAGE_VIEWBOX,
  characters,
  defineCharacter,
  renderIcon,
  type BuiltInAnimation,
  type EyeShape,
  type PetInstance,
  type Pose,
} from '../src/index.js'
import { createContext, renderFrame } from '../src/render/index.js'

const MOTION = { vx: 900, vy: 0 }
const frame = (character = Biscuit, pose: Partial<Pose> = {}, time = 0.5) =>
  renderFrame({ ...BASE_POSE, ...pose }, time, createContext(character, 't'))
const animate = (name: BuiltInAnimation, t: number, character = Biscuit) =>
  frame(character, ANIMATIONS[name].pose(t, MOTION), t)
const samples = (duration: number, count = 40) => Array.from({ length: count }, (_, i) => (i / (count - 1)) * duration)

/** Number of upward swings through the midline of a wave sampled over one second. */
function cycles(values: number[]): number {
  const mid = (Math.max(...values) + Math.min(...values)) / 2
  let n = 0
  for (let i = 1; i < values.length; i++) if (values[i - 1] < mid && values[i] >= mid) n++
  return n
}

/** Rotation of the last element with this class. */
const rotation = (svg: string, cls: string) => {
  const m = [...svg.matchAll(new RegExp(`class="${cls}" transform="[^"]*rotate\\(([-\\d.]+)\\)`, 'g'))].at(-1)
  if (!m) throw new Error(`no ${cls} in markup`)
  return Number(m[1])
}
const tail = (pose: Partial<Pose>, time: number) => rotation(frame(Biscuit, pose, time), 'mwpet-tail')
// the right ear swings outward with a negative rotation
const ear = (pose: Partial<Pose>, time: number) => -rotation(frame(Biscuit, pose, time), 'mwpet-ear')
const overSecond = (f: (t: number) => number) => samples(1, 400).map(f)

type Point = [number, number]
/** Flatten an absolute M/L/Q/C/Z path into a polygon. */
function polygon(d: string): Point[] {
  const tokens = d.match(/[MLQCZ]|-?[\d.]+/g)!
  const pts: Point[] = []
  let cmd = ''
  for (let i = 0; i < tokens.length; ) {
    if (/[A-Z]/.test(tokens[i])) cmd = tokens[i++]
    if (cmd === 'Z') continue
    const n = { M: 2, L: 2, Q: 4, C: 6 }[cmd]!
    const v = tokens.slice(i, (i += n)).map(Number)
    const ctrl: Point[] = [pts.at(-1) ?? [v[0], v[1]]]
    for (let k = 0; k < n; k += 2) ctrl.push([v[k], v[k + 1]])
    if (n === 2) pts.push(ctrl[1])
    else
      for (let t = 0.05; t <= 1.0001; t += 0.05) {
        let level = ctrl
        while (level.length > 1) level = level.slice(1).map((q, j) => [level[j][0] + (q[0] - level[j][0]) * t, level[j][1] + (q[1] - level[j][1]) * t])
        pts.push(level[0])
      }
  }
  return pts
}
const inside = ([x, y]: Point, poly: Point[]) =>
  poly.reduce((hit, [x1, y1], i) => {
    const [x2, y2] = poly[(i + 1) % poly.length]
    return (y1 > y) !== (y2 > y) && x < x1 + ((y - y1) * (x2 - x1)) / (y2 - y1) ? !hit : hit
  }, false)
/** Lowest y of the outline at this x. */
const underside = (x: number, poly: Point[]) =>
  Math.max(
    ...poly.flatMap(([x1, y1], i) => {
      const [x2, y2] = poly[(i + 1) % poly.length]
      return (x1 <= x) !== (x2 <= x) ? [y1 + ((x - x1) * (y2 - y1)) / (x2 - x1)] : []
    }),
  )
const shape = (svg: string, cls: string) => polygon(svg.match(new RegExp(`class="${cls}" d="([^"]+)"`))![1])

const SHARED_HAND = 'cy="33" r="7"'
const SHARED_FOOT = 'rx="12" ry="5.5"'
const ANTENNA = ['#a33b5b', '#4fb3ff'] // bobble and propeller hat
const FLAME = 'fill="url(#t-flame)"'
const SPEED_LINES = 'rgba(120,140,170,0.6)'

describe('custom parts', () => {
  const Stick = defineCharacter({
    id: 'stick',
    name: 'Stick',
    palette: Pixel.palette,
    body: () => '',
    arm: ({ side, angle }) => `<g data-arm="${side}" data-angle="${angle}"/>`,
    legs: ({ left, right }) => `<g data-legs="${left},${right}"/>`,
    antenna: false,
    rocket: false,
  })

  it('replaces the shared arms and legs', () => {
    const svg = frame(Stick)
    expect(svg).toContain('data-arm="L"')
    expect(svg).toContain('data-arm="R"')
    expect(svg).toContain('data-legs="0,0"')
    expect(svg).not.toContain(SHARED_HAND)
    expect(svg).not.toContain(SHARED_FOOT)
  })

  it('passes animated arm angles through', () => {
    const angles = new Set(samples(ANIMATIONS.happy1.duration).map((t) => animate('happy1', t, Stick).match(/data-arm="L" data-angle="([^"]+)"/)![1]))
    expect(angles.size).toBeGreaterThan(5)
  })

  it('hides the antenna and propeller hat', () => {
    for (const t of samples(ANIMATIONS['flying-slow'].duration)) {
      const svg = animate('flying-slow', t, Stick)
      for (const colour of ANTENNA) expect(svg).not.toContain(colour)
    }
  })

  it('hides rocket flames but keeps speed lines', () => {
    const frames = samples(ANIMATIONS['flying-fast'].duration).map((t) => animate('flying-fast', t, Stick))
    expect(frames.some((svg) => svg.includes(SPEED_LINES))).toBe(true)
    for (const svg of frames) expect(svg).not.toContain(FLAME)
  })

  it('keeps the shared parts by default', () => {
    const svg = frame(Pixel, { propeller: 3, flame: 1 })
    expect(svg).toContain(SHARED_HAND)
    expect(svg).toContain(SHARED_FOOT)
    expect(svg).toContain('#4fb3ff')
    expect(svg).toContain(FLAME)
  })
})

describe('toon face', () => {
  it('draws no screen', () => {
    const svg = frame()
    for (const id of ['t-screen', 't-scan', 't-glass', 't-matrix']) expect(svg).not.toContain(id)
  })

  it('draws every eye shape differently', () => {
    const shapes: EyeShape[] = ['open', 'happy', 'closed', 'heart', 'x', 'squint', 'spiral', 'wide']
    expect(new Set(shapes.map((eye) => frame(Biscuit, { eye })))).toHaveProperty('size', shapes.length)
  })

  it('shows a thought bubble only while a screen overlay is active', () => {
    expect(frame()).not.toContain('mwpet-thought')
    for (const pose of [{ progress: 0.5 }, { code: 1 }, { spinner: 1 }]) expect(frame(Biscuit, pose)).toContain('mwpet-thought')
  })

  it('keeps the thought bubble on stage', () => {
    const [x0, y0, w, h] = STAGE_VIEWBOX.split(' ').map(Number)
    for (const effectsOffsetY of [0, Biscuit.effectsOffsetY, -80]) {
      const svg = frame({ ...Biscuit, effectsOffsetY }, { progress: 0.5 })
      const bubble = svg.slice(svg.indexOf('mwpet-thought'))
      for (const [, cx, cy, r] of bubble.matchAll(/<circle cx="([-\d.]+)" cy="([-\d.]+)" r="([-\d.]+)"/g)) {
        expect(Number(cy) - Number(r) + effectsOffsetY).toBeGreaterThanOrEqual(y0)
        expect(Number(cy) + Number(r) + effectsOffsetY).toBeLessThanOrEqual(y0 + h)
        expect(Math.abs(Number(cx)) + Number(r)).toBeLessThanOrEqual(x0 + w)
      }
    }
  })

  it('shades the face as the screen dims', () => {
    expect(frame()).not.toContain('mwpet-shade')
    const opacity = Number(frame(Biscuit, { screen: 0.6 }).match(/class="mwpet-shade"[^>]*opacity="([\d.]+)"/)![1])
    expect(opacity).toBeGreaterThan(0)
  })
})

describe('Biscuit', () => {
  let pets: PetInstance[] = []
  afterEach(() => {
    pets.forEach((p) => p.destroy())
    pets = []
  })

  it('ships as a built-in character', () => {
    expect(characters.Biscuit).toBe(Biscuit)
    expect(Biscuit).toMatchObject({ id: 'biscuit', name: 'Biscuit', kind: 'cartoon dog', face: 'toon', antenna: false, rocket: false })
  })

  it('labels itself as a cartoon dog', () => {
    const pet = Pet({ character: Biscuit })
    pets.push(pet)
    const label = pet.element.querySelector('.mwpet-body')!.getAttribute('aria-label')
    expect(label).toContain('Biscuit')
    expect(label).toContain('cartoon dog')
  })

  it('renders a dog icon without robot parts', () => {
    const svg = renderIcon(Biscuit, { title: 'Biscuit' })
    expect(svg).toContain('aria-label="Biscuit"')
    for (const part of ['mwpet-tail', 'mwpet-ear', 'mwpet-paw', 'mwpet-hindleg']) expect(svg).toContain(part)
    expect(svg).not.toContain(SHARED_HAND)
    expect(svg).not.toContain(SHARED_FOOT)
  })

  it('joins its head to its body with no gap', () => {
    const svg = frame()
    const head = shape(svg, 'mwpet-head')
    const torso = shape(svg, 'mwpet-torso')
    for (let x = -36; x <= 36; x += 2) expect(inside([x, underside(x, head) + 1], torso), `x=${x}`).toBe(true)
  })

  it('starts each foreleg inside its head or body', () => {
    const svg = frame()
    const body = [shape(svg, 'mwpet-head'), shape(svg, 'mwpet-torso')]
    const paws = [...svg.matchAll(/class="mwpet-paw" transform="translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)"/g)]
    expect(paws).toHaveLength(2)
    for (const [, x, y, deg] of paws) {
      const a = (Number(deg) * Math.PI) / 180
      for (const [px, py] of [[-7, -2], [0, -2], [7, -2]]) {
        const p: Point = [Number(x) + px * Math.cos(a) - py * Math.sin(a), Number(y) + px * Math.sin(a) + py * Math.cos(a)]
        expect(body.some((poly) => inside(p, poly)), `paw at ${x} → ${p}`).toBe(true)
      }
    }
  })

  it('swings its ears with the antenna sway', () => {
    expect(ear({ antenna: 20 }, 0)).not.toBe(ear({ antenna: -20 }, 0))
  })

  it('flaps its ears to fly, faster when flying faster', () => {
    const rest = ear({}, 0)
    const slow = overSecond((t) => ear({ propeller: 1 }, t))
    const fast = overSecond((t) => ear({ propeller: 3 }, t))
    expect(new Set(slow).size).toBeGreaterThan(10)
    expect(Math.min(...slow)).toBeGreaterThan(rest)
    expect(cycles(fast)).toBeGreaterThan(cycles(slow))
  })

  it('wags faster when happy or busy', () => {
    const idle = cycles(overSecond((t) => tail({}, t)))
    expect(cycles(overSecond((t) => tail({ hearts: 0.5 }, t)))).toBeGreaterThan(idle)
    expect(cycles(overSecond((t) => tail({ progress: 0.5 }, t)))).toBeGreaterThan(idle)
  })

  it('droops its tail when sad', () => {
    const idle = overSecond((t) => tail({}, t))
    const sad = overSecond((t) => tail({ tears: 0.8 }, t))
    const swing = (v: number[]) => Math.max(...v) - Math.min(...v)
    const mean = (v: number[]) => v.reduce((a, b) => a + b) / v.length
    expect(mean(sad)).toBeGreaterThan(mean(idle) + 20) // rotated down, i.e. hanging lower
    expect(swing(sad)).toBeLessThan(swing(idle))
  })

  it('plays every built-in animation', () => {
    const parser = new DOMParser()
    for (const name of Object.keys(ANIMATIONS) as BuiltInAnimation[]) {
      for (const t of samples(ANIMATIONS[name].duration, 12)) {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg">${animate(name, t)}</svg>`
        const doc = parser.parseFromString(svg, 'image/svg+xml')
        expect(doc.querySelector('parsererror'), `${name} @ ${t}`).toBeNull()
      }
    }
  })

  it('plays animations on a live pet', async () => {
    const pet = Pet({ character: Biscuit, speed: 20 })
    pets.push(pet)
    await expect(pet.play('happy1')).resolves.toBe(true)
    await expect(pet.play('busy3')).resolves.toBe(true)
  })
})
