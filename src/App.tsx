import { useEffect, useRef, useState } from 'react'
import { Chat, type ChatSize } from './chat/Chat'
import { mockAssistant, type ChatMessage } from './chat/mockAssistant'
import { ANIMATIONS, CATEGORIES, type AnimationName } from './pet/animations'
import { Pet, STATUS_BAR_H, type PetHandle, type Visibility } from './pet/Pet'
import { PetSvg } from './pet/PetSvg'
import { BASE_POSE } from './pet/pose'

const HIDE_AFTER = 10
const CHAT_SIZE_KEY = 'pixel.chatSize'

function loadChatSize(): ChatSize {
  try {
    const v = JSON.parse(localStorage.getItem(CHAT_SIZE_KEY) ?? '')
    if (typeof v?.w === 'number' && typeof v?.h === 'number') return v
  } catch {
    // no saved size
  }
  return { w: 320, h: 380 }
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
  const pet = useRef<PetHandle>(null)
  const tray = useRef<HTMLButtonElement>(null)
  const [current, setCurrent] = useState<AnimationName>('idle1')
  const [visibility, setVisibility] = useState<Visibility>('shown')
  const [loop, setLoop] = useState(false)
  const [autoHide, setAutoHide] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [size, setSize] = useState(1)
  const clock = useClock()

  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [thinking, setThinking] = useState(false)
  const [chatSize, setChatSize] = useState(loadChatSize)
  const resizeChat = (size: ChatSize, shift: { x: number; y: number }) => {
    setChatSize(size)
    if (shift.x || shift.y) pet.current?.nudge(shift.x, shift.y)
    try {
      localStorage.setItem(CHAT_SIZE_KEY, JSON.stringify(size))
    } catch {
      // storage unavailable; size just won't persist
    }
  }
  const nextId = useRef(1)
  const closeChat = () => setChatOpen(false)

  const send = async (text: string) => {
    const history = [...messages, { id: nextId.current++, role: 'user' as const, text }]
    setMessages(history)
    setThinking(true)
    pet.current?.play('busy1', { speech: false })
    const reply = await mockAssistant(history)
    setMessages((m) => [...m, { id: nextId.current++, role: 'assistant', text: reply.text }])
    setThinking(false)
    pet.current?.play(reply.mood, { speech: false })
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

  return (
    <div className="stage">
      <aside className="panel">
        <header>
          <h1>Pixel the Terminal</h1>
          <p>Click me to chat. Drag me around, drag fast to go turbo. Leave me alone and I'll nap in the tray.</p>
        </header>

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
        options={{ loop, speed, autoHide, hideAfter: HIDE_AFTER, keepAwake: chatOpen, size }}
        getTrayPoint={getTrayPoint}
        onAnimationChange={setCurrent}
        onVisibilityChange={onVisibilityChange}
        onPetClick={() => setChatOpen((o) => !o)}
        attachmentSize={chatOpen ? chatSize : null}
        renderAttachment={(placement) =>
          chatOpen && (
            <Chat
              placement={placement}
              messages={messages}
              thinking={thinking}
              size={chatSize}
              onResize={resizeChat}
              onSend={send}
              onClose={closeChat}
            />
          )
        }
      />

      <footer className="statusbar" style={{ height: STATUS_BAR_H }}>
        <span className="status-left mono">pixel@desktop ~ $</span>
        <div className="tray">
          <button
            ref={tray}
            className={`tray-pet ${docked ? 'docked' : ''}`}
            onClick={() => (docked ? pet.current?.show() : pet.current?.hide())}
            title={docked ? 'Bring Pixel back' : 'Send Pixel to the tray'}
            aria-label={docked ? 'Bring Pixel back' : 'Send Pixel to the tray'}
          >
            <PetSvg pose={BASE_POSE} time={0} viewBox="-72 -168 144 172" />
          </button>
          <span className="clock mono">{clock}</span>
        </div>
      </footer>
    </div>
  )
}
