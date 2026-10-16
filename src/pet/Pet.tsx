import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode, type Ref } from 'react'
import { ANIMATIONS, HIDE_LEAP, SHOW_LAND, type AnimationName, type MotionContext } from './animations'
import { BASE_POSE, lerpPose, type Pose } from './pose'
import { CHARACTERS, type CharacterId } from './characters'
import { PetSvg } from './PetSvg'

export const PET_W = 180
export const PET_H = 220
export const STATUS_BAR_H = 44

/** Where the feet sit inside the pet box at size 1; the pet scales around this point. */
const FEET = { x: PET_W / 2, y: 190 }
const feetAt = (size: number) => ({ x: FEET.x * size, y: FEET.y * size })
const TRAY_SCALE = 0.12

const BLEND_SECONDS = 0.25
const FAST_ON = 1100 // px/s to switch slow → fast
const FAST_OFF = 600 // px/s to switch fast → slow (hysteresis)
const GLIDE_STOP = 90 // px/s below which a thrown pet lands

export type Visibility = 'shown' | 'hiding' | 'hidden' | 'showing'

export interface PetHandle {
  /** loop: keep repeating this animation (even across drags) until another play(). */
  play: (name: AnimationName, opts?: { speech?: boolean; loop?: boolean }) => void
  focus: () => void
  hide: () => void
  show: () => void
  /** Move the pet by a delta, e.g. when its attachment is resized from the pet's side. */
  nudge: (dx: number, dy: number) => void
}

export interface PetOptions {
  loop: boolean
  speed: number
  autoHide: boolean
  hideAfter: number // seconds of idling before hiding
  keepAwake?: boolean // e.g. while the chat is open
  size: number // 1 = 180×220px
}

export interface AttachmentPlacement {
  side: 'left' | 'right'
  align: 'top' | 'bottom'
  /** Largest attachment that still fits on screen next to the pet. */
  maxW: number
  maxH: number
}

export interface AttachmentSize {
  w: number
  h: number
}

interface Props {
  ref?: Ref<PetHandle>
  options: PetOptions
  /** Screen-space point (centre of the tray icon) the pet hides into. */
  getTrayPoint: () => { x: number; y: number }
  onAnimationChange?: (name: AnimationName) => void
  onVisibilityChange?: (v: Visibility) => void
  /** Called on a click without dragging. If omitted, a click pokes the pet. */
  onPetClick?: () => void
  /** Content that travels with the pet (e.g. a chat balloon), placed beside it. */
  renderAttachment?: (placement: AttachmentPlacement) => ReactNode
  /** Size of the attachment while shown, so pet + attachment stay on screen together. */
  attachmentSize?: AttachmentSize | null
  /** Where to start (top-left of the pet box); clamped to the window. */
  initialPosition?: Point | null
  /** Called once the pet has stopped moving somewhere new. */
  onRest?: (pos: Point) => void
  character?: CharacterId
}

interface Sample {
  x: number
  y: number
  t: number
}

export interface Point {
  x: number
  y: number
}

const pick = <T,>(list: T[], not?: T) => {
  const pool = list.length > 1 ? list.filter((x) => x !== not) : list
  return pool[Math.floor(Math.random() * pool.length)]
}

const clampPos = (x: number, y: number, size: number) => ({
  x: Math.min(Math.max(x, -20 * size), window.innerWidth - (PET_W - 20) * size),
  y: Math.min(Math.max(y, -40 * size), window.innerHeight - STATUS_BAR_H - (PET_H - 10) * size),
})

// ---------- attachment layout ----------
// Must match the .chat-left/right/top/bottom offsets in index.css.
const ATTACH = { overlapX: 22, bottomGap: 40, top: 70 }
const MARGIN = 8

type Side = Pick<AttachmentPlacement, 'side' | 'align'>

const viewport = () => ({ w: window.innerWidth, h: window.innerHeight - STATUS_BAR_H })

function attachRect(p: Point, size: number, att: AttachmentSize, pl: Side) {
  const W = PET_W * size
  const H = PET_H * size
  const l = pl.side === 'right' ? p.x + W - ATTACH.overlapX * size : p.x + ATTACH.overlapX * size - att.w
  const t = pl.align === 'bottom' ? p.y + H - ATTACH.bottomGap * size - att.h : p.y + ATTACH.top * size
  return { l, t, r: l + att.w, b: t + att.h }
}

