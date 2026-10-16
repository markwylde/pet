import { afterEach, describe, expect, it, vi } from 'vitest'
import Pet, { Pixel, Rack, defineCharacter, renderIcon, type Assistant, type PetInstance } from '../src/index.js'

let pets: PetInstance[] = []
const make = (...args: Parameters<typeof Pet>) => {
  const pet = Pet(...args)
  pets.push(pet)
  return pet
}

afterEach(() => {
  pets.forEach((p) => p.destroy())
  pets = []
  localStorage.clear()
})

describe('createPet', () => {
  it('mounts a drawing and removes it on destroy', () => {
    const pet = make()
    expect(document.body.contains(pet.element)).toBe(true)
    expect(pet.element.querySelector('svg')).not.toBeNull()
    expect(pet.character).toBe(Pixel)
    pet.destroy()
    expect(document.body.contains(pet.element)).toBe(false)
  })

  it('is the same function under every name', async () => {
    const mod = await import('../src/index.js')
    expect(mod.default).toBe(mod.createPet)
    expect(mod.Pet).toBe(mod.createPet)
  })

  it('labels itself for assistive tech', () => {
    const pet = make({ character: Rack })
    const body = pet.element.querySelector('.mwpet-body')!
    expect(body.getAttribute('role')).toBe('button')
    expect(body.getAttribute('aria-label')).toContain('Rack')
  })
})

