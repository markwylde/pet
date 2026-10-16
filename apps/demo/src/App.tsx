import { ANIMATION_GROUPS, Pixel, Rack, type AnimationName, type Character, type ChatOptions, type PetInstance } from '@markwylde/pet'
import { Pet, PetIcon } from '@markwylde/pet/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { mockAssistant } from './chat/mockAssistant'
import { isBoolean, isNumber, usePersistentState } from './usePersistentState'

const STATUS_BAR_H = 44
const HIDE_AFTER = 10_000
const INSETS = { bottom: STATUS_BAR_H }

const CHARACTERS: Record<string, Character> = { pixel: Pixel, rack: Rack }
const isCharacterKey = (v: unknown): v is string => typeof v === 'string' && v in CHARACTERS

const CHAT: ChatOptions = {
  assistant: mockAssistant,
  suggestions: ['What can you do?', 'Tell me a joke', 'How do I hide you?'],
}

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 10_000)
    return () => window.clearInterval(id)
  }, [])
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function App() {
  const pet = useRef<PetInstance>(null)
  const tray = useRef<HTMLButtonElement>(null)
  const [current, setCurrent] = useState<AnimationName>('idle1')
  const [docked, setDocked] = useState(false)
  const [loop, setLoop] = usePersistentState('loop', false, isBoolean)
  const [autoHide, setAutoHide] = usePersistentState('autoHide', true, isBoolean)
  const [speed, setSpeed] = usePersistentState('speed', 1, isNumber)
  const [size, setSize] = usePersistentState('size', 1, isNumber)
  const [characterKey, setCharacterKey] = usePersistentState('character', 'pixel', isCharacterKey)
  const character = CHARACTERS[characterKey]
  const clock = useClock()

  // a stable function, so the pet doesn't see a "new" dock every render
  const dock = useCallback(() => tray.current, [])

  const chooseCharacter = (key: string) => {
    if (key === characterKey) return
    setCharacterKey(key)
    void pet.current?.play('happy3') // a little flip to show off the new body
  }

  const tour = async () => {
    const p = pet.current
    if (!p) return
    await p.moveTo('top-right', { speed: 900 })
    await p.say('I can fly anywhere you like!')
    await p.moveTo('center', { speed: 1600 })
    await p.play('happy3')
    await p.say("…and that's the tour!", { duration: 1800 })
  }

  return (
    <div className="stage">
      <aside className="panel">
        <header>
          <h1>
            {character.name} the {character === Rack ? 'Server' : 'Terminal'}
          </h1>
          <p>Click me to chat. Drag me around, drag fast to go turbo. Leave me alone and I'll nap in the tray.</p>
          <p className="hint">
            Keyboard: <kbd>Tab</kbd> to {character.name}, <kbd>Enter</kbd> to chat, arrows to fly (<kbd>Shift</kbd> for turbo), <kbd>Esc</kbd> to close.
          </p>
        </header>

        <section className="group group-character">
          <h2>Character</h2>
          <div className="characters" role="radiogroup" aria-label="Character">
            {Object.entries(CHARACTERS).map(([key, c]) => (
              <button
                key={key}
                role="radio"
                aria-checked={key === characterKey}
                className={`character ${key === characterKey ? 'active' : ''}`}
                onClick={() => chooseCharacter(key)}
              >
                <PetIcon character={c} className="character-preview" />
                <span className="character-name">{c.name}</span>
                <span className="character-kind">{c.kind}</span>
              </button>
            ))}
          </div>
        </section>

        {ANIMATION_GROUPS.map((group) => (
          <section key={group.category} className={`group group-${group.category}`}>
            <h2>{group.category}</h2>
            <div className="buttons">
              {group.names.map((name) => (
                <button key={name} className={current === name ? 'active' : ''} onClick={() => void pet.current?.play(name, { loop, speech: true })}>
                  {name}
                </button>
              ))}
            </div>
          </section>
        ))}

        <section className="group group-tour">
          <h2>API</h2>
          <div className="buttons">
            <button onClick={() => void tour()}>Run the tour</button>
            <button onClick={() => void pet.current?.say('Hello from pet.say()!')}>say()</button>
          </div>
        </section>

        <section className="settings">
          <label className="row">
            <input type="checkbox" checked={autoHide} onChange={(e) => setAutoHide(e.target.checked)} />
            Hide in tray after {HIDE_AFTER / 1000}s idle
          </label>
          <label className="row">
            <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} />
            Loop animations
          </label>
          <label className="row">
            Size
            <input type="range" min={0.5} max={2} step={0.1} value={size} onChange={(e) => setSize(Number(e.target.value))} />
            <span className="mono">{size.toFixed(1)}×</span>
          </label>
          <label className="row">
            Speed
            <input type="range" min={0.25} max={2} step={0.25} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
            <span className="mono">{speed.toFixed(2)}×</span>
          </label>
        </section>

        <footer className="now">
          {docked ? (
            <>Hiding in the tray. Click the tray icon to call {character.name} back.</>
          ) : (
            <>
              Now playing: <span className="mono">{current}</span>
            </>
          )}
        </footer>
      </aside>

      <Pet
        ref={pet}
        character={character}
        size={size}
        speed={speed}
        autoHide={autoHide ? HIDE_AFTER : false}
        dock={dock}
        insets={INSETS}
        persist="pet-demo"
        chat={CHAT}
        onAnimationstart={(e) => setCurrent(e.name)}
        onHide={() => setDocked(true)}
        onShow={() => {
          setDocked(false)
          void pet.current?.say('Hi again!', { animation: false, duration: 1600 })
        }}
      />

      <footer className="statusbar" style={{ height: STATUS_BAR_H }}>
        <span className="status-left mono">{character.name.toLowerCase()}@desktop ~ $</span>
        <div className="tray">
          <button
            ref={tray}
            className={`tray-pet ${docked ? 'docked' : ''}`}
            onClick={() => void pet.current?.toggle()}
            title={docked ? `Bring ${character.name} back` : `Send ${character.name} to the tray`}
            aria-label={docked ? `Bring ${character.name} back` : `Send ${character.name} to the tray`}
          >
            <PetIcon character={character} className="tray-icon" />
          </button>
          <span className="clock mono">{clock}</span>
        </div>
      </footer>
    </div>
  )
}