/** Keep the current side if it fits, otherwise flip, otherwise take the roomier side. */
function choosePlacement(p: Point, size: number, att: AttachmentSize, prev: Side): Side {
  const vp = viewport()
  const fitsX = (side: Side['side']) => {
    const r = attachRect(p, size, att, { ...prev, side })
    return r.l >= MARGIN && r.r <= vp.w - MARGIN
  }
  const fitsY = (align: Side['align']) => {
    const r = attachRect(p, size, att, { ...prev, align })
    return r.t >= MARGIN && r.b <= vp.h - MARGIN
  }
  const otherSide = prev.side === 'right' ? 'left' : 'right'
  const otherAlign = prev.align === 'top' ? 'bottom' : 'top'
  const roomRight = vp.w - (p.x + PET_W * size)
  const roomBelow = vp.h - (p.y + PET_H * size)
  return {
    side: fitsX(prev.side) ? prev.side : fitsX(otherSide) ? otherSide : roomRight > p.x ? 'right' : 'left',
    align: fitsY(prev.align) ? prev.align : fitsY(otherAlign) ? otherAlign : roomBelow > p.y ? 'top' : 'bottom',
  }
}

/** Clamp the pet so that it and its attachment are both inside the viewport. */
function clampWithAttachment(p: Point, size: number, att: AttachmentSize | null | undefined, pl: Side): Point {
  const c = clampPos(p.x, p.y, size)
  if (!att) return c
  const vp = viewport()
  const r = attachRect(c, size, att, pl)
  const dx = r.l < MARGIN ? MARGIN - r.l : r.r > vp.w - MARGIN ? vp.w - MARGIN - r.r : 0
  const dy = r.t < MARGIN ? MARGIN - r.t : r.b > vp.h - MARGIN ? vp.h - MARGIN - r.b : 0
  return clampPos(c.x + dx, c.y + dy, size)
}

function attachMax(size: number, pl: Side) {
  const vp = viewport()
  const petW = PET_W * size
  return {
    maxW: Math.max(200, vp.w - 2 * MARGIN - (petW - (ATTACH.overlapX + 20) * size)),
    maxH: Math.max(200, vp.h - 2 * MARGIN - (pl.align === 'top' ? ATTACH.top * size - 40 * size : 0)),
  }
}

const smooth = (k: number) => k * k * (3 - 2 * k)

/** Point on a hop arc from a to b, peaking above the higher of the two. */
function arc(a: Point, b: Point, k: number): Point {
  const c = { x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - 140 }
  const u = 1 - k
  return { x: u * u * a.x + 2 * u * k * c.x + k * k * b.x, y: u * u * a.y + 2 * u * k * c.y + k * k * b.y }
}

/**
 * Like Microsoft Agent's idle levels: mostly the quiet resting loop, an occasional
 * glance once the user has been away a bit, and dozing only after a long while.
 */
function nextIdle(idleFor: number, autoHide: boolean): AnimationName {
  if (idleFor < 3) return 'idle1'
  const r = Math.random()
  if (!autoHide && idleFor > 25 && r < 0.3) return 'idle3'
  return r < (autoHide ? 0.2 : 0.35) ? 'idle2' : 'idle1'
}

