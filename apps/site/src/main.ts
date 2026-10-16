import Pet, { ANIMATIONS, ANIMATION_GROUPS, Biscuit, Pixel, Rack, STAGE_VIEWBOX, motion, renderIcon, type Animation, type Character } from '@markwylde/pet'
import { docsBot } from './docsBot'
import { highlight } from './highlight'
import { CHAT_SNIPPET, SNIPPETS } from './snippets'
import { Toasty } from './toasty'
import './style.css'

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector<T>(sel)!
const NAV_H = 64
const narrow = () => window.innerWidth < 720
const heroSize = () => (narrow() ? 1.0 : 1.45)
const perchSize = () => (narrow() ? 0.55 : 0.8)
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

// ---------- theme ----------
// The inline script in index.html sets data-theme before first paint (saved choice, else the
// OS preference). The toggle flips it, remembers the choice, and the pet's chat follows along.
const THEME_KEY = 'pet-site-theme'
type SiteTheme = 'light' | 'dark'
function currentTheme(): SiteTheme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}
function applyTheme(theme: SiteTheme) {
  document.documentElement.dataset.theme = theme
  const toggle = document.querySelector<HTMLButtonElement>('#theme-toggle')!
  const next = theme === 'dark' ? 'light' : 'dark'
  toggle.textContent = theme === 'dark' ? '☀️' : '🌙'
  toggle.setAttribute('aria-label', `Switch to ${next} mode`)
  toggle.title = `Switch to ${next} mode`
  pet?.set({ theme })
}

// ---------- custom animations used by the page ----------

/** Glance in the direction you're scrolling. */
const watch = (dir: 1 | -1): Animation => ({
  name: dir > 0 ? 'watch-down' : 'watch-up',
  category: 'idle',
  duration: 1.8,
  pose: (t) => {
    const k = motion.window(t, 0, 1.8, 0.35)
    return { lookY: dir * 4.5 * k, lookX: motion.wave(t, 0.4, 1.2), rot: dir * 3 * k, y: motion.wave(t, 0.25, 1), eyeOpen: motion.blink(t, [1.3]), antenna: -dir * 8 * k }
  },
})

/** The dance from the code sample, for real. */
const dance: Animation = {
  name: 'dance',
  category: 'happy',
  duration: 2,
  speech: ["Let's boogie!", 'Watch this!'],
  pose: (t) => ({
    x: motion.wave(t, 1, 12),
    rot: motion.wave(t, 2, 10),
    eye: 'happy',
    mouthOpen: 0.5,
    mouthCurve: 1,
    sparkles: t,
    armL: 120 + motion.wave(t, 2, 30),
    armR: 120 - motion.wave(t, 2, 30),
    legL: Math.max(0, motion.wave(t, 2, 6)),
    legR: Math.max(0, motion.wave(t, 2, 6, Math.PI)),
  }),
}

// ---------- the pet ----------

const stage = $('#stage')
const tray = $<HTMLButtonElement>('#tray')

/** Top-left of the pet's box that puts its feet in the middle of the rug. */
function stageSpot(size: number) {
  const r = stage.getBoundingClientRect()
  return { x: r.left + r.width / 2 - 90 * size, y: r.bottom - 40 - 190 * size }
}

const pet = Pet({
  character: Pixel,
  size: heroSize(),
  position: stageSpot(heroSize()),
  insets: { top: NAV_H },
  theme: currentTheme(),
  dock: () => tray,
  animations: [watch(1), watch(-1), dance],
  chat: {
    assistant: docsBot,
    greeting: "Hi! I'm a mock assistant, but I know my own docs. Ask me anything about @markwylde/pet.",
    suggestions: ['How do I install you?', 'How does streaming work?', 'Make a custom character?'],
  },
})
Object.assign(window, { pet }) // poke at it from the console

applyTheme(currentTheme())
$('#theme-toggle').addEventListener('click', () => {
  const theme = currentTheme() === 'dark' ? 'light' : 'dark'
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // storage blocked: the choice just lasts for this visit
  }
  applyTheme(theme)
  void pet.play(theme === 'dark' ? 'idle3' : 'happy1') // yawn at dusk, perk up at dawn
})
// follow the OS live until the visitor picks for themselves
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  let saved: string | null = null
  try {
    saved = localStorage.getItem(THEME_KEY)
  } catch {
    // ignore
  }
  if (!saved) applyTheme(e.matches ? 'dark' : 'light')
})

