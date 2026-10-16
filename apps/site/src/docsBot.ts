import type { AnimationName, Assistant } from '@markwylde/pet'

/** A pretend assistant that knows the README. It streams a canned answer word by word. */

interface Rule {
  match: RegExp
  mood: AnimationName
  reply: string
}

const RULES: Rule[] = [
  {
    match: /\b(hi|hello|hey|yo|howdy)\b/i,
    mood: 'idle2',
    reply: "Hey! I'm a mock assistant on this page, but I know my own docs. Ask me how to install me, stream replies, dock me, or make a custom character.",
  },
  {
    match: /\b(install|npm|start|setup|get started|use)\b/i,
    mood: 'happy1',
    reply: "Easy:\n\nnpm install @markwylde/pet\n\nimport Pet, { Pixel } from '@markwylde/pet'\nconst pet = Pet({ character: Pixel })\n\nThat's it. I'll show up in the bottom-right corner.",
  },
  {
    match: /\b(stream|assistant|ai|llm|chat|reply|replies|openai|claude|model)\b/i,
    mood: 'busy2',
    reply: "Pass chat: { assistant } where assistant(messages, { signal }) returns a string, a promise, or an async iterable of chunks. Yield text as it arrives and I'll talk while it streams. Yield { mood: 'happy' } at the end to choose my reaction. Keep your API keys on your server!",
  },
  {
    match: /\b(react|jsx|hook|component)\b/i,
    mood: 'happy3',
    reply: "import { Pet } from '@markwylde/pet/react'\n\n<Pet ref={pet} character={Rack} size={0.8} onClick={…} />\n\nOptions are props, events are on… props, and size, character and chat update live.",
  },
  {
    match: /\b(dock|hide|tray|nap|sleep|auto ?hide)\b/i,
    mood: 'idle3',
    reply: "Give me a dock (any element) and I'll dive into it on hide(). Add autoHide: 10_000 and I'll tuck myself in after 10 idle seconds. Click the dock to wake me with show().",
  },
  {
    match: /\b(animation|animations|mood|moods|dance|custom anim)\b/i,
    mood: 'happy2',
    reply: "Animations are pure functions of time: pose: (t) => ({ rot: motion.wave(t, 2, 8), eye: 'happy' }). Register them with the animations option and play them by name, or by category like play('happy').",
  },
  {
    match: /\b(character|characters|toasty|rack|custom|define)\b/i,
    mood: 'happy1',
    reply: "defineCharacter({ id, name, palette, body }) and you're done. The body function draws whatever sits behind my screen, and it runs every frame, so it can animate. Toasty's toast pops up when he's happy!",
  },
  {
    match: /\b(keyboard|accessib|a11y|screen reader)\b/i,
    mood: 'idle2',
    reply: "Tab to me, Enter or Space to click, arrow keys to fly (Shift for turbo), Esc to close the chat. I'm labelled for screen readers, and replies are announced when they finish.",
  },
  {
    match: /\b(size|big|small|bigger|smaller|resize)\b/i,
    mood: 'happy3',
    reply: "pet.set({ size: 1.5 }) and I grow in place, around my feet. 1 means a 180 × 220 px box.",
  },
  { match: /\b(joke|funny)\b/i, mood: 'happy1', reply: "Why did the desktop pet go to therapy? Too many unresolved promises." },
  { match: /\b(license|free|cost|price)\b/i, mood: 'happy2', reply: 'MIT licensed and free forever. I only ask for the occasional head pat.' },
  { match: /\b(thanks|thank you|love|cute)\b/i, mood: 'happy2', reply: 'Aww. You just made my pixels glow.' },
]

const FALLBACK =
  "Ooh, good question. I'm only a mock here, so try asking about installing, streaming replies, React, docking, animations or custom characters."

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason)
    const id = setTimeout(resolve, ms)
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(id)
        reject(signal.reason)
      },
      { once: true },
    )
  })
}

export const docsBot: Assistant = async function* (messages, { signal }) {
  const last = [...messages].reverse().find((m) => m.role === 'user')?.text ?? ''
  const rule = RULES.find((r) => r.match.test(last))
  await sleep(600 + Math.random() * 700, signal)
  yield { mood: rule?.mood ?? 'idle2' }
  for (const word of (rule?.reply ?? FALLBACK).split(/(?<=\s)/)) {
    yield word
    await sleep(/[.!?]\s*$/.test(word) ? 200 : /\n/.test(word) ? 120 : 30 + Math.random() * 40, signal)
  }
}