export function Pet({
  ref,
  options,
  getTrayPoint,
  onAnimationChange,
  onVisibilityChange,
  onPetClick,
  renderAttachment,
  attachmentSize,
  initialPosition,
  onRest,
  character = 'terminal',
}: Props) {
  const body = useRef<HTMLDivElement>(null)
  const [frame, setFrame] = useState({ pose: BASE_POSE, time: 0, x: 0, y: 0, scale: 1, opacity: 1, side: 'right' as Side['side'], align: 'bottom' as Side['align'] })
  const [visibility, setVisibility] = useState<Visibility>('shown')
  const [speech, setSpeech] = useState<string | null>(null)

  // All mutable animation state lives in one ref so the rAF loop never re-subscribes.
  const s = useRef({
    anim: 'idle1' as AnimationName,
    animTime: 0, // seconds into the current animation (scaled by speed)
    sinceSwitch: 0, // real seconds since last switch, for blending
    from: BASE_POSE as Pose,
    last: BASE_POSE as Pose,
    clock: 0,
    idleFor: 0, // seconds spent idling since the last interaction
    visibility: 'shown' as Visibility,
    home: { x: 0, y: 0 } as Point, // where to reappear after hiding
    tray: { x: 0, y: 0 } as Point, // pet position that puts its feet on the tray icon
    queued: null as AnimationName | null,
    pos: initialPosition
      ? clampPos(initialPosition.x, initialPosition.y, options.size)
      : { x: window.innerWidth / 2 - (PET_W * options.size) / 2, y: window.innerHeight / 2 - (PET_H * options.size) / 2 - 60 },
    hold: null as AnimationName | null, // animation to loop until the next play()
    still: 0, // seconds the pet has been stationary
    reported: null as Point | null,
    vel: { x: 0, y: 0 },
    lean: 0,
    placement: { side: 'right', align: 'bottom' } as Side,
    relayout: true, // re-pick the attachment side on the next frame
    mode: 'normal' as 'normal' | 'drag' | 'glide',
    pointerOffset: { x: 0, y: 0 },
    downAt: { x: 0, y: 0 },
    moved: false,
    samples: [] as Sample[],
    speechTimer: 0 as number | undefined,
  })

  const latest = useRef({ options, getTrayPoint, onAnimationChange, onVisibilityChange, onPetClick, attachmentSize, onRest })
  useLayoutEffect(() => {
    const opened = attachmentSize && !latest.current.attachmentSize
    latest.current = { options, getTrayPoint, onAnimationChange, onVisibilityChange, onPetClick, attachmentSize, onRest }
    if (opened) s.current.relayout = true
  })

  // Resize around the feet so the pet grows/shrinks in place.
  const lastSize = useRef(options.size)
  useLayoutEffect(() => {
    const st = s.current
    const before = feetAt(lastSize.current)
    const after = feetAt(options.size)
    lastSize.current = options.size
    st.pos = clampPos(st.pos.x + before.x - after.x, st.pos.y + before.y - after.y, options.size)
    st.home = { x: st.home.x + before.x - after.x, y: st.home.y + before.y - after.y }
  }, [options.size])

  const say = (lines?: string[]) => {
    if (!lines?.length) return
    setSpeech(pick(lines))
    window.clearTimeout(s.current.speechTimer)
    s.current.speechTimer = window.setTimeout(() => setSpeech(null), 2200)
  }

  const switchTo = (name: AnimationName, withSpeech = false) => {
    const st = s.current
    st.from = st.last
    st.anim = name
    st.animTime = 0
    st.sinceSwitch = 0
    latest.current.onAnimationChange?.(name)
    if (withSpeech) say(ANIMATIONS[name].speech)
  }

  const setVis = (v: Visibility) => {
    s.current.visibility = v
    setVisibility(v)
    latest.current.onVisibilityChange?.(v)
  }

  const trayPos = (): Point => {
    const t = latest.current.getTrayPoint()
    const f = feetAt(latest.current.options.size)
    return { x: t.x - f.x, y: t.y - f.y }
  }

  const hide = () => {
    const st = s.current
    if (st.visibility !== 'shown' || st.mode !== 'normal') return
    st.home = { ...st.pos }
    st.hold = null
    st.tray = trayPos()
    setSpeech(null)
    setVis('hiding')
    switchTo('hide')
  }

  const show = () => {
    const st = s.current
    if (st.visibility !== 'hidden') return
    st.tray = trayPos()
    st.home = clampPos(st.home.x, st.home.y, latest.current.options.size)
    st.pos = { ...st.tray }
    st.idleFor = 0
    setFrame((f) => ({ ...f, x: st.pos.x, y: st.pos.y, scale: TRAY_SCALE, opacity: 0 }))
    setVis('showing')
    switchTo('show', !st.queued)
  }

  useImperativeHandle(ref, () => ({
    play: (name, { speech = true, loop = false } = {}) => {
      const st = s.current
      st.idleFor = 0
      st.hold = loop ? name : null
      if (st.visibility === 'hidden') {
        st.queued = name
        show()
      } else if (st.visibility === 'shown' && st.mode === 'normal') {
        switchTo(name, speech)
      }
    },
    focus: () => body.current?.focus(),
    hide,
    show,
    nudge: (dx, dy) => {
      const st = s.current
      st.pos = { x: st.pos.x + dx, y: st.pos.y + dy }
    },
  }))

  useEffect(() => {
    let raf = 0
    let prev = performance.now()
    const frameRef = { ...s.current.pos }

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const st = s.current
      const dt = Math.min(0.05, (now - prev) / 1000)
      prev = now
      if (st.visibility === 'hidden') return

      const opts = latest.current.options
      st.clock += dt
      st.sinceSwitch += dt
      st.animTime += dt * opts.speed

      // --- motion ---
      if (st.mode === 'drag') {
        // velocity from the last ~100ms of pointer samples; decays to 0 when the pointer rests
        const recent = st.samples.filter((p) => now - p.t < 100)
        let tx = 0
        let ty = 0
        if (recent.length >= 2) {
          const a = recent[0]
          const b = recent[recent.length - 1]
          const span = Math.max(16, b.t - a.t) / 1000
          tx = (b.x - a.x) / span
          ty = (b.y - a.y) / span
        }
        st.vel.x += (tx - st.vel.x) * 0.25
        st.vel.y += (ty - st.vel.y) * 0.25
      } else if (st.mode === 'glide') {
        st.pos.x += st.vel.x * dt
        st.pos.y += st.vel.y * dt
        const c = clampPos(st.pos.x, st.pos.y, opts.size)
        if (c.x !== st.pos.x) st.vel.x *= -0.6
        if (c.y !== st.pos.y) st.vel.y *= -0.6
        st.pos = c
        const damp = Math.exp(-3.2 * dt)
        st.vel.x *= damp
        st.vel.y *= damp
        if (Math.hypot(st.vel.x, st.vel.y) < GLIDE_STOP) {
          st.mode = 'normal'
          st.vel = { x: 0, y: 0 }
          switchTo(st.hold ?? 'idle1')
        }
      }

      // --- flying state while moving ---
      if (st.mode !== 'normal') {
        const speed = Math.hypot(st.vel.x, st.vel.y)
        if (st.anim === 'flying-fast' && speed < FAST_OFF) switchTo('flying-slow')
        else if (st.anim !== 'flying-fast' && speed > FAST_ON) switchTo('flying-fast')
        else if (st.anim !== 'flying-fast' && st.anim !== 'flying-slow') switchTo('flying-slow')
      }

      // --- keep pet + attachment on screen ---
      const att = latest.current.attachmentSize
      if (st.visibility === 'shown' && att) {
        // only re-pick the side when the pet travels, never mid-resize
        if (st.relayout || st.mode !== 'normal') st.placement = choosePlacement(st.pos, opts.size, att, st.placement)
        st.relayout = false
        const target = clampWithAttachment(st.pos, opts.size, att, st.placement)
        if (st.mode === 'normal') {
          // scoot over smoothly rather than teleporting
          const k = Math.min(1, dt * 14)
          st.pos = { x: st.pos.x + (target.x - st.pos.x) * k, y: st.pos.y + (target.y - st.pos.y) * k }
        } else {
          st.pos = target
        }
      }

      // --- report where the pet settled ---
      const moved = Math.hypot(st.pos.x - frameRef.x, st.pos.y - frameRef.y) > 0.1
      frameRef.x = st.pos.x
      frameRef.y = st.pos.y
      st.still = moved ? 0 : st.still + dt
      const r = st.reported
      if (st.visibility === 'shown' && st.mode === 'normal' && st.still > 0.4 && (!r || r.x !== st.pos.x || r.y !== st.pos.y)) {
        st.reported = { ...st.pos }
        latest.current.onRest?.(st.reported)
      }

      // --- hide / show transit ---
      let scale = 1
      let opacity = 1
      if (st.visibility === 'hiding') {
        const k = smooth(Math.min(1, Math.max(0, (st.animTime - HIDE_LEAP) / (ANIMATIONS.hide.duration - HIDE_LEAP))))
        st.pos = arc(st.home, st.tray, k)
        scale = 1 - k * (1 - TRAY_SCALE)
        opacity = 1 - Math.max(0, k - 0.8) * 5
      } else if (st.visibility === 'showing') {
        const k = smooth(Math.min(1, st.animTime / SHOW_LAND))
        st.pos = arc(st.tray, st.home, k)
        scale = TRAY_SCALE + k * (1 - TRAY_SCALE)
        opacity = Math.min(1, k * 5)
      }

      // --- idle timer ---
      const def = ANIMATIONS[st.anim]
      if (st.visibility === 'shown' && st.mode === 'normal' && def.category === 'idle') {
        st.idleFor = opts.keepAwake ? 0 : st.idleFor + dt
        if (opts.autoHide && st.idleFor >= opts.hideAfter) hide()
      }

      // --- animation sequencing ---
      if (st.animTime >= def.duration) {
        if (st.anim === 'hide') {
          setVis('hidden')
          st.pos = { ...st.home }
          switchTo('idle1')
          st.from = BASE_POSE
          return
        }
        if (st.anim === 'show') {
          setVis('shown')
          const q = st.queued
          st.queued = null
          switchTo(q ?? 'idle1', !!q)
        } else if (st.mode !== 'normal' || opts.loop || st.anim === st.hold) {
          st.animTime %= def.duration
        } else {
          st.hold = null
          switchTo(nextIdle(st.idleFor, opts.autoHide))
        }
      }

      // --- pose ---
      const cur = ANIMATIONS[st.anim]
      const ctx: MotionContext =
        st.mode !== 'normal'
          ? { vx: st.vel.x, vy: st.vel.y }
          : cur.name === 'flying-fast'
            ? { vx: 1200, vy: 0 }
            : { vx: 0, vy: 0 }
      let pose: Pose = { ...BASE_POSE, ...cur.pose(st.animTime, ctx) }

      const targetLean = cur.category === 'flying' ? Math.max(-24, Math.min(24, ctx.vx * 0.018)) : 0
      st.lean += (targetLean - st.lean) * Math.min(1, dt * 8)
      pose.rot += st.lean

      const k = Math.min(1, st.sinceSwitch / BLEND_SECONDS)
      pose = lerpPose(st.from, pose, smooth(k))
      st.last = pose

      setFrame({ pose, time: st.clock, x: st.pos.x, y: st.pos.y, scale, opacity, ...st.placement })
    }

    raf = requestAnimationFrame(tick)
    const onResize = () => (s.current.pos = clampPos(s.current.pos.x, s.current.pos.y, latest.current.options.size))
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  const onPointerDown = (e: PointerEvent) => {
    const st = s.current
    if (st.visibility !== 'shown') return
    e.currentTarget.setPointerCapture(e.pointerId)
    st.mode = 'drag'
    st.moved = false
    st.idleFor = 0
    st.vel = { x: 0, y: 0 }
    st.pointerOffset = { x: e.clientX - st.pos.x, y: e.clientY - st.pos.y }
    st.downAt = { x: e.clientX, y: e.clientY }
    st.samples = [{ x: e.clientX, y: e.clientY, t: performance.now() }]
  }

  const onPointerMove = (e: PointerEvent) => {
    const st = s.current
    if (st.mode !== 'drag') return
    if (!st.moved && Math.hypot(e.clientX - st.downAt.x, e.clientY - st.downAt.y) > 4) st.moved = true
    st.pos = clampPos(e.clientX - st.pointerOffset.x, e.clientY - st.pointerOffset.y, latest.current.options.size)
    st.samples.push({ x: e.clientX, y: e.clientY, t: performance.now() })
    if (st.samples.length > 20) st.samples.splice(0, st.samples.length - 20)
  }

  const onPointerUp = () => {
    const st = s.current
    if (st.mode !== 'drag') return
    st.idleFor = 0
    if (!st.moved) {
      st.mode = 'normal'
      const onClick = latest.current.onPetClick
      if (onClick) onClick()
      else switchTo(pick(['happy1', 'happy2', 'happy3'] as AnimationName[]), true) // poke
      return
    }
    st.mode = Math.hypot(st.vel.x, st.vel.y) > GLIDE_STOP ? 'glide' : 'normal'
    if (st.mode === 'normal') switchTo(st.hold ?? 'idle1')
  }

  const onKeyDown = (e: KeyboardEvent) => {
    const st = s.current
    if (st.visibility !== 'shown') return
    st.idleFor = 0
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (st.mode !== 'normal') return
      const onClick = latest.current.onPetClick
      if (onClick) onClick()
      else switchTo(pick(['happy1', 'happy2', 'happy3'] as AnimationName[]), true)
      return
    }
    const dirs: Record<string, Point> = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } }
    const d = dirs[e.key]
    if (!d || st.mode === 'drag') return
    e.preventDefault()
    // a little flight in that direction; Shift goes turbo
    const push = e.shiftKey ? 1300 : 450
    st.mode = 'glide'
    st.vel = { x: st.vel.x + d.x * push, y: st.vel.y + d.y * push }
  }

  if (visibility === 'hidden') return null

  const size = options.size
  const feet = feetAt(size)
  const placement: AttachmentPlacement = { side: frame.side, align: frame.align, ...attachMax(size, frame) }

  return (
    <div
      className="pet"
      style={{
        transform: `translate(${frame.x}px, ${frame.y}px) scale(${frame.scale})`,
        transformOrigin: `${feet.x}px ${feet.y}px`,
        opacity: frame.opacity,
        pointerEvents: visibility === 'shown' ? undefined : 'none',
        width: PET_W * size,
        height: PET_H * size,
        ['--pet-size' as string]: size,
      }}
    >
      <div
        ref={body}
        className="pet-body"
        role="button"
        tabIndex={visibility === 'shown' ? 0 : -1}
        aria-label={`${CHARACTERS[character].name}, your ${CHARACTERS[character].kind}. Press Enter to chat, arrow keys to fly around.`}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <PetSvg pose={frame.pose} time={frame.time} character={character} />
      </div>
      {speech && <div className="pet-speech">{speech}</div>}
      {visibility === 'shown' && renderAttachment?.(placement)}
    </div>
  )
}
