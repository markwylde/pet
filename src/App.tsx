import { useEffect, useRef, useState } from 'react'
import { Chat, type ChatSize } from './chat/Chat'
import { mockAssistant, type ChatMessage } from './chat/mockAssistant'
import { ANIMATIONS, CATEGORIES, type AnimationName } from './pet/animations'
import { CHARACTER_IDS, CHARACTERS, isCharacterId, type CharacterId } from './pet/characters'
import { Pet, STATUS_BAR_H, type PetHandle, type Point, type Visibility } from './pet/Pet'
import { PetSvg } from './pet/PetSvg'
import { BASE_POSE } from './pet/pose'
import { isBoolean, isNumber, isPoint, isSize, loadSaved, save, usePersistentState } from './usePersistentState'

const HIDE_AFTER = 10
const MAX_SAVED_MESSAGES = 100

const isMessages = (v: unknown): v is ChatMessage[] =>
  Array.isArray(v) && v.every((m) => isNumber(m?.id) && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string')

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 10_000)
    return () => window.clearInterval(id)
  }, [])
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function App() {
  const pet = useRef<PetHandle>(null)
  const tray = useRef<HTMLButtonElement>(null)
  const [current, setCurrent] = useState<AnimationName>('idle1')
  const [visibility, setVisibility] = useState<Visibility>('shown')
  const [loop, setLoop] = usePersistentState('loop', false, isBoolean)
  const [autoHide, setAutoHide] = usePersistentState('autoHide', true, isBoolean)
  const [speed, setSpeed] = usePersistentState('speed', 1, isNumber)
  const [size, setSize] = usePersistentState('size', 1, isNumber)
  const [character, setCharacter] = usePersistentState<CharacterId>('character', 'terminal', isCharacterId)
  const rig = CHARACTERS[character]
  const [initialPosition] = useState(() => loadSaved<Point | null>('position', null, isPoint))
  const clock = useClock()

  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = usePersistentState<ChatMessage[]>('messages', [], isMessages)
  const [chatSize, setChatSize] = usePersistentState<ChatSize>('chatSize', { w: 320, h: 380 }, isSize)
  const [thinking, setThinking] = useState(false)
  const [streamingId, setStreamingId] = useState<number | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const nextId = useRef(messages.reduce((max, m) => Math.max(max, m.id), 0) + 1)
  const abort = useRef<AbortController | null>(null)

  const busy = thinking || streamingId !== null

  const resizeChat = (next: ChatSize, shift: { x: number; y: number }) => {
    setChatSize(next)
    if (shift.x || shift.y) pet.current?.nudge(shift.x, shift.y)
  }

  const closeChat = () => {
    setChatOpen(false)
    pet.current?.focus()
  }

  const send = async (text: string) => {
    const history: ChatMessage[] = [...messages, { id: nextId.current++, role: 'user', text }]
    const replyId = nextId.current++
    const ctrl = new AbortController()
    abort.current = ctrl
    setMessages(history.slice(-MAX_SAVED_MESSAGES))
    setThinking(true)
    pet.current?.play('busy1', { speech: false, loop: true })

    let mood: AnimationName = 'idle1'
    let reply = ''
    try {
      for await (const ev of mockAssistant(history, ctrl.signal, rig)) {
        if (ev.type === 'mood') {
          mood = ev.mood
          continue
        }
        if (!reply) {
          // first words: swap the typing dots for a live message and start talking
          setThinking(false)
          setStreamingId(replyId)
          setMessages((m) => [...m, { id: replyId, role: 'assistant', text: '' }])
          pet.current?.play('talk', { speech: false, loop: true })
        }
        reply += ev.delta
        const sofar = reply
        setMessages((m) => m.map((msg) => (msg.id === replyId ? { ...msg, text: sofar } : msg)))
      }
      setAnnouncement(reply)
    } catch (err) {
      if (!ctrl.signal.aborted) {
        mood = 'sad2'
        setMessages((m) => [...m, { id: nextId.current++, role: 'assistant', text: `Oops, something broke: ${String(err)}` }])
      } else {
        mood = 'idle1'
      }
    } finally {
      if (abort.current === ctrl) abort.current = null
      setThinking(false)
      setStreamingId(null)
      pet.current?.play(mood, { speech: false })
    }
  }

  const stop = () => abort.current?.abort()

  const clearChat = () => {
    stop()
    setMessages([])
  }

  const onVisibilityChange = (v: Visibility) => {
    setVisibility(v)
    if (v !== 'shown') setChatOpen(false)
  }

  const getTrayPoint = () => {
    const r = tray.current?.getBoundingClientRect()
    return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 + 8 } : { x: window.innerWidth - 60, y: window.innerHeight - 20 }
  }

  const docked = visibility === 'hidden'

  const chooseCharacter = (id: CharacterId) => {
    if (id === character) return
    setCharacter(id)
    pet.current?.play('happy3', { speech: false }) // a little flip to show off the new body
  }

  return (
    <div className="stage">
      <aside className="panel">
        <header>
          <h1>
            {rig.name} the {character === 'server' ? 'Server' : 'Terminal'}
          </h1>
          <p>Click me to chat. Drag me around, drag fast to go turbo. Leave me alone and I'll nap in the tray.</p>
          <p className="hint">
            Keyboard: <kbd>Tab</kbd> to {rig.name}, <kbd>Enter</kbd> to chat, arrows to fly (<kbd>Shift</kbd> for turbo), <kbd>Esc</kbd> to close.
          </p>
        </header>

        <section className="group group-character">
          <h2>Character</h2>
          <div className="characters" role="radiogroup" aria-label="Character">
            {CHARACTER_IDS.map((id) => (
              <button
                key={id}
                role="radio"
                aria-checked={id === character}
                className={`character ${id === character ? 'active' : ''}`}
                onClick={() => chooseCharacter(id)}
              >
                <span className="character-preview">
                  <PetSvg pose={BASE_POSE} time={0} viewBox={CHARACTERS[id].trayViewBox} character={id} />
                </span>
                <span className="character-name">{CHARACTERS[id].name}</span>
                <span className="character-kind">{CHARACTERS[id].kind}</span>
              </button>
            ))}
          </div>
        </section>

        {CATEGORIES.map((cat) => (
          <section key={cat.key} className={`group group-${cat.key}`}>
            <h2>{cat.title}</h2>
            <div className="buttons">
              {cat.names.map((name) => (
                <button key={name} className={current === name ? 'active' : ''} onClick={() => pet.current?.play(name)} title={ANIMATIONS[name].label}>
                  {name}
                </button>
              ))}
            </div>
          </section>
        ))}

        <section className="settings">
          <label className="row">
            <input type="checkbox" checked={autoHide} onChange={(e) => setAutoHide(e.target.checked)} />
            Hide in tray after {HIDE_AFTER}s idle
          </label>
          <label className="row">
            <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} />
            Loop current animation
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
            <>Hiding in the tray. Click the tray icon to call him back.</>
          ) : (
            <>
              Now playing: <span className="mono">{current}</span>
              <div className="label">{ANIMATIONS[current].label}</div>
            </>
          )}
        </footer>
      </aside>

      <Pet
        ref={pet}
        options={{ loop, speed, autoHide, hideAfter: HIDE_AFTER, keepAwake: chatOpen || busy, size }}
        getTrayPoint={getTrayPoint}
        initialPosition={initialPosition}
        onRest={(p) => save('position', p)}
        character={character}
        onAnimationChange={setCurrent}
        onVisibilityChange={onVisibilityChange}
        onPetClick={() => setChatOpen((o) => !o)}
        attachmentSize={chatOpen ? chatSize : null}
        renderAttachment={(placement) =>
          chatOpen && (
            <Chat
              placement={placement}
              name={rig.name}
              messages={messages}
              thinking={thinking}
              streamingId={streamingId}
              size={chatSize}
              onResize={resizeChat}
              onSend={send}
              onStop={stop}
              onClear={clearChat}
              onClose={closeChat}
            />
          )
        }
      />

      <div className="sr-only" aria-live="polite">
        {announcement && `${rig.name} says: ${announcement}`}
      </div>

      <footer className="statusbar" style={{ height: STATUS_BAR_H }}>
        <span className="status-left mono">{rig.name.toLowerCase()}@desktop ~ $</span>
        <div className="tray">
          <button
            ref={tray}
            className={`tray-pet ${docked ? 'docked' : ''}`}
            onClick={() => (docked ? pet.current?.show() : pet.current?.hide())}
            title={docked ? `Bring ${rig.name} back` : `Send ${rig.name} to the tray`}
            aria-label={docked ? `Bring ${rig.name} back` : `Send ${rig.name} to the tray`}
          >
            <PetSvg pose={BASE_POSE} time={0} viewBox={rig.trayViewBox} character={character} />
          </button>
          <span className="clock mono">{clock}</span>
        </div>
      </footer>
    </div>
  )
}
