/**
 * localStorage access that never throws: private windows, blocked storage and bad JSON
 * all just behave like "nothing saved".
 */
export interface Store {
  get<T>(key: string, valid: (v: unknown) => v is T): T | undefined
  set(key: string, value: unknown): void
  remove(key: string): void
}

const noop: Store = { get: () => undefined, set: () => {}, remove: () => {} }

export function createStore(prefix: string | false | undefined): Store {
  if (!prefix || typeof localStorage === 'undefined') return noop
  const full = (key: string) => `${prefix}:${key}`
  return {
    get(key, valid) {
      try {
        const raw = localStorage.getItem(full(key))
        if (raw == null) return undefined
        const v: unknown = JSON.parse(raw)
        return valid(v) ? v : undefined
      } catch {
        return undefined
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(full(key), JSON.stringify(value))
      } catch {
        // storage full or unavailable: the value just won't survive a reload
      }
    },
    remove(key) {
      try {
        localStorage.removeItem(full(key))
      } catch {
        // ignore
      }
    },
  }
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
export const isPoint = (v: unknown): v is { x: number; y: number } =>
  typeof v === 'object' && v !== null && isNum((v as { x: unknown }).x) && isNum((v as { y: unknown }).y)
export const isSize = (v: unknown): v is { width: number; height: number } =>
  typeof v === 'object' && v !== null && isNum((v as { width: unknown }).width) && isNum((v as { height: unknown }).height)
