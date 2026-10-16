import { useEffect, useState } from 'react'

const PREFIX = 'pixel.'

/** Read a saved value; falls back when storage is unavailable, empty or the wrong shape. */
export function loadSaved<T>(key: string, fallback: T, valid: (v: unknown) => v is T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw != null) {
      const v: unknown = JSON.parse(raw)
      if (valid(v)) return v
    }
  } catch {
    // private mode, blocked storage or bad JSON: use the fallback
  }
  return fallback
}

export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // storage unavailable; the value just won't survive a reload
  }
}

/** useState that survives reloads via localStorage. */
export function usePersistentState<T>(key: string, fallback: T, valid: (v: unknown) => v is T) {
  const [value, setValue] = useState(() => loadSaved(key, fallback, valid))
  useEffect(() => save(key, value), [key, value])
  return [value, setValue] as const
}

export const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
export const isBoolean = (v: unknown): v is boolean => typeof v === 'boolean'
export const isPoint = (v: unknown): v is { x: number; y: number } =>
  typeof v === 'object' && v !== null && isNumber((v as { x: unknown }).x) && isNumber((v as { y: unknown }).y)
export const isSize = (v: unknown): v is { w: number; h: number } =>
  typeof v === 'object' && v !== null && isNumber((v as { w: unknown }).w) && isNumber((v as { h: unknown }).h)
