import type { AnimationName } from '../pet/animations'

export interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  text: string
}

export type AssistantEvent =
  | { type: 'mood'; mood: AnimationName } // how Pixel should feel once the reply is done
  | { type: 'text'; delta: string } // next chunk of the reply

/**
 * Streams a reply for the conversation so far. Swap this for a real model call later;
 * the chat only depends on this shape. Must stop (throwing an AbortError) when `signal` aborts.
 */
export type Assistant = (history: ChatMessage[], signal: AbortSignal) => AsyncIterable<AssistantEvent>

interface Rule {
  match: RegExp
  replies: string[]
  mood: AnimationName
}

const RULES: Rule[] = [
  { match: /\b(hi|hello|hey|yo|howdy)\b/i, mood: 'idle2', replies: ['Hey there! What can I help you with?', 'Hello! Ask me anything.'] },
  { match: /\b(joke|funny|laugh)\b/i, mood: 'happy1', replies: ['Why do programmers prefer dark mode? Because light attracts bugs.', 'I told my CRT a joke. It had a great reaction time… eventually.', "There are 10 kinds of people: those who get binary and those who don't."] },
  { match: /\b(thanks|thank you|cheers|ty|love)\b/i, mood: 'happy2', replies: ['Aww, anytime!', 'You just made my pixels glow.'] },
  { match: /\b(sad|bad day|tired|upset|broke|failed|error)\b/i, mood: 'sad1', replies: ["Oh no, that's rough. Want to talk it through?", "Sorry to hear that. I'm here if you need me."] },
  { match: /\b(code|bug|compile|build|deploy|typescript|react)\b/i, mood: 'busy2', replies: ["Ooh, code! Once I'm hooked up to a real brain I'll dig into that properly. For now: have you tried turning it off and on again?", 'Let me compile my thoughts… done. Check your imports first, it is always the imports.'] },
  { match: /\b(what can you do|help|who are you|what are you)\b/i, mood: 'happy3', replies: ["I'm Pixel, your desktop terminal buddy! Right now my answers are mocked, but soon I'll answer real questions. You can drag me, throw me, and I'll nap in the tray when you're busy."] },
  { match: /\b(hide|tray|sleep|go away)\b/i, mood: 'idle3', replies: ['Leave me alone for 10 seconds and I will curl up in the tray. Click the tray icon to wake me.'] },
  { match: /\b(weather|rain)\b/i, mood: 'sad3', replies: ["I can't see outside yet, but my forecast says: 100% chance of cloud over my head."] },
]

const FALLBACK = [
  "Hmm, good question! I'm only running on mock answers for now, but I'm noting that one down.",
  "Interesting! Once I'm connected to a real assistant I'll have a proper answer for that.",
  "Beep boop… my mock brain doesn't know that one yet. Try asking for a joke?",
]

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)]

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'))
    const id = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(id)
      reject(new DOMException('Aborted', 'AbortError'))
    }, { once: true })
  })
}

export const mockAssistant: Assistant = async function* (history, signal) {
  const last = [...history].reverse().find((m) => m.role === 'user')?.text ?? ''
  const rule = RULES.find((r) => r.match.test(last))
  const text = rule ? pick(rule.replies) : pick(FALLBACK)

  await sleep(700 + Math.random() * 900, signal) // "thinking"
  yield { type: 'mood', mood: rule?.mood ?? 'idle2' }

  // stream word by word, pausing a little longer after punctuation
  for (const word of text.split(/(?<=\s)/)) {
    yield { type: 'text', delta: word }
    await sleep(/[.!?…]\s*$/.test(word) ? 260 : /[,:;]\s*$/.test(word) ? 140 : 45 + Math.random() * 45, signal)
  }
}
