import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from 'react'
import type { AttachmentPlacement } from '../pet/Pet'
import type { ChatMessage } from './mockAssistant'

const SUGGESTIONS = ['What can you do?', 'Tell me a joke', 'How do I hide you?']

export interface ChatSize {
  w: number
  h: number
}

const MIN = { w: 260, h: 240 }
const MAX = { w: 720, h: 800 }
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

type Corner = 'nw' | 'ne' | 'sw' | 'se'
const CORNERS: Corner[] = ['nw', 'ne', 'sw', 'se']

interface Props {
  placement: AttachmentPlacement
  messages: ChatMessage[]
  thinking: boolean
  size: ChatSize
  /** shift: how far the pet-side edge moved, so the pet can move with it. */
  onResize: (size: ChatSize, shift: { x: number; y: number }) => void
  onSend: (text: string) => void
  onClose: () => void
}

export function Chat({ placement, messages, thinking, size, onResize, onSend, onClose }: Props) {
  const [draft, setDraft] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const drag = useRef<{ corner: Corner; x: number; y: number; size: ChatSize; shifted: { x: number; y: number } } | null>(null)

  useEffect(() => input.current?.focus(), [])

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' })
  }, [messages, thinking])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text || thinking) return
    onSend(text)
    setDraft('')
  }

  const startResize = (corner: Corner) => (e: PointerEvent) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { corner, x: e.clientX, y: e.clientY, size, shifted: { x: 0, y: 0 } }
  }

  const moveResize = (e: PointerEvent) => {
    const d = drag.current
    if (!d) return
    const max = { w: Math.min(MAX.w, placement.maxW), h: Math.min(MAX.h, placement.maxH) }
    const edgeX = d.corner[1] === 'w' ? 'left' : 'right'
    const edgeY = d.corner[0] === 'n' ? 'top' : 'bottom'
    // the edge pinned to Pixel (CSS left/right, top/bottom); dragging it moves Pixel too
    const anchorX = placement.side === 'right' ? 'left' : 'right'
    const anchorY = placement.align === 'top' ? 'top' : 'bottom'

    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    const w = clamp(d.size.w + (edgeX === 'right' ? dx : -dx), MIN.w, max.w)
    const h = clamp(d.size.h + (edgeY === 'bottom' ? dy : -dy), MIN.h, max.h)
    // how far the dragged edge actually moved after clamping
    const movedX = edgeX === 'right' ? w - d.size.w : d.size.w - w
    const movedY = edgeY === 'bottom' ? h - d.size.h : d.size.h - h

    const total = { x: edgeX === anchorX ? movedX : 0, y: edgeY === anchorY ? movedY : 0 }
    onResize({ w, h }, { x: total.x - d.shifted.x, y: total.y - d.shifted.y })
    d.shifted = total
  }

  const endResize = () => (drag.current = null)

  return (
    <div
      className={`chat chat-${placement.side} chat-${placement.align}`}
      style={{ width: Math.min(size.w, placement.maxW), height: Math.min(size.h, placement.maxH) }}
      role="dialog"
      aria-label="Chat with Pixel"
    >
      <header className="chat-head">
        <span className="chat-dot" />
        <strong>Pixel</strong>
        <span className="chat-sub">{thinking ? 'thinking…' : 'online'}</span>
        <button className="chat-close" onClick={onClose} aria-label="Close chat">
          ×
        </button>
      </header>

      <div className="chat-list" ref={list}>
        {messages.length === 0 && <div className="chat-empty">Hi! I'm Pixel. Ask me anything.</div>}
        {messages.map((m) => (
          <div key={m.id} className={`msg msg-${m.role}`}>
            {m.text}
          </div>
        ))}
        {thinking && (
          <div className="msg msg-assistant typing" aria-label="Pixel is typing">
            <span />
            <span />
            <span />
          </div>
        )}
      </div>

      {messages.length === 0 && (
        <div className="chat-suggest">
          {SUGGESTIONS.map((q) => (
            <button key={q} onClick={() => onSend(q)}>
              {q}
            </button>
          ))}
        </div>
      )}

      <form className="chat-input" onSubmit={submit}>
        <input ref={input} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask Pixel…" />
        <button type="submit" disabled={!draft.trim() || thinking}>
          Send
        </button>
      </form>

      {CORNERS.map((c) => (
        <div
          key={c}
          className={`chat-grip chat-grip-${c}`}
          onPointerDown={startResize(c)}
          onPointerMove={moveResize}
          onPointerUp={endResize}
          onPointerCancel={endResize}
          aria-hidden
        />
      ))}
    </div>
  )
}
