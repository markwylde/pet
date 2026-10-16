/** A minimal typed event emitter. */
export class Emitter<Events extends object> {
  private handlers = new Map<keyof Events, Set<(payload: never) => void>>()

  on<K extends keyof Events>(event: K, handler: (payload: Events[K]) => void): () => void {
    let set = this.handlers.get(event)
    if (!set) this.handlers.set(event, (set = new Set()))
    set.add(handler as (payload: never) => void)
    return () => this.off(event, handler)
  }

  off<K extends keyof Events>(event: K, handler: (payload: Events[K]) => void): void {
    this.handlers.get(event)?.delete(handler as (payload: never) => void)
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    for (const handler of [...(this.handlers.get(event) ?? [])]) {
      try {
        ;(handler as (payload: Events[K]) => void)(payload)
      } catch (err) {
        // one bad listener must not break the pet's animation loop
        console.error(`[@markwylde/pet] "${String(event)}" listener threw:`, err)
      }
    }
  }

  clear(): void {
    this.handlers.clear()
  }
}
