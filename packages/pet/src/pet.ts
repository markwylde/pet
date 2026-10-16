import { ANIMATIONS, HIDE_LEAP, SHOW_LAND, type Animation, type AnimationName, type Category, type MotionContext } from './animations.js'
import { Chat } from './chat.js'
import { Pixel } from './characters/pixel.js'
import { Emitter } from './emitter.js'
import {
  BOX,
  arc,
  attachmentMax,
  choosePlacement,
  clampPet,
  clampWithAttachment,
  feetAt,
  smooth,
  type Placement,
  type Rect,
} from './layout.js'
import { BASE_POSE, lerpPose, type Pose } from './pose.js'
import { STAGE_VIEWBOX, createContext, renderFrame, type RenderContext } from './render/index.js'
import { createStore, isPoint } from './storage.js'
import { injectStyles } from './styles.js'
import type {
  DockTarget,
  HideOptions,
  MoveOptions,
  PetChat,
  PetClickEvent,
  PetEvents,
  PetInstance,
  PetOptions,
  PetState,
  PlayOptions,
  Point,
  Position,
  SayOptions,
  UpdatableOptions,
} from './types.js'

const BLEND_SECONDS = 0.25
const FAST_ON = 1100 // px/s to switch slow → fast
const FAST_OFF = 600 // px/s to switch fast → slow (hysteresis)
const GLIDE_STOP = 90 // px/s below which a thrown pet lands
const DOCK_SCALE = 0.12
const HAPPY: AnimationName[] = ['happy1', 'happy2', 'happy3']

let instances = 0

const pick = <T>(list: readonly T[], not?: T): T => {
  const pool = list.length > 1 ? list.filter((x) => x !== not) : list
  return pool[Math.floor(Math.random() * pool.length)]
}

/**
 * Like Microsoft Agent's idle levels: mostly the quiet resting loop, an occasional
 * glance once nobody has interacted for a bit, and dozing only after a long while.
 */
function nextIdle(idleFor: number, autoHide: boolean): AnimationName {
  if (idleFor < 3 || prefersReducedMotion()) return 'idle1'
  const r = Math.random()
  if (!autoHide && idleFor > 25 && r < 0.3) return 'idle3'
  return r < (autoHide ? 0.2 : 0.35) ? 'idle2' : 'idle1'
}

const prefersReducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** Inert stand-in used when the chat is turned off. */
const NO_CHAT: PetChat = {
  isOpen: false,
  busy: false,
  messages: [],
  open() {},
  close() {},
  toggle() {},
  send: async () => {},
  stop() {},
  clear() {},
}

/**
 * Put a pet on the page.
 *
 * @example
 * import Pet, { Rack } from '@markwylde/pet'
 *
 * const pet = Pet({ character: Rack, size: 0.8 })
 * await pet.moveTo('center')
 * await pet.play('happy')
 * pet.say('Hello!')
 */
