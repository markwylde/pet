import type { Animation, AnimationName, Category } from './animations.js'
import type { Character } from './characters/types.js'

export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

/** Space to keep clear at the viewport edges, in px — e.g. `{ bottom: 44 }` above a status bar. */
export interface Insets {
  top?: number
  right?: number
  bottom?: number
  left?: number
}

/** A named spot on screen, or exact viewport coordinates of the pet's top-left corner. */
export type Position = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | Point

/**
 * Where the pet goes when it hides: an element (it dives into its centre, like a tray icon),
 * a viewport point, or a function returning either — called at the moment it hides.
 */
export type DockTarget = Element | Point | (() => Element | Point | null | undefined)

export type Theme = 'auto' | 'light' | 'dark'

export type PetState = 'shown' | 'hiding' | 'hidden' | 'showing'

export interface PetOptions {
  /** Which character to show. Defaults to `Pixel`. */
  character?: Character
  /** Scale factor; `1` is a 180 × 220 px box. Defaults to `1`. */
  size?: number
  /** Animation speed multiplier. Defaults to `1`. */
  speed?: number
  /** Where the pet first appears. Defaults to `'bottom-right'`. Ignored when a saved position exists. */
  position?: Position
  /**
   * Element the pet is mounted into. Defaults to `document.body`. The pet is `position: fixed`,
   * so it always moves in viewport coordinates; the container only decides stacking.
   */
  container?: HTMLElement
  /** Viewport edges to stay away from. */
  insets?: Insets
  /** Stacking order. Defaults to `2147483000` (above almost everything). */
  zIndex?: number
  /** Let people drag (and throw) the pet. Defaults to `true`. */
  draggable?: boolean
  /** Make the pet focusable: Enter/Space clicks it, arrow keys fly it (Shift for turbo). Defaults to `true`. */
  keyboard?: boolean
  /**
   * Hide after this many milliseconds of idling (no interaction, nothing playing).
   * Defaults to `false` (never). Pairs nicely with `dock`.
   */
  autoHide?: number | false
  /** Where `hide()` sends the pet. Without one, it shrinks away on the spot. */
  dock?: DockTarget
  /** Start hidden; call `show()` to bring it out. Defaults to `false`. */
  hidden?: boolean
  /** Colour scheme for the chat and speech bubbles. Defaults to `'auto'` (follows the OS). */
  theme?: Theme
  /**
   * Remember position, chat size and chat history in localStorage under this key.
   * Defaults to `false`.
   */
  persist?: string | false
  /** Extra animations to make available to `play()`. Same name as a built-in overrides it. */
  animations?: Animation[]
  /** A chat balloon that opens when the pet is clicked. `false` (default) disables it. */
  chat?: ChatOptions | false
  /** Accessible name. Defaults to the character's name and kind. */
  label?: string
  /** Inject the default stylesheet. Turn off if you ship `css` yourself (e.g. for a strict CSP). Defaults to `true`. */
  injectStyles?: boolean
}

/** Options that can be changed after creation with `pet.set()`. */
export type UpdatableOptions = Pick<
  PetOptions,
  'character' | 'size' | 'speed' | 'insets' | 'zIndex' | 'draggable' | 'keyboard' | 'autoHide' | 'dock' | 'theme' | 'label' | 'chat'
>

// ---------- chat ----------

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  /** `Date.now()` when the message was created. */
  createdAt: number
  /** Buttons shown under the message. Clicking one emits `chat:action`. */
  actions?: ChatAction[]
}

/** A button on a chat message, e.g. "Allow" / "Decline" on a question the assistant asked. */
export interface ChatAction {
  id: string
  label: string
  /** How the button looks. Defaults to `'default'`. */
  kind?: 'default' | 'primary' | 'danger'
}

/** What the chat is doing, for a host that drives it (see `ChatOptions.onSend`). */
export type ChatStatus = 'idle' | 'thinking' | 'streaming'

/**
 * One piece of an assistant reply:
 * - a string (or `{ text }`) is appended to the reply,
 * - `{ mood }` picks the animation the pet plays once the reply is finished,
 *   e.g. `{ mood: 'happy' }` after a joke.
 */
export type AssistantChunk = string | { text: string } | { mood: AnimationName | Category }

export interface AssistantContext {
  /** Aborted when the user presses Stop, clears the chat, or the pet is destroyed. */
  signal: AbortSignal
  /** The pet that is talking — e.g. to play an animation mid-reply. */
  pet: PetInstance
  /** The current character, e.g. to give the model a persona. */
  character: Character
}

/**
 * Produces a reply to the conversation so far. Return a whole string (or a promise of one),
 * or an async iterable to stream it — the pet "talks" while chunks arrive.
 *
 * @example
 * // stream from your own backend
 * const assistant: Assistant = async function* (messages, { signal }) {
 *   const res = await fetch('/api/chat', { method: 'POST', body: JSON.stringify({ messages }), signal })
 *   const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader()
 *   for (;;) {
 *     const { value, done } = await reader.read()
 *     if (done) return
 *     yield value
 *   }
 * }
 */
export type Assistant = (
  messages: readonly ChatMessage[],
  context: AssistantContext,
) => string | Promise<string> | AsyncIterable<AssistantChunk>

