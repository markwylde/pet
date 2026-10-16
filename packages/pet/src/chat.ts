import type { AnimationName, Category } from './animations.js'
import type { Character } from './characters/types.js'
import type { Placement } from './layout.js'
import type { Store } from './storage.js'
import { isSize } from './storage.js'
import type { AssistantChunk, ChatMessage, ChatOptions, PetChat, PetEvents, PetInstance, Size } from './types.js'

/** What the chat needs from the pet that owns it. */
export interface ChatHost {
  pet: PetInstance
  character(): Character
  emit<K extends keyof PetEvents>(event: K, payload: PetEvents[K]): void
  store: Store
  /** Move the pet, used when the chat is resized from the pet's side. */
  nudge(dx: number, dy: number): void
  /** Announce text to screen readers. */
  announce(text: string): void
  focusPet(): void
}

const MIN: Size = { width: 260, height: 240 }
const MAX: Size = { width: 720, height: 800 }
const DEFAULT_SIZE: Size = { width: 320, height: 380 }
const MAX_SAVED = 100

type Corner = 'nw' | 'ne' | 'sw' | 'se'

const uid = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`)

const isMessages = (v: unknown): v is ChatMessage[] =>
  Array.isArray(v) &&
  v.every(
    (m) =>
      typeof m === 'object' &&
      m !== null &&
      typeof m.id === 'string' &&
      (m.role === 'user' || m.role === 'assistant') &&
      typeof m.text === 'string' &&
      typeof m.createdAt === 'number',
  )

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Record<string, unknown> = {}, ...children: (Node | string)[]): HTMLElementTagNameMap[K] {
  const node: HTMLElementTagNameMap[K] = Object.assign(document.createElement(tag), props)
  node.append(...children)
  return node
}

/** Turn whatever an assistant returned into a stream of chunks. */
async function* chunksOf(result: unknown): AsyncIterable<AssistantChunk> {
  const value = await result
  if (typeof value === 'string') yield value
  else if (value && typeof value === 'object' && Symbol.asyncIterator in value) yield* value as AsyncIterable<AssistantChunk>
  else if (value != null) throw new TypeError('An assistant must return a string, a promise of a string, or an async iterable.')
}

export class Chat implements PetChat {
  readonly element: HTMLElement
  private options: ChatOptions
  private host: ChatHost
  private list: HTMLElement
  private empty: HTMLElement
  private suggest: HTMLElement
  private input: HTMLInputElement
  private send_: HTMLButtonElement
  private clear_: HTMLButtonElement
  private status: HTMLElement
  private title: HTMLElement
  private typing: HTMLElement | null = null
  private streamingEl: HTMLElement | null = null

  private _messages: ChatMessage[]
  private _open = false
  private phase: 'idle' | 'thinking' | 'streaming' = 'idle'
  private abort: AbortController | null = null
  private size: Size
  private placement: Placement = { side: 'right', align: 'bottom' }
  private max: Size = MAX
  private drag: { corner: Corner; x: number; y: number; size: Size; shifted: { x: number; y: number } } | null = null

  constructor(host: ChatHost, options: ChatOptions) {
    this.host = host
    this.options = options
    this._messages = host.store.get('messages', isMessages) ?? []
    const saved = host.store.get('chat-size', isSize)
    this.size = saved ?? options.size ?? DEFAULT_SIZE

    this.title = el('span', { className: 'mwpet-chat-title' })
    this.status = el('span', { className: 'mwpet-chat-status' }, 'online')
    this.clear_ = el('button', { className: 'mwpet-chat-clear', type: 'button', title: 'Clear conversation' }, 'Clear')
    const close = el('button', { className: 'mwpet-chat-close', type: 'button', title: 'Close (Esc)', ariaLabel: 'Close chat' }, '×')
    this.empty = el('div', { className: 'mwpet-chat-empty' })
    this.list = el('div', { className: 'mwpet-chat-list' })
    this.suggest = el('div', { className: 'mwpet-chat-suggest' })
    this.input = el('input', { className: 'mwpet-chat-input', type: 'text', autocomplete: 'off' })
    this.send_ = el('button', { className: 'mwpet-chat-send', type: 'submit' }, 'Send')
    const form = el('form', { className: 'mwpet-chat-form' }, this.input, this.send_)

    this.element = el(
      'div',
      { className: 'mwpet-chat', hidden: true, role: 'dialog' },
      el('header', { className: 'mwpet-chat-head' }, el('span', { className: 'mwpet-chat-dot' }), this.title, this.status, this.clear_, close),
      this.list,
      this.suggest,
      form,
    )
    for (const corner of ['nw', 'ne', 'sw', 'se'] as Corner[]) this.element.append(this.grip(corner))
    this.element.dataset.side = this.placement.side
    this.element.dataset.align = this.placement.align

    close.addEventListener('click', () => this.close())
    this.clear_.addEventListener('click', () => this.clear())
    this.input.addEventListener('input', () => this.syncButton())
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      if (this.busy) return this.stop()
      const text = this.input.value.trim()
      if (!text) return
      this.input.value = ''
      void this.send(text)
    })
    // keep clicks and drags inside the balloon from reaching the pet underneath
    this.element.addEventListener('pointerdown', (e) => e.stopPropagation())

    this.applyText()
    this.renderMessages()
    this.applySize()
  }

  // ---------- PetChat ----------

  get isOpen() {
    return this._open
  }

  get busy() {
    return this.phase !== 'idle'
  }

  get messages(): readonly ChatMessage[] {
    return this._messages
  }

  open() {
    if (this._open) return
    if (!this.host.pet.visible) void this.host.pet.show()
    this._open = true
    this.element.hidden = false
    document.addEventListener('keydown', this.onKey, true)
    this.scrollToEnd(false)
    this.input.focus({ preventScroll: true })
    this.host.emit('chat:open', undefined)
  }

  close() {
    if (!this._open) return
    const hadFocus = this.element.contains(document.activeElement)
    this._open = false
    this.element.hidden = true
    document.removeEventListener('keydown', this.onKey, true)
    if (hadFocus) this.host.focusPet()
    this.host.emit('chat:close', undefined)
  }

  toggle() {
    if (this._open) this.close()
    else this.open()
  }

  stop() {
    this.abort?.abort()
  }

  clear() {
    this.stop()
    this._messages = []
    this.host.store.remove('messages')
    this.renderMessages()
  }

  async send(text: string): Promise<void> {
    text = text.trim()
    if (!text || this.busy) return
    this.open()
    const { pet } = this.host
    const user: ChatMessage = { id: uid(), role: 'user', text, createdAt: Date.now() }
    this.push(user)
    // a suggestion chip that was clicked is gone now; keep focus in the balloon
    const active = document.activeElement
    if (!active || active === document.body || (active !== this.input && this.element.contains(active))) this.input.focus({ preventScroll: true })

    const ctrl = new AbortController()
    this.abort = ctrl
    this.setPhase('thinking')
    void pet.play(this.options.thinkingAnimation ?? 'busy1', { loop: true })

    let mood: AnimationName | Category = 'idle1'
    let reply: ChatMessage | null = null
    try {
      const result = this.options.assistant([...this._messages], { signal: ctrl.signal, pet, character: this.host.character() })
      for await (const chunk of chunksOf(result)) {
        if (ctrl.signal.aborted) break
        if (typeof chunk === 'object' && 'mood' in chunk) {
          mood = chunk.mood
          continue
        }
        const delta = typeof chunk === 'string' ? chunk : chunk.text
        if (!delta) continue
        if (!reply) {
          // first words: swap the typing dots for a live message and start talking
          reply = { id: uid(), role: 'assistant', text: '', createdAt: Date.now() }
          this._messages.push(reply)
          this.setPhase('streaming')
          this.renderMessages()
          void pet.play(this.options.talkingAnimation ?? 'talk', { loop: true })
        }
        reply.text += delta
        if (this.streamingEl) this.streamingEl.textContent = reply.text.trimEnd()
        this.scrollToEnd(true)
      }
    } catch (err) {
      if (!ctrl.signal.aborted) {
        mood = 'sad2'
        const message: ChatMessage = { id: uid(), role: 'assistant', text: `Oops, something went wrong: ${err instanceof Error ? err.message : String(err)}`, createdAt: Date.now() }
        if (reply && !reply.text) this._messages = this._messages.filter((m) => m !== reply)
        reply = null
        this.phase = 'idle'
        this.push(message)
      }
    } finally {
      if (this.abort === ctrl) this.abort = null
      if (ctrl.signal.aborted) mood = 'idle1'
      if (reply) {
        if (!reply.text) this._messages = this._messages.filter((m) => m !== reply)
        else {
          this.host.emit('chat:message', { message: reply })
          this.host.announce(`${this.host.character().name} says: ${reply.text}`)
        }
      }
      this.setPhase('idle')
      this.renderMessages()
      this.save()
      void pet.play(mood)
    }
  }

  /** Esc closes the chat when focus is in it, on the pet, or nowhere in particular. */
  private onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return
    const active = document.activeElement
    const pet = this.element.parentElement
    if (!active || active === document.body || (pet && pet.contains(active))) {
      e.stopPropagation()
      this.close()
    }
  }

  // ---------- used by the pet ----------

  /** Size the pet should make room for, or null while closed. */
  get attachment(): Size | null {
    if (!this._open) return null
    return { width: Math.min(this.size.width, this.max.width), height: Math.min(this.size.height, this.max.height) }
  }

  /** Called every frame while open with where the balloon sits and how big it may be. */
  layout(placement: Placement, max: Size) {
    if (placement.side !== this.placement.side || placement.align !== this.placement.align) {
      this.placement = placement
      this.element.dataset.side = placement.side
      this.element.dataset.align = placement.align
    }
    if (max.width !== this.max.width || max.height !== this.max.height) {
      this.max = max
      this.applySize()
    }
  }

  update(options: ChatOptions) {
    this.options = options
    this.applyText()
    this.renderMessages()
  }

  /** Character changed: refresh names. */
  refresh() {
    this.applyText()
    this.renderMessages()
  }

  destroy() {
    this.stop()
    document.removeEventListener('keydown', this.onKey, true)
    this.element.remove()
  }

  // ---------- internals ----------

  private push(message: ChatMessage) {
    this._messages.push(message)
    if (this._messages.length > MAX_SAVED) this._messages.splice(0, this._messages.length - MAX_SAVED)
    this.renderMessages()
    this.save()
    this.host.emit('chat:message', { message })
  }

  private save() {
    this.host.store.set('messages', this._messages.filter((m) => m.text))
  }

  private setPhase(phase: Chat['phase']) {
    this.phase = phase
    this.status.textContent = phase === 'thinking' ? 'thinking…' : phase === 'streaming' ? 'typing…' : 'online'
    this.syncButton()
  }

  private syncButton() {
    if (this.busy) {
      this.send_.textContent = 'Stop'
      this.send_.dataset.stop = ''
      this.send_.disabled = false
    } else {
      this.send_.textContent = 'Send'
      delete this.send_.dataset.stop
      this.send_.disabled = !this.input.value.trim()
    }
  }

  private applyText() {
    const name = this.host.character().name
    this.title.textContent = this.options.title ?? name
    this.element.setAttribute('aria-label', `Chat with ${this.options.title ?? name}`)
    this.empty.textContent = this.options.greeting ?? `Hi! I'm ${name}. Ask me anything.`
    this.input.placeholder = this.options.placeholder ?? `Ask ${name}…`
    this.input.setAttribute('aria-label', `Message ${name}`)
    this.suggest.replaceChildren(
      ...(this.options.suggestions ?? []).map((q) => {
        const b = el('button', { type: 'button' }, q)
        b.addEventListener('click', () => void this.send(q))
        return b
      }),
    )
    this.syncButton()
  }

  private renderMessages() {
    const empty = this._messages.length === 0
    this.clear_.hidden = empty
    this.suggest.hidden = !empty || !this.options.suggestions?.length
    this.streamingEl = null
    const nodes: Node[] = empty ? [this.empty] : []
    for (const m of this._messages) {
      const node = el('div', { className: 'mwpet-msg' })
      node.dataset.role = m.role
      const streaming = this.phase === 'streaming' && m === this._messages[this._messages.length - 1] && m.role === 'assistant'
      node.textContent = streaming ? m.text.trimEnd() : m.text
      if (streaming) {
        node.dataset.streaming = ''
        this.streamingEl = node
      }
      nodes.push(node)
    }
    if (this.phase === 'thinking') {
      this.typing ??= el('div', { className: 'mwpet-msg mwpet-typing', ariaLabel: 'typing' }, el('span'), el('span'), el('span'))
      this.typing.dataset.role = 'assistant'
      nodes.push(this.typing)
    }
    this.list.replaceChildren(...nodes)
    this.scrollToEnd(false)
  }

  private scrollToEnd(smooth: boolean) {
    this.list.scrollTo?.({ top: this.list.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
  }

  private applySize() {
    const s = this.attachmentFor(this.size)
    this.element.style.width = `${s.width}px`
    this.element.style.height = `${s.height}px`
  }

  private attachmentFor(size: Size): Size {
    return { width: Math.min(size.width, this.max.width), height: Math.min(size.height, this.max.height) }
  }

  private grip(corner: Corner): HTMLElement {
    const g = el('div', { className: 'mwpet-grip' })
    g.dataset.corner = corner
    g.setAttribute('aria-hidden', 'true')
    g.hidden = this.options.resizable === false
    g.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      e.stopPropagation()
      g.setPointerCapture(e.pointerId)
      this.drag = { corner, x: e.clientX, y: e.clientY, size: this.attachmentFor(this.size), shifted: { x: 0, y: 0 } }
    })
    g.addEventListener('pointermove', (e) => this.resize(e))
    const end = () => {
      if (!this.drag) return
      this.drag = null
      this.host.store.set('chat-size', this.size)
    }
    g.addEventListener('pointerup', end)
    g.addEventListener('pointercancel', end)
    return g
  }

  private resize(e: PointerEvent) {
    const d = this.drag
    if (!d) return
    const max = { width: Math.min(MAX.width, this.max.width), height: Math.min(MAX.height, this.max.height) }
    const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
    const edgeX = d.corner[1] === 'w' ? 'left' : 'right'
    const edgeY = d.corner[0] === 'n' ? 'top' : 'bottom'
    // the edges pinned to the pet; dragging one of those moves the pet along with it
    const anchorX = this.placement.side === 'right' ? 'left' : 'right'
    const anchorY = this.placement.align === 'top' ? 'top' : 'bottom'

    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    const width = clamp(d.size.width + (edgeX === 'right' ? dx : -dx), MIN.width, max.width)
    const height = clamp(d.size.height + (edgeY === 'bottom' ? dy : -dy), MIN.height, max.height)
    const movedX = edgeX === 'right' ? width - d.size.width : d.size.width - width
    const movedY = edgeY === 'bottom' ? height - d.size.height : d.size.height - height

    this.size = { width, height }
    this.applySize()
    const total = { x: edgeX === anchorX ? movedX : 0, y: edgeY === anchorY ? movedY : 0 }
    const shift = { x: total.x - d.shifted.x, y: total.y - d.shifted.y }
    d.shifted = total
    if (shift.x || shift.y) this.host.nudge(shift.x, shift.y)
  }
}