export function createPet(options: PetOptions = {}): PetInstance {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('[@markwylde/pet] createPet() needs a browser. Call it on the client (e.g. in useEffect).')
  }
  if (options.injectStyles !== false) injectStyles()

  const uid = `mwpet${++instances}`
  const emitter = new Emitter<PetEvents>()
  const store = createStore(options.persist)

  // ---------- options ----------
  const opt = {
    character: options.character ?? Pixel,
    size: options.size ?? 1,
    speed: options.speed ?? 1,
    insets: options.insets ?? {},
    zIndex: options.zIndex ?? 2147483000,
    draggable: options.draggable ?? true,
    keyboard: options.keyboard ?? true,
    autoHide: options.autoHide ?? (false as number | false),
    dock: options.dock as DockTarget | undefined,
    theme: options.theme ?? 'auto',
    label: options.label,
  }
  let ctx: RenderContext = createContext(opt.character, uid)

  const animations = new Map<string, Animation>(Object.entries(ANIMATIONS))
  for (const a of options.animations ?? []) animations.set(a.name, a)
  const anim = (name: AnimationName) => animations.get(name) ?? ANIMATIONS.idle1

  // ---------- DOM ----------
  const root = document.createElement('div')
  root.className = 'mwpet'
  const body = document.createElement('div')
  body.className = 'mwpet-body'
  const speech = document.createElement('div')
  speech.className = 'mwpet-speech'
  speech.hidden = true
  speech.setAttribute('aria-hidden', 'true')
  const live = document.createElement('div')
  live.className = 'mwpet-sr'
  live.setAttribute('aria-live', 'polite')
  root.append(body, speech, live)

  // ---------- state ----------
  const bounds = (): Rect => ({
    left: opt.insets.left ?? 0,
    top: opt.insets.top ?? 0,
    right: window.innerWidth - (opt.insets.right ?? 0),
    bottom: window.innerHeight - (opt.insets.bottom ?? 0),
  })

  const resolvePosition = (p: Position): Point => {
    if (typeof p === 'object') return p
    const b = bounds()
    const W = BOX.width * opt.size
    const H = BOX.height * opt.size
    const pad = 16
    const x = p.endsWith('left') ? b.left + pad : p.endsWith('right') ? b.right - W - pad : (b.left + b.right - W) / 2
    const y = p.startsWith('top') ? b.top + pad : p.startsWith('bottom') ? b.bottom - H + 10 * opt.size : (b.top + b.bottom - H) / 2
    return { x, y }
  }

  const st = {
    anim: 'idle1' as AnimationName,
    animTime: 0,
    sinceSwitch: 0,
    ended: false,
    pending: null as ((completed: boolean) => void) | null,
    hold: null as AnimationName | null,
    from: BASE_POSE as Pose,
    last: BASE_POSE as Pose,
    clock: 0,
    idleFor: 0,
    state: (options.hidden ? 'hidden' : 'shown') as PetState,
    home: { x: 0, y: 0 } as Point,
    dock: null as Point | null, // pet position that puts its feet on the dock; null = shrink in place
    transition: null as (() => void) | null, // resolves the running hide()/show()
    queued: null as { name: AnimationName; options?: PlayOptions; resolve: (v: boolean) => void } | null,
    pos: clampPet(store.get('position', isPoint) ?? resolvePosition(options.position ?? 'bottom-right'), opt.size, bounds()),
    vel: { x: 0, y: 0 },
    lean: 0,
    placement: { side: 'right', align: 'bottom' } as Placement,
    relayout: true,
    mode: 'normal' as 'normal' | 'drag' | 'glide' | 'fly',
    flight: null as { from: Point; to: Point; t: number; dur: number; resolve: (v: boolean) => void } | null,
    pointerOffset: { x: 0, y: 0 },
    downAt: { x: 0, y: 0 },
    moved: false,
    samples: [] as { x: number; y: number; t: number }[],
    prevPos: { x: 0, y: 0 },
    still: 0,
    reported: null as Point | null,
    sayToken: 0,
    speechTimer: 0,
    destroyed: false,
  }
  st.home = { ...st.pos }
  st.prevPos = { ...st.pos }

  // ---------- animation control ----------
  const endCurrent = (completed: boolean) => {
    if (st.ended) return
    st.ended = true
    const resolve = st.pending
    st.pending = null
    resolve?.(completed)
    emitter.emit('animationend', { name: st.anim, completed })
  }

  const switchTo = (name: AnimationName, resolve?: (completed: boolean) => void) => {
    endCurrent(false)
    st.from = st.last
    st.anim = name
    st.animTime = 0
    st.sinceSwitch = 0
    st.ended = false
    st.pending = resolve ?? null
    emitter.emit('animationstart', { name })
  }

  const showSpeech = (text: string, ms: number) => {
    speech.textContent = text
    speech.hidden = false
    window.clearTimeout(st.speechTimer)
    st.speechTimer = window.setTimeout(() => (speech.hidden = true), ms)
  }

  const resolveName = (name: AnimationName | Category): AnimationName | null => {
    if (animations.has(name)) return name
    const group = [...animations.values()].filter((a) => a.category === name && a.category !== 'system').map((a) => a.name)
    return group.length ? pick(group, st.anim) : null
  }

  const stopMotion = () => {
    if (st.flight) {
      st.flight.resolve(false)
      st.flight = null
    }
    if (st.mode === 'glide' || st.mode === 'fly') st.mode = 'normal'
    st.vel = { x: 0, y: 0 }
  }

  const play = (name: AnimationName | Category, po: PlayOptions = {}): Promise<boolean> => {
    if (st.destroyed) return Promise.resolve(false)
    const resolved = resolveName(name)
    if (!resolved) {
      console.warn(`[@markwylde/pet] Unknown animation or category "${name}".`)
      return Promise.resolve(false)
    }
    st.idleFor = 0
    if (st.state === 'hiding') return Promise.resolve(false)
    if (st.state !== 'shown') {
      // come out first, then play
      st.queued?.resolve(false)
      return new Promise((resolve) => {
        st.queued = { name: resolved, options: po, resolve }
        if (st.state === 'hidden') void show()
      })
    }
    if (st.mode === 'drag') return Promise.resolve(false)
    stopMotion()
    st.hold = po.loop ? resolved : null
    if (po.speech) {
      const lines = anim(resolved).speech
      const text = typeof po.speech === 'string' ? po.speech : lines?.length ? pick(lines) : null
      if (text) showSpeech(text, 2200)
    }
    return new Promise((resolve) => switchTo(resolved, resolve))
  }

  const stop = () => {
    st.hold = null
    stopMotion()
    if (st.state === 'shown' && st.mode === 'normal') switchTo('idle1')
  }

  const say = (text: string, so: SayOptions = {}): Promise<boolean> => {
    const token = ++st.sayToken
    const ms = so.duration ?? Math.min(8000, Math.max(1500, 900 + text.length * 55))
    showSpeech(text, ms)
    const talking = so.animation === false ? null : (so.animation ?? 'talk')
    if (talking) void play(talking, { loop: true })
    return new Promise((resolve) =>
      window.setTimeout(() => {
        if (token !== st.sayToken || st.destroyed) return resolve(false)
        if (talking && st.hold === talking) stop()
        resolve(true)
      }, ms),
    )
  }

  // ---------- movement ----------
  const moveTo = (position: Position, mo: MoveOptions = {}): Promise<boolean> => {
    if (st.destroyed || st.state !== 'shown' || st.mode === 'drag') return Promise.resolve(false)
    st.idleFor = 0
    stopMotion()
    const to = clampPet(resolvePosition(position), opt.size, bounds())
    if (mo.animate === false) {
      st.pos = to
      st.relayout = true
      return Promise.resolve(true)
    }
    const dist = Math.hypot(to.x - st.pos.x, to.y - st.pos.y)
    if (dist < 1) return Promise.resolve(true)
    return new Promise((resolve) => {
      st.mode = 'fly'
      st.flight = { from: { ...st.pos }, to, t: 0, dur: Math.max(0.35, dist / (mo.speed ?? 700)), resolve }
    })
  }

  const moveBy = (dx: number, dy: number, mo?: MoveOptions) => moveTo({ x: st.pos.x + dx, y: st.pos.y + dy }, mo)

  // ---------- hide / show ----------
  const resolveDock = (target: DockTarget | undefined): Point | null => {
    const t = typeof target === 'function' ? target() : target
    if (!t) return null
    let c: Point
    if (typeof (t as Element).getBoundingClientRect === 'function') {
      const r = (t as Element).getBoundingClientRect()
      c = { x: r.left + r.width / 2, y: r.top + r.height / 2 + 8 }
    } else c = t as Point
    const f = feetAt(opt.size)
    return { x: c.x - f.x, y: c.y - f.y }
  }

  const setState = (s: PetState) => {
    st.state = s
    root.dataset.state = s
  }

  const hide = (ho: HideOptions = {}): Promise<void> => {
    if (st.destroyed || st.state === 'hidden') return Promise.resolve()
    if (st.state === 'hiding') return new Promise((r) => chainTransition(r))
    if (st.state === 'showing') return new Promise((r) => chainTransition(() => void hide(ho).then(r)))
    chat?.close()
    if (st.mode === 'drag') st.mode = 'normal'
    stopMotion()
    st.hold = null
    speech.hidden = true
    st.home = { ...st.pos }
    st.dock = resolveDock(ho.to ?? opt.dock)
    setState('hiding')
    return new Promise((resolve) => {
      st.transition = resolve
      switchTo('hide')
    })
  }

  const show = (): Promise<void> => {
    if (st.destroyed || st.state === 'shown') return Promise.resolve()
    if (st.state === 'showing') return new Promise((r) => chainTransition(r))
    if (st.state === 'hiding') return new Promise((r) => chainTransition(() => void show().then(r)))
    st.dock = resolveDock(opt.dock)
    st.home = clampPet(st.home, opt.size, bounds())
    st.pos = st.dock ? { ...st.dock } : { ...st.home }
    st.idleFor = 0
    setState('showing')
    return new Promise((resolve) => {
      st.transition = resolve
      switchTo('show')
      draw(0, 0) // place it before the first frame so it doesn't flash at home
    })
  }

  /** Run after the current hide/show finishes. */
  const chainTransition = (after: () => void) => {
    const prev = st.transition
    st.transition = () => {
      prev?.()
      after()
    }
  }

  const finishTransition = () => {
    const done = st.transition
    st.transition = null
    done?.()
  }

  // ---------- chat ----------
  let chat: Chat | null = null
  const chatHost = {
    get pet() {
      return instance
    },
    character: () => opt.character,
    emit: <K extends keyof PetEvents>(event: K, payload: PetEvents[K]) => {
      if (event === 'chat:open') st.relayout = true
      emitter.emit(event, payload)
    },
    store,
    nudge: (dx: number, dy: number) => {
      st.pos = { x: st.pos.x + dx, y: st.pos.y + dy }
    },
    announce: (text: string) => {
      live.textContent = ''
      window.setTimeout(() => (live.textContent = text), 50)
    },
    focusPet: () => body.focus({ preventScroll: true }),
  }
  const setChat = (c: PetOptions['chat']) => {
    if (!c) {
      chat?.destroy()
      chat = null
    } else if (chat) chat.update(c)
    else {
      chat = new Chat(chatHost, c)
      root.append(chat.element)
    }
    chatOptions = c || null
    applyAttributes()
  }
  let chatOptions = options.chat || null

  // ---------- input ----------
  const click = (originalEvent: Event) => {
    let prevented = false
    const e: PetClickEvent = {
      originalEvent,
      preventDefault: () => (prevented = true),
      get defaultPrevented() {
        return prevented
      },
    }
    emitter.emit('click', e)
    if (prevented) return
    if (chat && chatOptions?.openOnClick !== false) chat.toggle()
    else void play(pick(HAPPY), { speech: true })
  }

  const onPointerDown = (e: PointerEvent) => {
    if (st.state !== 'shown' || e.button !== 0) return
    st.idleFor = 0
    st.moved = false
    st.downAt = { x: e.clientX, y: e.clientY }
    if (!opt.draggable) return
    body.setPointerCapture(e.pointerId)
    stopMotion()
    st.mode = 'drag'
    st.pointerOffset = { x: e.clientX - st.pos.x, y: e.clientY - st.pos.y }
    st.samples = [{ x: e.clientX, y: e.clientY, t: performance.now() }]
  }

  const onPointerMove = (e: PointerEvent) => {
    if (st.mode !== 'drag') return
    if (!st.moved && Math.hypot(e.clientX - st.downAt.x, e.clientY - st.downAt.y) > 4) {
      st.moved = true
      emitter.emit('dragstart', { position: { ...st.pos } })
    }
    st.pos = clampPet({ x: e.clientX - st.pointerOffset.x, y: e.clientY - st.pointerOffset.y }, opt.size, bounds())
    st.samples.push({ x: e.clientX, y: e.clientY, t: performance.now() })
    if (st.samples.length > 20) st.samples.splice(0, st.samples.length - 20)
  }

  const onPointerUp = (e: PointerEvent) => {
    if (st.state !== 'shown' || e.button !== 0) return
    const wasDrag = st.mode === 'drag'
    if (!st.moved) {
      if (wasDrag) st.mode = 'normal'
      if (Math.hypot(e.clientX - st.downAt.x, e.clientY - st.downAt.y) <= 4) click(e)
      return
    }
    if (!wasDrag) return
    emitter.emit('dragend', { position: { ...st.pos } })
    st.mode = Math.hypot(st.vel.x, st.vel.y) > GLIDE_STOP ? 'glide' : 'normal'
    if (st.mode === 'normal') switchTo(st.hold ?? 'idle1')
  }

  const onPointerCancel = () => {
    if (st.mode !== 'drag') return
    st.mode = 'normal'
    switchTo(st.hold ?? 'idle1')
  }

  const ARROWS: Record<string, Point> = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } }

  const onKeyDown = (e: KeyboardEvent) => {
    if (!opt.keyboard || st.state !== 'shown' || e.target !== body) return
    st.idleFor = 0
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (st.mode === 'normal') click(e)
    } else if (e.key === 'Escape' && chat?.isOpen) {
      chat.close()
    } else if (ARROWS[e.key] && opt.draggable && st.mode !== 'drag') {
      e.preventDefault()
      // a little flight in that direction; Shift goes turbo
      const d = ARROWS[e.key]
      const push = e.shiftKey ? 1300 : 450
      if (st.flight) stopMotion()
      st.mode = 'glide'
      st.vel = { x: st.vel.x + d.x * push, y: st.vel.y + d.y * push }
    }
  }

  body.addEventListener('pointerdown', onPointerDown)
  body.addEventListener('pointermove', onPointerMove)
  body.addEventListener('pointerup', onPointerUp)
  body.addEventListener('pointercancel', onPointerCancel)
  body.addEventListener('keydown', onKeyDown)

  // ---------- frame loop ----------
  const draw = (scale: number, opacity: number) => {
    const size = opt.size
    const feet = feetAt(size)
    root.style.transform = `translate(${st.pos.x}px, ${st.pos.y}px) scale(${scale})`
    root.style.transformOrigin = `${feet.x}px ${feet.y}px`
    root.style.opacity = String(opacity)
    body.innerHTML = `<svg viewBox="${STAGE_VIEWBOX}" width="100%" height="100%" aria-hidden="true" focusable="false">${renderFrame(st.last, st.clock, ctx)}</svg>`
  }

  const tick = (dt: number, now: number) => {
    st.clock += dt
    st.sinceSwitch += dt
    st.animTime += dt * opt.speed
    const b = bounds()

    // --- motion ---
    if (st.mode === 'drag') {
      // velocity from the last ~100ms of pointer samples; decays to 0 when the pointer rests
      const recent = st.samples.filter((p) => now - p.t < 100)
      let tx = 0
      let ty = 0
      if (recent.length >= 2) {
        const a = recent[0]
        const z = recent[recent.length - 1]
        const span = Math.max(16, z.t - a.t) / 1000
        tx = (z.x - a.x) / span
        ty = (z.y - a.y) / span
      }
      st.vel.x += (tx - st.vel.x) * 0.25
      st.vel.y += (ty - st.vel.y) * 0.25
    } else if (st.mode === 'glide') {
      const next = { x: st.pos.x + st.vel.x * dt, y: st.pos.y + st.vel.y * dt }
      const c = clampPet(next, opt.size, b)
      if (c.x !== next.x) st.vel.x *= -0.6
      if (c.y !== next.y) st.vel.y *= -0.6
      st.pos = c
      const damp = Math.exp(-3.2 * dt)
      st.vel.x *= damp
      st.vel.y *= damp
      if (Math.hypot(st.vel.x, st.vel.y) < GLIDE_STOP) {
        st.mode = 'normal'
        st.vel = { x: 0, y: 0 }
        switchTo(st.hold ?? 'idle1')
      }
    } else if (st.mode === 'fly' && st.flight) {
      const f = st.flight
      f.t += dt
      const k = smooth(Math.min(1, f.t / f.dur))
      const next = { x: f.from.x + (f.to.x - f.from.x) * k, y: f.from.y + (f.to.y - f.from.y) * k }
      st.vel = { x: (next.x - st.pos.x) / Math.max(dt, 1e-3), y: (next.y - st.pos.y) / Math.max(dt, 1e-3) }
      st.pos = next
      if (f.t >= f.dur) {
        st.flight = null
        st.mode = 'normal'
        st.vel = { x: 0, y: 0 }
        switchTo(st.hold ?? 'idle1')
        f.resolve(true)
      }
    }

    // --- flying animations while moving ---
    if (st.mode !== 'normal') {
      const speed = Math.hypot(st.vel.x, st.vel.y)
      if (st.anim === 'flying-fast' && speed < FAST_OFF) switchTo('flying-slow')
      else if (st.anim !== 'flying-fast' && speed > FAST_ON) switchTo('flying-fast')
      else if (st.anim !== 'flying-fast' && st.anim !== 'flying-slow') switchTo('flying-slow')
    }

    // --- keep pet + chat on screen ---
    const att = st.state === 'shown' ? (chat?.attachment ?? null) : null
    if (att && chat) {
      // only re-pick the side when the pet travels, never mid-resize
      if (st.relayout || st.mode !== 'normal') st.placement = choosePlacement(st.pos, opt.size, att, st.placement, b)
      chat.layout(st.placement, attachmentMax(opt.size, st.placement, b))
    }
    st.relayout = false
    if (st.state === 'shown') {
      const target = clampWithAttachment(st.pos, opt.size, att, st.placement, b)
      if (st.mode === 'normal') {
        // scoot over smoothly rather than teleporting
        const k = Math.min(1, dt * 14)
        st.pos = { x: st.pos.x + (target.x - st.pos.x) * k, y: st.pos.y + (target.y - st.pos.y) * k }
      } else st.pos = target
    }

    // --- report where the pet came to rest ---
    const moved = Math.hypot(st.pos.x - st.prevPos.x, st.pos.y - st.prevPos.y) > 0.1
    st.prevPos = { ...st.pos }
    st.still = moved ? 0 : st.still + dt
    const r = st.reported
    if (st.state === 'shown' && st.mode === 'normal' && st.still > 0.4 && (!r || Math.abs(r.x - st.pos.x) > 0.5 || Math.abs(r.y - st.pos.y) > 0.5)) {
      const first = !r
      st.reported = { ...st.pos }
      if (!first) {
        store.set('position', st.reported)
        emitter.emit('move', { position: { ...st.reported } })
      }
    }

    // --- hide / show transit ---
    let scale = 1
    let opacity = 1
    if (st.state === 'hiding') {
      const k = smooth(Math.min(1, Math.max(0, (st.animTime - HIDE_LEAP) / (ANIMATIONS.hide.duration - HIDE_LEAP))))
      if (st.dock) st.pos = arc(st.home, st.dock, k)
      scale = 1 - k * (1 - (st.dock ? DOCK_SCALE : 0.05))
      opacity = 1 - Math.max(0, k - 0.8) * 5
    } else if (st.state === 'showing') {
      const k = smooth(Math.min(1, st.animTime / SHOW_LAND))
      if (st.dock) st.pos = arc(st.dock, st.home, k)
      scale = (st.dock ? DOCK_SCALE : 0.05) + k * (1 - (st.dock ? DOCK_SCALE : 0.05))
      opacity = Math.min(1, k * 5)
    }

    // --- idle timer & auto-hide ---
    const cur = anim(st.anim)
    if (st.state === 'shown' && st.mode === 'normal' && cur.category === 'idle' && !st.hold) {
      st.idleFor = chat?.isOpen || chat?.busy ? 0 : st.idleFor + dt
      if (opt.autoHide !== false && st.idleFor * 1000 >= opt.autoHide) void hide()
    }

    // --- sequencing ---
    const def = anim(st.anim)
    if (st.animTime >= def.duration) {
      if (st.anim === 'hide' && st.state === 'hiding') {
        endCurrent(true)
        setState('hidden')
        st.pos = { ...st.home }
        st.anim = 'idle1'
        st.ended = true
        st.from = st.last = BASE_POSE
        emitter.emit('hide', undefined)
        finishTransition()
        return
      }
      if (st.anim === 'show' && st.state === 'showing') {
        endCurrent(true)
        setState('shown')
        st.relayout = true
        emitter.emit('show', undefined)
        const q = st.queued
        st.queued = null
        if (q) {
          st.hold = q.options?.loop ? q.name : null
          switchTo(q.name, q.resolve)
        } else switchTo('idle1')
        finishTransition()
      } else if (st.mode !== 'normal' || st.anim === st.hold) {
        st.animTime %= def.duration
      } else {
        endCurrent(true)
        switchTo(nextIdle(st.idleFor, opt.autoHide !== false))
      }
    }

    // --- pose ---
    const now_ = anim(st.anim)
    const motion: MotionContext = st.mode !== 'normal' ? { vx: st.vel.x, vy: st.vel.y } : now_.name === 'flying-fast' ? { vx: 1200, vy: 0 } : { vx: 0, vy: 0 }
    let pose: Pose = { ...BASE_POSE, ...now_.pose(st.animTime, motion) }
    const targetLean = now_.category === 'flying' ? Math.max(-24, Math.min(24, motion.vx * 0.018)) : 0
    st.lean += (targetLean - st.lean) * Math.min(1, dt * 8)
    pose.rot += st.lean
    const k = Math.min(1, st.sinceSwitch / BLEND_SECONDS)
    pose = lerpPose(st.from, pose, smooth(k))
    st.last = pose

    draw(scale, opacity)
  }

  let raf = 0
  let prev = performance.now()
  const loop = (now: number) => {
    raf = requestAnimationFrame(loop)
    const dt = Math.min(0.05, Math.max(0, (now - prev) / 1000))
    prev = now
    if (st.state === 'hidden') return
    tick(dt, now)
  }

  const onResize = () => {
    st.pos = clampPet(st.pos, opt.size, bounds())
    st.relayout = true
  }
  window.addEventListener('resize', onResize)

  // ---------- attributes ----------
  function applyAttributes() {
    const c = opt.character
    root.dataset.theme = opt.theme
    root.dataset.draggable = String(opt.draggable)
    root.dataset.state = st.state
    root.style.zIndex = String(opt.zIndex)
    root.style.width = `${BOX.width * opt.size}px`
    root.style.height = `${BOX.height * opt.size}px`
    root.style.setProperty('--mwpet-size', String(opt.size))
    // top of the antenna, in px from the top of the box: the speech bubble sits just above it
    const head = ((c.anchors.antenna.y - 34 + 250) / 290) * BOX.height * opt.size
    root.style.setProperty('--mwpet-head', `${Math.max(0, head)}px`)
    body.tabIndex = opt.keyboard ? 0 : -1
    body.setAttribute('role', 'button')
    const hint = chat && chatOptions?.openOnClick !== false ? ' Press Enter to chat.' : ''
    const keys = opt.keyboard && opt.draggable ? ' Arrow keys fly it around.' : ''
    body.setAttribute('aria-label', (opt.label ?? `${c.name}, your ${c.kind}.`) + hint + keys)
  }

  const set = (o: UpdatableOptions) => {
    if (o.size !== undefined && o.size !== opt.size) {
      // resize around the feet so the pet grows and shrinks in place
      const before = feetAt(opt.size)
      const after = feetAt(o.size)
      st.pos = { x: st.pos.x + before.x - after.x, y: st.pos.y + before.y - after.y }
      st.home = { x: st.home.x + before.x - after.x, y: st.home.y + before.y - after.y }
      opt.size = o.size
      st.relayout = true
    }
    if (o.character && o.character !== opt.character) {
      opt.character = o.character
      ctx = createContext(o.character, uid)
      chat?.refresh()
    }
    if (o.speed !== undefined) opt.speed = o.speed
    if (o.insets !== undefined) opt.insets = o.insets
    if (o.zIndex !== undefined) opt.zIndex = o.zIndex
    if (o.draggable !== undefined) opt.draggable = o.draggable
    if (o.keyboard !== undefined) opt.keyboard = o.keyboard
    if (o.autoHide !== undefined) opt.autoHide = o.autoHide
    if ('dock' in o) opt.dock = o.dock
    if (o.theme !== undefined) opt.theme = o.theme
    if ('label' in o) opt.label = o.label
    if ('chat' in o) setChat(o.chat)
    applyAttributes()
    st.relayout = true
  }

  const destroy = () => {
    if (st.destroyed) return
    st.destroyed = true
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', onResize)
    window.clearTimeout(st.speechTimer)
    endCurrent(false)
    st.flight?.resolve(false)
    st.queued?.resolve(false)
    finishTransition()
    chat?.destroy()
    root.remove()
    emitter.clear()
  }

  const instance: PetInstance = {
    get element() {
      return root
    },
    get state() {
      return st.state
    },
    get visible() {
      return st.state === 'shown' || st.state === 'showing'
    },
    get animation() {
      return st.anim
    },
    get position() {
      return { ...st.pos }
    },
    get character() {
      return opt.character
    },
    get size() {
      return opt.size
    },
    get animations() {
      return animations
    },
    get chat() {
      return chat ?? NO_CHAT
    },
    play,
    stop,
    say,
    moveTo,
    moveBy,
    show,
    hide,
    toggle: () => (st.state === 'shown' || st.state === 'showing' ? hide() : show()),
    set,
    focus: () => body.focus({ preventScroll: true }),
    on: (event, handler) => emitter.on(event, handler),
    off: (event, handler) => emitter.off(event, handler),
    destroy,
  }

  if (options.chat) setChat(options.chat)
  applyAttributes()
  ;(options.container ?? document.body).appendChild(root)
  draw(1, 1)
  raf = requestAnimationFrame(loop)
  return instance
}