export interface ChatOptions {
  /** Produces replies. Required unless `onSend` is set. */
  assistant?: Assistant
  /**
   * Take over the conversation. When set, the chat stops keeping its own history: sending calls
   * `onSend(text)` and the host shows the conversation with `chat.setMessages()` and
   * `chat.setStatus()`. Use it when the conversation lives somewhere else, e.g. on a server
   * shared by several clients. `assistant` is ignored.
   */
  onSend?: (text: string) => void
  /** With `onSend`: called when the user presses Stop. */
  onStop?: () => void
  /** With `onSend`: called when the user presses Clear. */
  onClear?: () => void
  /** Header title. Defaults to the character's name. */
  title?: string
  /** Shown while the conversation is empty. Defaults to "Hi! I'm {name}. Ask me anything." */
  greeting?: string
  /** Quick-reply chips shown while the conversation is empty. */
  suggestions?: string[]
  /** Input placeholder. Defaults to "Ask {name}…". */
  placeholder?: string
  /** Open the chat when the pet is clicked. Defaults to `true`. */
  openOnClick?: boolean
  /** Initial balloon size in px. Defaults to 320 × 380. */
  size?: Size
  /** Allow resizing from the corners. Defaults to `true`. */
  resizable?: boolean
  /** Played (looped) while waiting for the first chunk. Defaults to `'busy1'`. */
  thinkingAnimation?: AnimationName
  /** Played (looped) while a reply streams in. Defaults to `'talk'`. */
  talkingAnimation?: AnimationName
}

/** Control the chat balloon from code. */
export interface PetChat {
  readonly isOpen: boolean
  /** True while waiting for, or streaming, a reply. */
  readonly busy: boolean
  readonly messages: readonly ChatMessage[]
  open(): void
  close(): void
  toggle(): void
  /** Send a message as the user (opens the chat). Resolves when the reply has finished. */
  send(text: string): Promise<void>
  /** Stop the reply that is streaming. */
  stop(): void
  /** Forget the conversation. */
  clear(): void
  /** Replace the messages shown. Meant for a host that drives the chat with `onSend`. */
  setMessages(messages: readonly ChatMessage[]): void
  /** Show the chat as thinking, streaming or idle, with the matching animation. Meant for `onSend` hosts. */
  setStatus(status: ChatStatus): void
}

// ---------- actions & events ----------

export interface PlayOptions {
  /** Keep repeating until something else is played. Defaults to `false`. */
  loop?: boolean
  /** Show a speech bubble: `true` picks one of the animation's lines, a string says that. */
  speech?: boolean | string
}

export interface SayOptions {
  /** How long the bubble stays, in ms. Defaults to a reading-speed estimate. */
  duration?: number
  /** Animation while speaking. Defaults to `'talk'`; `false` keeps the current one. */
  animation?: AnimationName | false
}

export interface MoveOptions {
  /** Fly there (with the flying animations) instead of jumping. Defaults to `true`. */
  animate?: boolean
  /** Flight speed in px/s. Defaults to `700`. Above ~1100 it switches to `flying-fast`. */
  speed?: number
}

export interface HideOptions {
  /** Override the dock for this call. */
  to?: DockTarget
}

/** Payload of the `click` event. Call `preventDefault()` to stop the default (open chat / poke). */
export interface PetClickEvent {
  /** The pointer or keyboard event that caused it. */
  originalEvent: Event
  preventDefault(): void
  readonly defaultPrevented: boolean
}

export interface PetEvents {
  click: PetClickEvent
  animationstart: { name: AnimationName }
  /** `completed` is false when it was interrupted. */
  animationend: { name: AnimationName; completed: boolean }
  show: undefined
  hide: undefined
  dragstart: { position: Point }
  dragend: { position: Point }
  /** The pet came to rest somewhere new (after a drag, a throw, a flight or a resize). */
  move: { position: Point }
  'chat:open': undefined
  'chat:close': undefined
  /** A message was added — the user's, or the assistant's once it has finished streaming. */
  'chat:message': { message: ChatMessage }
  /** A button on a message was pressed. */
  'chat:action': { message: ChatMessage; action: ChatAction }
}

/** A pet on the page. Create one with `Pet()` / `createPet()`. */
export interface PetInstance {
  /** The root element (fixed-positioned, holds the drawing, speech bubble and chat). */
  readonly element: HTMLElement
  readonly state: PetState
  /** True unless hidden or hiding. */
  readonly visible: boolean
  /** Name of the animation playing right now. */
  readonly animation: AnimationName
  /** Top-left of the pet's box, in viewport px. */
  readonly position: Point
  readonly character: Character
  readonly size: number
  /** All animations this pet can play (built-ins plus your own). */
  readonly animations: ReadonlyMap<string, Animation>
  readonly chat: PetChat

  /**
   * Play an animation by name, or a random one from a category (`'happy'`).
   * Resolves `true` when it finishes, `false` if something interrupted it.
   */
  play(name: AnimationName | Category, options?: PlayOptions): Promise<boolean>
  /** Stop whatever is playing and go back to idling. */
  stop(): void
  /** Show a speech bubble while talking. Resolves when the bubble goes away. */
  say(text: string, options?: SayOptions): Promise<boolean>
  /** Fly (or jump) to a position. Resolves `true` on arrival, `false` if interrupted. */
  moveTo(position: Position, options?: MoveOptions): Promise<boolean>
  /** Fly (or jump) by an offset. */
  moveBy(dx: number, dy: number, options?: MoveOptions): Promise<boolean>
  /** Come out of the dock (or appear). Resolves once fully shown. */
  show(): Promise<void>
  /** Dive into the dock (or shrink away). Resolves once hidden. */
  hide(options?: HideOptions): Promise<void>
  toggle(): Promise<void>
  /** Change options on the fly. */
  set(options: UpdatableOptions): void
  /** Move keyboard focus to the pet. */
  focus(): void
  on<K extends keyof PetEvents>(event: K, handler: (payload: PetEvents[K]) => void): () => void
  off<K extends keyof PetEvents>(event: K, handler: (payload: PetEvents[K]) => void): void
  /** Remove the pet from the page and release everything it holds. */
  destroy(): void
}