// ---------- hero → perch choreography ----------
// stage: standing on the rug, scrolling with the hero
// flying: on the way somewhere (scroll is ignored)
// perch: parked in the corner, watching you scroll
// free: someone dragged him; leave him be until he's needed elsewhere
type Mode = 'stage' | 'flying' | 'perch' | 'free'
let mode: Mode = 'stage'
let greetedPerch = false

const heroGone = () => {
  const r = stage.getBoundingClientRect()
  return r.top + r.height * 0.55 < NAV_H
}

function animateSize(to: number, ms = 260): Promise<void> {
  const from = pet.size
  if (Math.abs(from - to) < 0.01 || reducedMotion) {
    pet.set({ size: to })
    return Promise.resolve()
  }
  const start = performance.now()
  return new Promise((resolve) => {
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / ms)
      pet.set({ size: from + (to - from) * motion.easeInOut(k) })
      if (k < 1) requestAnimationFrame(step)
      else resolve()
    }
    requestAnimationFrame(step)
  })
}

async function takeOff() {
  mode = 'flying'
  $('.stage-hint').classList.add('gone')
  await animateSize(perchSize())
  const arrived = await pet.moveTo('bottom-right', { speed: 1300 })
  mode = arrived ? 'perch' : 'free'
  if (arrived && !greetedPerch) {
    greetedPerch = true
    void pet.say("I'll keep an eye on things from here 👀", { animation: false, duration: 2600 })
  }
  sync()
}

async function land() {
  mode = 'flying'
  const arrived = await pet.moveTo(stageSpot(pet.size), { speed: 1300 })
  if (arrived) await animateSize(heroSize())
  mode = arrived ? 'stage' : 'free'
  $('.stage-hint').classList.remove('gone')
  sync()
}

/** Make the pet's position match the scroll position. */
function sync() {
  if (!pet.visible || mode === 'flying') return
  const gone = heroGone()
  if (mode === 'stage') {
    if (gone) void takeOff()
    else void pet.moveTo(stageSpot(pet.size), { animate: false })
  } else if (gone && mode === 'free') {
    void takeOff()
  } else if (!gone && mode === 'perch' && window.scrollY < 40) {
    void land()
  }
}

pet.on('dragstart', () => {
  if (mode === 'stage' || mode === 'perch') mode = 'free'
})
pet.on('dragend', () => $('.stage-hint').classList.add('gone'))

// While chatting on the hero, stop pinning him to the rug so the library can keep
// him and the balloon on screen together. He hops back when the chat closes.
pet.on('chat:open', () => {
  if (mode === 'stage') mode = 'free'
})
pet.on('chat:close', () => {
  if (mode === 'free' && !heroGone()) void land()
})

// glance along with the scroll
let lastY = window.scrollY
let travel = 0
let travelTimer = 0
function watchScroll() {
  const dy = window.scrollY - lastY
  lastY = window.scrollY
  travel += dy
  window.clearTimeout(travelTimer)
  travelTimer = window.setTimeout(() => (travel = 0), 300)
  if (mode !== 'perch' || pet.chat.isOpen || Math.abs(travel) < 140) return
  if (!/^(idle|watch)/.test(pet.animation)) return
  const name = travel > 0 ? 'watch-down' : 'watch-up'
  if (pet.animation !== name) void pet.play(name)
  travel = 0
}

let ticking = false
window.addEventListener(
  'scroll',
  () => {
    $('.nav').classList.toggle('scrolled', window.scrollY > 8)
    if (ticking) return
    ticking = true
    requestAnimationFrame(() => {
      ticking = false
      sync()
      watchScroll()
    })
  },
  { passive: true },
)

window.addEventListener('resize', () => {
  if (mode === 'stage') {
    pet.set({ size: heroSize() })
    sync()
  } else if (mode === 'perch') {
    pet.set({ size: perchSize() })
    void pet.moveTo('bottom-right', { animate: false })
  }
})
// web fonts can shift the hero once they arrive
void document.fonts?.ready.then(sync)
window.addEventListener('load', sync)

