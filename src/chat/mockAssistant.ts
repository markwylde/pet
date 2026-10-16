import type { AnimationName } from '../pet/animations'

export interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  text: string
}

export interface AssistantReply {
  text: string
  /** Animation the pet plays while delivering the reply. */
  mood: AnimationName
}

/** Swap this for a real model call later; the chat only depends on this shape. */
export type Assistant = (history: ChatMessage[]) => Promise<AssistantReply>

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

export const mockAssistant: Assistant = async (history) => {
  const last = [...history].reverse().find((m) => m.role === 'user')?.text ?? ''
  const rule = RULES.find((r) => r.match.test(last))
  await new Promise((r) => setTimeout(r, 900 + Math.random() * 1100))
  return rule ? { text: pick(rule.replies), mood: rule.mood } : { text: pick(FALLBACK), mood: 'idle2' }
}
