import { act, createRef } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Rack, type PetInstance } from '../src/index.js'
import { Pet, PetIcon } from '../src/react.js'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const host = document.createElement('div')
document.body.append(host)
const root = createRoot(host)

afterEach(() => act(() => root.render(null)))

describe('<Pet>', () => {
  it('creates an instance, applies live props, and cleans up', async () => {
    const ref = createRef<PetInstance>()
    const onAnimationstart = vi.fn()
    await act(async () => root.render(<Pet ref={ref} size={0.5} onAnimationstart={onAnimationstart} />))
    const pet = ref.current!
    expect(pet).not.toBeNull()
    expect(pet.size).toBe(0.5)
    expect(document.querySelector('.mwpet')).not.toBeNull()

    await act(async () => root.render(<Pet ref={ref} size={1.5} character={Rack} onAnimationstart={onAnimationstart} />))
    expect(pet.size).toBe(1.5)
    expect(pet.character).toBe(Rack)

    void pet.play('happy1')
    expect(onAnimationstart).toHaveBeenCalledWith({ name: 'happy1' })

    await act(async () => root.render(null))
    expect(document.querySelector('.mwpet')).toBeNull()
  })
})

describe('<PetIcon>', () => {
  it('renders an inline svg', async () => {
    await act(async () => root.render(<PetIcon character={Rack} title="Rack" />))
    expect(host.querySelector('svg[aria-label="Rack"]')).not.toBeNull()
  })
})