describe('play()', () => {
  it('resolves true once the animation finishes', async () => {
    const pet = make({ speed: 20 })
    const started = vi.fn()
    pet.on('animationstart', started)
    await expect(pet.play('happy1')).resolves.toBe(true)
    expect(started).toHaveBeenCalledWith({ name: 'happy1' })
  })

  it('resolves false when interrupted', async () => {
    const pet = make()
    const first = pet.play('sad1')
    void pet.play('happy2')
    await expect(first).resolves.toBe(false)
    expect(pet.animation).toBe('happy2')
  })

  it('accepts a category and picks from it', () => {
    const pet = make()
    void pet.play('busy')
    expect(pet.animation).toMatch(/^busy[123]$/)
  })

  it('warns and resolves false for unknown names', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const pet = make()
    await expect(pet.play('moonwalk')).resolves.toBe(false)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('plays custom animations', async () => {
    const pet = make({ speed: 20, animations: [{ name: 'wiggle', category: 'happy', duration: 0.5, pose: () => ({ rot: 10 }) }] })
    expect(pet.animations.has('wiggle')).toBe(true)
    await expect(pet.play('wiggle')).resolves.toBe(true)
  })
})

describe('movement', () => {
  it('jumps when animate is false', async () => {
    const pet = make()
    await pet.moveTo({ x: 100, y: 120 }, { animate: false })
    expect(pet.position).toEqual({ x: 100, y: 120 })
  })

  it('flies to a position and resolves on arrival', async () => {
    const pet = make()
    await expect(pet.moveTo({ x: 50, y: 60 }, { speed: 4000 })).resolves.toBe(true)
    expect(pet.position.x).toBeCloseTo(50, 0)
    expect(pet.position.y).toBeCloseTo(60, 0)
  })
})

describe('hide() / show()', () => {
  it('transitions through the states and fires events', async () => {
    const pet = make({ speed: 4 })
    const onHide = vi.fn()
    const onShow = vi.fn()
    pet.on('hide', onHide)
    pet.on('show', onShow)

    const hiding = pet.hide()
    expect(pet.state).toBe('hiding')
    await hiding
    expect(pet.state).toBe('hidden')
    expect(pet.visible).toBe(false)
    expect(pet.element.dataset.state).toBe('hidden')
    expect(onHide).toHaveBeenCalledOnce()

    await pet.show()
    expect(pet.state).toBe('shown')
    expect(onShow).toHaveBeenCalledOnce()
  })

  it('shows itself first when asked to play while hidden', async () => {
    const pet = make({ hidden: true, speed: 20 })
    expect(pet.state).toBe('hidden')
    await expect(pet.play('happy1')).resolves.toBe(true)
    expect(pet.state).toBe('shown')
  })
})

describe('chat', () => {
  it('streams an assistant reply into the conversation', async () => {
    const assistant: Assistant = async function* () {
      yield { mood: 'happy' }
      yield 'Hello '
      yield { text: 'there!' }
    }
    const pet = make({ chat: { assistant } })
    const messages = vi.fn()
    pet.on('chat:message', messages)

    await pet.chat.send('hi')
    expect(pet.chat.isOpen).toBe(true)
    expect(pet.chat.messages.map((m) => [m.role, m.text])).toEqual([
      ['user', 'hi'],
      ['assistant', 'Hello there!'],
    ])
    expect(messages).toHaveBeenCalledTimes(2)
    expect(pet.element.querySelector('.mwpet-chat')!.textContent).toContain('Hello there!')
    expect(pet.animation).toMatch(/^happy/)
  })

  it('accepts a plain string (or promise) reply', async () => {
    const pet = make({ chat: { assistant: async (msgs) => `you said ${msgs.at(-1)!.text}` } })
    await pet.chat.send('ping')
    expect(pet.chat.messages.at(-1)!.text).toBe('you said ping')
  })

  it('turns a failing assistant into a message', async () => {
    const pet = make({
      chat: {
        assistant: () => {
          throw new Error('offline')
        },
      },
    })
    await pet.chat.send('hello?')
    expect(pet.chat.messages.at(-1)!.text).toContain('offline')
  })

  it('opens on click unless the click is prevented', () => {
    const pet = make({ chat: { assistant: () => 'hi' } })
    const body = pet.element.querySelector<HTMLElement>('.mwpet-body')!
    const tap = () => {
      body.dispatchEvent(new PointerEvent('pointerdown', { button: 0, clientX: 10, clientY: 10, bubbles: true }))
      body.dispatchEvent(new PointerEvent('pointerup', { button: 0, clientX: 10, clientY: 10, bubbles: true }))
    }
    const off = pet.on('click', (e) => e.preventDefault())
    tap()
    expect(pet.chat.isOpen).toBe(false)
    off()
    tap()
    expect(pet.chat.isOpen).toBe(true)
  })

  it('remembers the conversation when persist is set', async () => {
    const first = make({ persist: 'test-pet', chat: { assistant: () => 'pong' } })
    await first.chat.send('ping')
    first.destroy()
    const second = make({ persist: 'test-pet', chat: { assistant: () => 'pong' } })
    expect(second.chat.messages.map((m) => m.text)).toEqual(['ping', 'pong'])
  })

  it('opens on the roomier side of the pet', async () => {
    const pet = make({ position: { x: window.innerWidth - 200, y: 300 }, chat: { assistant: () => 'hi' } })
    pet.chat.open()
    await new Promise((r) => setTimeout(r, 60))
    const balloon = pet.element.querySelector<HTMLElement>('.mwpet-chat')!
    expect(balloon.dataset.side).toBe('left')
    expect(balloon.dataset.align).toBeDefined()
  })

  it('is a harmless no-op when disabled', async () => {
    const pet = make()
    expect(pet.chat.isOpen).toBe(false)
    pet.chat.open()
    await pet.chat.send('hi')
    expect(pet.chat.messages).toEqual([])
  })
})

describe('set()', () => {
  it('resizes around the feet', () => {
    const pet = make({ position: { x: 300, y: 300 } })
    const before = pet.position
    pet.set({ size: 2 })
    expect(pet.element.style.width).toBe('360px')
    // feet stay put: (90, 190) at size 1 → (180, 380) at size 2
    expect(pet.position).toEqual({ x: before.x - 90, y: before.y - 190 })
  })

  it('swaps characters live', () => {
    const pet = make()
    pet.set({ character: Rack })
    expect(pet.character).toBe(Rack)
  })
})

describe('characters', () => {
  it('fills in defaults', () => {
    const c = defineCharacter({
      id: 'blob',
      name: 'Blob',
      palette: { phosphor: '#fff', phosphorDim: '#999', screenInner: '#222', screenOuter: '#000' },
      body: ({ h }) => h('rect', { width: 10, height: 10 }),
    })
    expect(c.face).toBe('crt')
    expect(c.antenna).toBe(true)
    expect(c.rocket).toBe(true)
    expect(c.anchors.shoulder).toEqual({ x: 57, y: -82 })
  })

  it('rejects ids that would break SVG references', () => {
    expect(() => defineCharacter({ id: 'my pet', name: 'x', palette: Pixel.palette, body: () => '' })).toThrow()
  })

  it('renders standalone icons', () => {
    const svg = renderIcon(Rack, { title: 'Rack' })
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg).toContain('aria-label="Rack"')
  })
})