// ---------- section reactions ----------

const REACTIONS: Record<string, [name: string, line: string]> = {
  features: ['happy1', 'Ooh, features! I have all of them.'],
  crew: ['happy2', 'My friends! Try one on.'],
  moods: ['busy3', 'Hover one. I dare you.'],
  code: ['busy2', 'Five lines. I counted.'],
  chat: ['idle2', 'Click me. I love a good chat!'],
  dock: ['idle3', 'Is it nap time already?'],
}
const reacted = new Set<string>()
let lastReaction = 0

const sectionObserver = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      const key = (e.target as HTMLElement).dataset.react!
      if (!e.isIntersecting || reacted.has(key)) continue
      if (mode !== 'perch' || !pet.visible || pet.chat.isOpen || pet.chat.busy) continue
      if (performance.now() - lastReaction < 3500 || !/^(idle|watch)/.test(pet.animation)) continue
      reacted.add(key)
      lastReaction = performance.now()
      const [name, line] = REACTIONS[key]
      void pet.play(name)
      void pet.say(line, { animation: false, duration: 2600 })
    }
  },
  { threshold: 0.45 },
)
document.querySelectorAll('[data-react]').forEach((s) => sectionObserver.observe(s))

// ---------- hero bits ----------

$('#say-hi').addEventListener('click', () => {
  pet.chat.open()
  void pet.play('idle2')
})

for (const id of ['#install', '#install-2']) {
  const btn = $(id)
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('npm install @markwylde/pet')
      btn.querySelector('.copied')!.textContent = 'Copied!'
      void pet.play('happy1')
    } catch {
      btn.querySelector('.copied')!.textContent = 'Select & copy ↑'
    }
    window.setTimeout(() => (btn.querySelector('.copied')!.textContent = ''), 1800)
  })
}

$('[data-icon="pixel"]').innerHTML = renderIcon(Pixel)

// ---------- crew ----------

const CREW: { character: Character; blurb: string }[] = [
  { character: Pixel, blurb: 'The original. Beige, earnest, a little bit 1986.' },
  { character: Rack, blurb: 'Quietly runs your whole house. LED face, chatty drive lights.' },
  { character: Biscuit, blurb: 'A very good boy. Ink-drawn face, ears that double as wings.' },
  { character: Toasty, blurb: 'Made on this page with defineCharacter(). Toast pops when happy.' },
]

function renderCrew() {
  $('#crew-list').replaceChildren(
    ...CREW.map(({ character, blurb }) => {
      const card = document.createElement('article')
      card.className = 'crew-card'
      if (pet.character === character) card.dataset.active = ''
      card.innerHTML = `
        <div class="crew-art">${renderIcon(character)}</div>
        <h3>${character.name}</h3>
        <span class="crew-kind">${character.kind}</span>
        <p class="crew-kind">${blurb}</p>`
      const btn = document.createElement('button')
      btn.className = 'btn btn-small'
      btn.textContent = pet.character === character ? 'On duty ✓' : `Pick ${character.name}`
      btn.addEventListener('click', () => chooseCharacter(character))
      card.append(btn)
      return card
    }),
  )
}

function chooseCharacter(character: Character) {
  if (pet.character === character) return
  pet.set({ character })
  void pet.play('happy3')
  renderCrew()
  renderMoods()
  tray.innerHTML = renderIcon(character)
}

// ---------- moods gallery ----------

const moodCards = new Map<string, HTMLElement>()

function moodFrame(name: string, t: number) {
  const anim = ANIMATIONS[name as keyof typeof ANIMATIONS]
  return renderIcon(pet.character, { pose: anim.pose(t, { vx: 1200, vy: 0 }), viewBox: STAGE_VIEWBOX })
}

