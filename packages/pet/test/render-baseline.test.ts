import { describe, expect, it } from 'vitest'
import { BASE_POSE, Pixel, Rack, renderIcon, type Pose } from '../src/index.js'
import { createContext, renderFrame } from '../src/render/index.js'

// Pixel and Rack must keep rendering byte-for-byte the same as new character options land.
const POSES: Record<string, Partial<Pose>> = {
  rest: {},
  flying: { propeller: 3, flame: 0.9, speedLines: 1, speedAngle: 30 },
  busy: { progress: 0.4, code: 1.3, spinner: 0.7, keyboard: 1, gears: 0.5 },
  moody: { tears: 0.8, sweat: 0.6, glitch: 0.5, screen: 0.6, cloud: 1, brow: 1, blush: 1, mouthOpen: 0.7 },
}

describe.each([Pixel, Rack])('$name baseline', (character) => {
  it('icon', () => {
    expect(renderIcon(character, { title: character.name }).replace(/mwpet-icon\d+/g, 'icon')).toMatchSnapshot()
  })
  it.each(Object.keys(POSES))('frame: %s', (name) => {
    const ctx = createContext(character, 'snap')
    expect(renderFrame({ ...BASE_POSE, ...POSES[name] }, 1.25, ctx)).toMatchSnapshot()
  })
})
