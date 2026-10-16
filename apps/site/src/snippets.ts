export interface Snippet {
  id: string
  label: string
  note: string
  code: string
}

export const SNIPPETS: Snippet[] = [
  {
    id: 'vanilla',
    label: 'Vanilla',
    note: 'Any page, any framework.',
    code: `import Pet, { Pixel } from '@markwylde/pet'

const pet = Pet({ character: Pixel, size: 0.8 })

await pet.moveTo('center')   // flies there
await pet.play('happy')      // random happy animation
await pet.say('Hello there!')`,
  },
  {
    id: 'react',
    label: 'React',
    note: 'Options are props; size, character & chat update live.',
    code: `import { Rack, type PetInstance } from '@markwylde/pet'
import { Pet } from '@markwylde/pet/react'

function App() {
  const pet = useRef<PetInstance>(null)
  return <Pet ref={pet} character={Rack} onClick={() => pet.current?.play('happy3')} />
}`,
  },
  {
    id: 'animation',
    label: 'Custom animation',
    note: 'A pose is a pure function of time.',
    code: `import Pet, { motion } from '@markwylde/pet'

const dance = {
  name: 'dance', category: 'happy', duration: 2,
  pose: (t) => ({
    x: motion.wave(t, 1, 12), rot: motion.wave(t, 2, 10),
    eye: 'happy', mouthOpen: 0.5, sparkles: t,
    armL: 120 + motion.wave(t, 2, 30), armR: 120 - motion.wave(t, 2, 30),
  }),
}

const pet = Pet({ animations: [dance] })
pet.play('dance')`,
  },
  {
    id: 'character',
    label: 'Custom character',
    note: "Toasty's full source is about 40 lines.",
    code: `import Pet, { defineCharacter } from '@markwylde/pet'

const Toasty = defineCharacter({
  id: 'toasty',
  name: 'Toasty',
  palette: { phosphor: '#ffb86b', phosphorDim: '#b36a2c',
             screenInner: '#3a1d0b', screenOuter: '#140801' },
  // draws everything behind the screen; runs every frame
  body: ({ h, pose }) => h('rect', { x: -62, y: -152, width: 124,
    height: 122, rx: 28, fill: '#cfd4dc' }),
})

pet.set({ character: Toasty })`,
  },
]

export const CHAT_SNIPPET = `const pet = Pet({
  chat: {
    suggestions: ['What can you do?'],
    assistant: async function* (messages, { signal }) {
      const res = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages }),
        signal, // the Stop button aborts it
      })
      const reader = res.body
        .pipeThrough(new TextDecoderStream())
        .getReader()
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        yield value          // he talks as it streams
      }
      yield { mood: 'happy' } // and reacts at the end
    },
  },
})`