function renderMoods() {
  const grid = $('#moods-grid')
  if (!moodCards.size) {
    for (const group of ANIMATION_GROUPS) {
      for (const name of group.names) {
        const card = document.createElement('button')
        card.className = 'mood'
        card.innerHTML = `<div class="mood-art"></div><span class="mood-name">${name}</span><span class="mood-cat">${group.category}</span>`
        card.setAttribute('aria-label', `Play ${name}`)
        let raf = 0
        const art = card.querySelector<HTMLElement>('.mood-art')!
        const start = () => {
          if (reducedMotion || raf) return
          const t0 = performance.now()
          const loop = (now: number) => {
            art.innerHTML = moodFrame(name, ((now - t0) / 1000) % ANIMATIONS[name].duration)
            raf = requestAnimationFrame(loop)
          }
          raf = requestAnimationFrame(loop)
        }
        const stop = () => {
          cancelAnimationFrame(raf)
          raf = 0
          art.innerHTML = moodFrame(name, ANIMATIONS[name].duration * 0.35)
        }
        card.addEventListener('pointerenter', start)
        card.addEventListener('pointerleave', stop)
        card.addEventListener('focus', start)
        card.addEventListener('blur', stop)
        card.addEventListener('click', () => void pet.play(name, { speech: true }))
        moodCards.set(name, card)
        grid.append(card)
      }
    }
  }
  for (const [name, card] of moodCards) card.querySelector('.mood-art')!.innerHTML = moodFrame(name, ANIMATIONS[name as keyof typeof ANIMATIONS].duration * 0.35)
}

// ---------- code tabs ----------

/** Run a little scene, keeping the scroll choreography out of the way. */
async function scene(run: () => Promise<unknown>) {
  if (mode === 'flying') return
  mode = 'flying'
  try {
    await run()
  } finally {
    mode = 'free'
    sync()
    if (mode === 'free' && heroGone()) void takeOff()
  }
}

const RUNNERS: Record<string, () => void> = {
  vanilla: () =>
    void scene(async () => {
      if (!(await pet.moveTo('center'))) return
      await pet.play('happy')
      await pet.say('Hello there!')
    }),
  react: () => {
    void pet.play('happy3')
    void pet.say('Same pet, now in JSX.', { animation: false })
  },
  animation: () => void pet.play('dance', { speech: true }),
  character: () => {
    chooseCharacter(pet.character === Toasty ? Pixel : Toasty)
    void pet.say(pet.character === Toasty ? 'Toast is ready!' : 'Back to beige.', { animation: false })
  },
}

let currentSnippet = SNIPPETS[0]
function showSnippet(id: string) {
  currentSnippet = SNIPPETS.find((s) => s.id === id)!
  $('#code-body').innerHTML = highlight(currentSnippet.code)
  $('#code-note').textContent = currentSnippet.note
  for (const tab of document.querySelectorAll<HTMLElement>('.tab')) tab.setAttribute('aria-selected', String(tab.dataset.id === id))
}

$('#code-tabs').replaceChildren(
  ...SNIPPETS.map((s) => {
    const tab = document.createElement('button')
    tab.className = 'tab'
    tab.role = 'tab'
    tab.dataset.id = s.id
    tab.textContent = s.label
    tab.addEventListener('click', () => showSnippet(s.id))
    return tab
  }),
)
showSnippet('vanilla')
$('#code-run').addEventListener('click', () => RUNNERS[currentSnippet.id]())

$('#chat-code').innerHTML = highlight(CHAT_SNIPPET)
$('#open-chat').addEventListener('click', () => {
  pet.chat.open()
  if (!pet.chat.messages.length) void pet.chat.send('How does streaming work?')
})

// ---------- dock ----------

tray.innerHTML = renderIcon(pet.character)
$('#tuck').addEventListener('click', () => void pet.hide({ to: tray }))
tray.addEventListener('click', () => void pet.toggle())
pet.on('hide', () => (tray.dataset.docked = ''))
pet.on('show', () => {
  delete tray.dataset.docked
  void pet.say('Morning! ☀️', { animation: false, duration: 1600 })
})

const clock = () => ($('#fake-clock').textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
clock()
window.setInterval(clock, 15_000)

// ---------- footer ----------

$('#footer-pets').innerHTML = [Pixel, Rack, Biscuit, Toasty].map((c) => `<span title="${c.name}">${renderIcon(c)}</span>`).join('')

renderCrew()
renderMoods()
sync()
