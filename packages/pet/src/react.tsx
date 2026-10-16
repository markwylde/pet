/**
 * React bindings for @markwylde/pet.
 *
 * @example
 * import { Pet } from '@markwylde/pet/react'
 * import { Rack } from '@markwylde/pet'
 *
 * <Pet character={Rack} size={0.8} onClick={() => console.log('hi')} />
 *
 * @packageDocumentation
 */
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, type CSSProperties, type ForwardedRef } from 'react'
import { createPet } from './pet.js'
import { renderIcon, type IconOptions } from './render/index.js'
import type { Character } from './characters/types.js'
import type { PetEvents, PetInstance, PetOptions, UpdatableOptions } from './types.js'

type Handlers = {
  [K in keyof PetEvents as `on${Capitalize<K extends `chat:${infer R}` ? `chat${Capitalize<R>}` : K>}`]?: (payload: PetEvents[K]) => void
}

/**
 * Props are the {@link PetOptions} plus an `on…` prop per event:
 * `onClick`, `onAnimationstart`, `onAnimationend`, `onShow`, `onHide`, `onDragstart`,
 * `onDragend`, `onMove`, `onChatOpen`, `onChatClose`, `onChatMessage`, `onChatAction`.
 */
export type PetProps = PetOptions & Handlers

const EVENTS: [keyof Handlers, keyof PetEvents][] = [
  ['onClick', 'click'],
  ['onAnimationstart', 'animationstart'],
  ['onAnimationend', 'animationend'],
  ['onShow', 'show'],
  ['onHide', 'hide'],
  ['onDragstart', 'dragstart'],
  ['onDragend', 'dragend'],
  ['onMove', 'move'],
  ['onChatOpen', 'chat:open'],
  ['onChatClose', 'chat:close'],
  ['onChatMessage', 'chat:message'],
  ['onChatAction', 'chat:action'],
]

const UPDATABLE = ['character', 'size', 'speed', 'insets', 'zIndex', 'draggable', 'keyboard', 'autoHide', 'dock', 'theme', 'label', 'chat'] as const

/**
 * Create a pet for the lifetime of the component. Options listed in {@link UpdatableOptions}
 * are applied live when they change; the rest are read once, on mount.
 * Returns the instance, or `null` until it has mounted (and during SSR).
 */
// oxlint-disable-next-line only-export-components -- a library entry, not a hot-reloaded module
export function usePet(options: PetProps = {}): PetInstance | null {
  const [pet, setPet] = useState<PetInstance | null>(null)
  const latest = useRef(options)
  useEffect(() => {
    latest.current = options
  })

  useEffect(() => {
    const instance = createPet(latest.current)
    const offs = EVENTS.map(([prop, event]) =>
      instance.on(event, ((payload: unknown) => (latest.current[prop] as ((p: unknown) => void) | undefined)?.(payload)) as never),
    )
    setPet(instance)
    return () => {
      offs.forEach((off) => off())
      instance.destroy()
      setPet(null)
    }
  }, [])

  // push changed live options into the instance
  const prevRef = useRef<Partial<PetProps>>({})
  useEffect(() => {
    if (!pet) return
    const changes: UpdatableOptions = {}
    let changed = false
    for (const key of UPDATABLE) {
      if (options[key] !== prevRef.current[key]) {
        ;(changes as Record<string, unknown>)[key] = options[key]
        changed = true
      }
    }
    prevRef.current = { ...options }
    if (changed) pet.set(changes)
  })

  return pet
}

/**
 * Declarative pet. Renders nothing itself — the pet lives in a fixed layer over the page.
 * Pass a `ref` to get the {@link PetInstance} and call `play()`, `say()`, `moveTo()`…
 */
export const Pet = forwardRef(function Pet(props: PetProps, ref: ForwardedRef<PetInstance | null>) {
  const pet = usePet(props)
  useImperativeHandle(ref, () => pet as PetInstance, [pet])
  return null
})

export interface PetIconProps extends IconOptions {
  character: Character
  className?: string
  style?: CSSProperties
}

/** A static picture of a character, e.g. for a picker or a dock button. Size it with CSS. */
export function PetIcon({ character, className, style, pose, viewBox, title }: PetIconProps) {
  const html = useMemo(() => renderIcon(character, { pose, viewBox, title }), [character, pose, viewBox, title])
  return <span className={className} style={{ display: 'inline-block', ...style }} dangerouslySetInnerHTML={{ __html: html }} />
}

export type { PetInstance, PetOptions } from './types.js'
