# @markwylde/pet

Little animated pets for your apps: web apps, desktop apps built on web tech (Electron, Tauri)
and plain websites. Drop one in: it idles, blinks, flies around when you drag it, naps in a dock when
you leave it alone, and chats with you through any AI backend you plug in.

- **Zero dependencies.** Plain DOM + SVG, works with any framework (or none). Optional React bindings.
- **Characters.** Ships with **Pixel** (a beige CRT terminal) and **Rack** (a home server with an LED face). Define your own.
- **17 animations** (idle, happy, sad, busy, flying, talking…) that blend smoothly into each other, plus your own.
- **Promise-based actions.** `await pet.moveTo('center'); await pet.play('happy'); await pet.say('Hi!')`
- **Chat balloon** with streaming replies: the pet thinks, then talks while the text arrives.
- **Accessible.** Keyboard-operable, labelled for screen readers, follows the colour scheme, and only plays the calm resting idle under `prefers-reduced-motion`.
- **Typed.** Written in TypeScript, every option and method documented.

```ts
import Pet, { Pixel } from '@markwylde/pet'

const pet = Pet({ character: Pixel, size: 0.8 })

await pet.moveTo('center')
await pet.play('happy')
pet.say('Hello there!')
```

## Contents

- [Install](#install)
- [Quick start](#quick-start)
- [React](#react)
- [Recipes](#recipes): [sequencing](#sequencing-actions) · [chat & AI](#chat-and-ai) · [docking](#docking-and-auto-hide) · [persisting](#remembering-state) · [events](#events) · [theming](#theming) · [custom animations](#custom-animations) · [custom characters](#custom-characters)
- [API reference](#api-reference)
- [Animations](#animations)

## Install

```sh
npm install @markwylde/pet
```

The package is ESM-only and runs in the browser. React is an optional peer dependency, needed only for `@markwylde/pet/react`.

## Quick start

```ts
import Pet, { Rack } from '@markwylde/pet'

const pet = Pet({
  character: Rack, // or Pixel (the default)
  size: 1, // 1 = 180 × 220 px
  position: 'bottom-right',
})

pet.play('happy') // a random "happy" animation
pet.play('busy2', { loop: true }) // keep typing until told otherwise
pet.stop() // back to idling
```

People can drag the pet, throw it (it glides and bounces off the edges), click it, and focus it with
<kbd>Tab</kbd>. Arrow keys fly it around and <kbd>Shift</kbd> goes turbo.

When you're done, `pet.destroy()` removes it from the page.

## React

```tsx
import { Pixel, type PetInstance } from '@markwylde/pet'
import { Pet, PetIcon } from '@markwylde/pet/react'
import { useRef } from 'react'

export function App() {
  const pet = useRef<PetInstance>(null)
  return (
    <>
      <button onClick={() => pet.current?.play('happy')}>Cheer up</button>
      <Pet ref={pet} character={Pixel} size={0.8} onClick={() => console.log('poked!')} />
    </>
  )
}
```

- `<Pet>` renders nothing in place. The pet lives in a fixed layer over the page. Its props are the
  [options](#options) plus one `on…` prop per [event](#events): `onClick`, `onAnimationstart`,
  `onAnimationend`, `onShow`, `onHide`, `onDragstart`, `onDragend`, `onMove`, `onChatOpen`,
  `onChatClose`, `onChatMessage`.
- Changing an [updatable option](#petsetoptions) such as `size`, `character` or `chat` applies it
  live. Other options are read once, on mount.
- `usePet(options)` is the hook version. It returns the instance, or `null` before mount.
- `<PetIcon character={Rack} />` draws a static picture, which suits pickers and dock buttons.

Keep object props stable (define them outside the component or memoise them). Each new
object counts as a change.

## Recipes

### Sequencing actions

Every action returns a promise. A newer action interrupts an older one, and an interrupted
action resolves `false`, so a script stops cleanly when the user grabs the pet:

```ts
async function tour() {
  if (!(await pet.moveTo('top-right'))) return // the user dragged it away
  await pet.say('I can fly anywhere!')
  await pet.moveTo('center', { speed: 1600 }) // fast enough for flying-fast
  await pet.play('happy3')
}
```

### Chat and AI

Give the pet an `assistant` and clicking it opens a chat balloon. The assistant gets the
conversation and returns a reply. A reply can be a string, a promise of one, or an **async
iterable** that streams chunks:

```ts
import Pet, { type Assistant } from '@markwylde/pet'

const assistant: Assistant = async function* (messages, { signal, character }) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ persona: character.name, messages }),
    signal, // aborted when the user presses Stop
  })
  const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader()
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    yield value
  }
  yield { mood: 'happy' } // optional: how the pet reacts once the reply is done
}

const pet = Pet({
  chat: {
    assistant,
    suggestions: ['What can you do?', 'Tell me a joke'],
  },
})
```

While it waits for the first chunk the pet plays `busy1`. While chunks arrive it plays `talk`.
Afterwards it plays the `{ mood }` you yielded, either an animation or a category. Errors
become a friendly message and a sad face.

> Keep API keys on your server. Use the `assistant` function to call your own backend, which
> then talks to the model provider.

You can also drive the chat from code: `pet.chat.open()`, `pet.chat.send('hi')`,
`pet.chat.stop()`, `pet.chat.clear()`, `pet.chat.messages`.

### Docking and auto-hide

`hide()` makes the pet dive into a **dock**: any element (it lands in the centre, like a tray
icon), a point, or a function that returns one. Without a dock it shrinks away on the spot.
`show()` brings it back to where it was.

```ts
const pet = Pet({
  dock: () => document.querySelector('#tray-icon'),
  autoHide: 10_000, // hide after 10 s of idling; the chat being open keeps it awake
  insets: { bottom: 44 }, // stay above a 44 px status bar
})

trayIcon.addEventListener('click', () => pet.toggle())
```

`play()` on a hidden pet brings it out first.

### Remembering state

```ts
Pet({ persist: 'my-app-pet' })
```

This saves the position, the chat size and the chat history in `localStorage` under that key. If
storage is unavailable (private mode, blocked), the pet works normally without saving.

### Events

```ts
const off = pet.on('animationstart', ({ name }) => console.log('now playing', name))
pet.on('move', ({ position }) => console.log('settled at', position))
pet.on('click', (e) => {
  e.preventDefault() // skip the default (open chat / poke)
  openMyOwnPanel()
})
off() // unsubscribe
```

See [`PetEvents`](#events-1) for the full list.

### Theming

The chat and speech bubbles follow the OS colour scheme (`theme: 'auto'`). You can force one with
`theme: 'light' | 'dark'`. Restyle them with CSS custom properties:

```css
.mwpet {
  --mwpet-accent: #e0608a;
  --mwpet-radius: 8px;
  --mwpet-font: 'Inter', sans-serif;
}
```

Variables: `--mwpet-surface`, `--mwpet-text`, `--mwpet-muted`, `--mwpet-border`, `--mwpet-soft`,
`--mwpet-field`, `--mwpet-accent`, `--mwpet-accent-text`, `--mwpet-online`, `--mwpet-radius`,
`--mwpet-font`, `--mwpet-shadow`.

The stylesheet is injected automatically. Under a strict CSP, pass `injectStyles: false` and
ship the exported `css` string yourself.

### Custom animations

An animation is a pure function of time that returns the parts of the [pose](#the-pose) to change.
Blending, leaning and rendering are handled for you.

```ts
import Pet, { motion, type Animation } from '@markwylde/pet'

const dance: Animation = {
  name: 'dance',
  category: 'happy', // also eligible for pet.play('happy')
  duration: 2,
  speech: ['Let’s boogie!'],
  pose: (t) => ({
    x: motion.wave(t, 1, 10), // sway 10 px at 1 Hz
    rot: motion.wave(t, 2, 8),
    eye: 'happy',
    mouthOpen: 0.5,
    armL: 120 + motion.wave(t, 2, 30),
    armR: 120 - motion.wave(t, 2, 30),
    sparkles: t,
  }),
}

const pet = Pet({ animations: [dance] })
pet.play('dance', { speech: true })
```

`motion` provides `wave`, `blink`, `seg`, `window`, `clamp` and `easeInOut`.

### Custom characters

Every character shares one skeleton (screen face, arms, legs, antenna, effects), so a
character only needs colours, attachment points and a body drawn behind the screen:

```ts
import Pet, { defineCharacter } from '@markwylde/pet'

const Toasty = defineCharacter({
  id: 'toasty',
  name: 'Toasty',
  kind: 'kitchen helper',
  face: 'crt', // or 'matrix' for an LED face
  palette: { phosphor: '#ffb86b', phosphorDim: '#a8662a', screenInner: '#3a1d0b', screenOuter: '#160902' },
  body: ({ h, url }) =>
    h('rect', { x: -60, y: -142, width: 120, height: 110, rx: 30, fill: '#d6d9de', stroke: '#8a8f99', strokeWidth: 2.5 }) +
    h('rect', { x: -47, y: -129, width: 94, height: 76, rx: 12, fill: '#3b3f47' }) +
    h('circle', { cx: 40, cy: -44, r: 3, fill: '#ffb86b', filter: url('glow') }),
})

Pet({ character: Toasty })
```

**Drawing space:** the feet sit at `(0, 0)` and the body grows upward (negative y). The screen
is the rectangle x −42…42, y −124…−58, so draw a bezel around x −47…47, y −129…−53. The body
function runs every frame and gets the current `pose` and `time`, so it can animate (Rack's
drive lights do). It also gets `id()` / `url()` to namespace gradient ids. `limbs`, `anchors`,
`effectsOffsetY` and `iconViewBox` all have defaults matching Pixel's proportions.

## API reference

### `Pet(options?)` / `createPet(options?)`

Creates a pet, mounts it, and returns a [`PetInstance`](#petinstance). `Pet` and the default
export are aliases of `createPet`. It throws when called outside a browser, so in SSR apps call it
on the client (e.g. in `useEffect`), or use the React bindings.

#### Options

| Option          | Type                                  | Default            | Description                                                                                     |
| --------------- | ------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------- |
| `character`     | `Character`                           | `Pixel`            | Which character to show.                                                                        |
| `size`          | `number`                              | `1`                | Scale; `1` is a 180 × 220 px box.                                                               |
| `speed`         | `number`                              | `1`                | Animation speed multiplier.                                                                     |
| `position`      | `Position`                            | `'bottom-right'`   | First position: `'center'`, `'top-left'`, `'top-right'`, `'bottom-left'`, `'bottom-right'` or `{ x, y }`. |
| `container`     | `HTMLElement`                         | `document.body`    | Where the pet is mounted. It's `position: fixed`, so it always moves in viewport coordinates.   |
| `insets`        | `{ top?, right?, bottom?, left? }`    | `{}`               | Viewport edges to keep clear.                                                                   |
| `zIndex`        | `number`                              | `2147483000`       | Stacking order.                                                                                 |
| `draggable`     | `boolean`                             | `true`             | Allow dragging and throwing.                                                                    |
| `keyboard`      | `boolean`                             | `true`             | Focusable; Enter/Space click, arrow keys fly.                                                   |
| `autoHide`      | `number \| false`                     | `false`            | Hide after this many ms of idling.                                                              |
| `dock`          | `DockTarget`                          | none               | Where `hide()` goes: an element, a point, or a function returning one.                          |
| `hidden`        | `boolean`                             | `false`            | Start hidden.                                                                                   |
| `theme`         | `'auto' \| 'light' \| 'dark'`         | `'auto'`           | Colour scheme of the chat and speech bubbles.                                                   |
| `persist`       | `string \| false`                     | `false`            | localStorage key for position, chat size and history.                                           |
| `animations`    | `Animation[]`                         | `[]`               | Extra (or overriding) animations.                                                               |
| `chat`          | `ChatOptions \| false`                | `false`            | Enable the chat balloon.                                                                        |
| `label`         | `string`                              | name + kind        | Accessible name.                                                                                |
| `injectStyles`  | `boolean`                             | `true`             | Inject the default stylesheet.                                                                  |

#### `ChatOptions`

| Option              | Type             | Default                          | Description                                   |
| ------------------- | ---------------- | -------------------------------- | --------------------------------------------- |
| `assistant`         | `Assistant`      | required                         | Produces replies (see [Chat and AI](#chat-and-ai)). |
| `title`             | `string`         | character name                   | Header title.                                 |
| `greeting`          | `string`         | "Hi! I'm {name}. Ask me anything." | Shown while the conversation is empty.      |
| `suggestions`       | `string[]`       | `[]`                             | Quick-reply chips for an empty conversation.  |
| `placeholder`       | `string`         | "Ask {name}…"                    | Input placeholder.                            |
| `openOnClick`       | `boolean`        | `true`                           | Clicking the pet toggles the chat.            |
| `size`              | `{ width, height }` | `320 × 380`                   | Initial balloon size.                         |
| `resizable`         | `boolean`        | `true`                           | Resize from the corners.                      |
| `thinkingAnimation` | `AnimationName`  | `'busy1'`                        | Looped while waiting for the first chunk.     |
| `talkingAnimation`  | `AnimationName`  | `'talk'`                         | Looped while a reply streams in.              |

### `PetInstance`

| Member                         | Description                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------- |
| `play(name, { loop?, speech? })` | Play an animation, or a random one from a category. Resolves `true` when finished, `false` if interrupted. `speech: true` shows one of the animation's lines; a string shows that text. |
| `stop()`                       | Stop what's playing (and any flight) and go back to idling.                                       |
| `say(text, { duration?, animation? })` | Speech bubble while talking. `animation: false` keeps the current animation. Resolves when the bubble goes away. |
| `moveTo(position, { animate?, speed? })` | Fly to a `Position` (named or `{ x, y }`). Resolves `true` on arrival.               |
| `moveBy(dx, dy, options?)`     | Fly by an offset.                                                                                 |
| `show()` / `hide({ to? })` / `toggle()` | Come out of / dive into the dock. Resolve when the transition ends.                      |
| `set(options)`                 | Change `character`, `size`, `speed`, `insets`, `zIndex`, `draggable`, `keyboard`, `autoHide`, `dock`, `theme`, `label` or `chat` live. |
| `focus()`                      | Move keyboard focus to the pet.                                                                   |
| `on(event, handler)` / `off(event, handler)` | Subscribe / unsubscribe. `on` returns an unsubscribe function.                      |
| `destroy()`                    | Remove the pet and release everything it holds.                                                   |
| `chat`                         | [`PetChat`](#petchat). A no-op stand-in when chat is disabled.                                    |
| `element`                      | The root element.                                                                                 |
| `state`                        | `'shown' \| 'hiding' \| 'hidden' \| 'showing'`.                                                   |
| `visible`                      | `true` unless hidden or hiding.                                                                   |
| `animation`                    | Name of the current animation.                                                                    |
| `position`                     | Top-left of the pet's box in viewport px.                                                         |
| `character`, `size`            | Current values.                                                                                   |
| `animations`                   | `Map` of every animation this pet can play.                                                       |

### `PetChat`

`isOpen`, `busy`, `messages`, `open()`, `close()`, `toggle()`, `send(text)` (resolves when the reply
has finished), `stop()`, `clear()`.

### Events

| Event            | Payload                                    | When                                                         |
| ---------------- | ------------------------------------------ | ------------------------------------------------------------ |
| `click`          | `{ originalEvent, preventDefault() }`      | Clicked, tapped, or Enter/Space. Prevent to skip the default. |
| `animationstart` | `{ name }`                                 | Any animation starts, including idles and flying.            |
| `animationend`   | `{ name, completed }`                      | It finished (`true`) or was interrupted (`false`).           |
| `dragstart`      | `{ position }`                             | A drag begins.                                               |
| `dragend`        | `{ position }`                             | The pointer is released (it may still glide).                |
| `move`           | `{ position }`                             | It came to rest somewhere new.                               |
| `show` / `hide`  | none                                       | A show / hide transition finished.                           |
| `chat:open` / `chat:close` | none                             | The balloon opened / closed.                                 |
| `chat:message`   | `{ message }`                              | A message was added (assistant ones once fully streamed).    |

### Other exports

| Export                  | Description                                                                      |
| ----------------------- | -------------------------------------------------------------------------------- |
| `Pixel`, `Rack`, `characters` | Built-in characters.                                                       |
| `defineCharacter(input)`| Create a character with defaults filled in.                                      |
| `renderIcon(character, { pose?, viewBox?, title? })` | A static `<svg>` string of a character.             |
| `STAGE_VIEWBOX`         | The viewBox the live pet uses, with room above for effects. Pass it to `renderIcon` to include hearts, clouds etc. |
| `ANIMATIONS`            | The built-in animations by name.                                                 |
| `ANIMATION_GROUPS`      | Playable built-ins grouped by category, handy for building a UI.                 |
| `motion`                | Helpers for writing animations.                                                  |
| `BASE_POSE`             | The resting pose.                                                                |
| `css`, `injectStyles()` | The stylesheet, and the function that injects it.                                |

## Animations

| Category | Animations                       | Notes                                                    |
| -------- | -------------------------------- | -------------------------------------------------------- |
| `idle`   | `idle1`, `idle2`, `idle3`         | Rest, look & wave, yawn & doze. Picked automatically: mostly the quiet `idle1`, more variety the longer nobody interacts. |
| `happy`  | `happy1`, `happy2`, `happy3`      | Bounce, love (hearts), flip.                             |
| `sad`    | `sad1`, `sad2`, `sad3`            | Sigh, cry, rain cloud.                                   |
| `busy`   | `busy1`, `busy2`, `busy3`         | Loading bar, typing code, processing.                    |
| `flying` | `flying-slow`, `flying-fast`      | Used automatically while dragged, thrown or flying.      |
| `talk`   | `talk`                            | Lip-flap; used by `say()` and while chat replies stream. |
| `system` | `hide`, `show`                    | Dock transitions (not picked at random).                 |

### The pose

A pose describes one frame. Numbers blend smoothly between animations.

| Field | Meaning |
| ----- | ------- |
| `x`, `y`, `rot`, `sx`, `sy` | Body offset (px), rotation (deg), squash/stretch. |
| `eye` | `'open' \| 'happy' \| 'closed' \| 'heart' \| 'x' \| 'squint' \| 'spiral' \| 'wide'` |
| `eyeOpen`, `lookX`, `lookY` | Eye openness (0…1) and gaze offset. |
| `brow` | Worried brows (0 = hidden). |
| `mouthCurve`, `mouthOpen`, `mouthWidth` | −1 frown … 1 smile; 0…1 open; width factor. |
| `blush`, `screen`, `glitch` | Cheek blush, screen brightness, scanline glitch (0…1). |
| `armL`, `armR`, `legL`, `legR`, `antenna` | Arm angles (deg, raised outward), leg lift (px), antenna sway (deg). |
| `tears`, `sweat`, `hearts`, `zzz`, `sparkles`, `cloud`, `gears` | Effects. 0 = off; for the looping ones pass `t` as the phase. |
| `progress` | Progress bar fill 0…1 (−1 hides it). |
| `code`, `spinner`, `keyboard` | Screen overlays and the keyboard prop. |
| `propeller`, `flame`, `speedLines`, `speedAngle` | Flight gear. |

## Browser support

Current Chrome, Edge, Firefox and Safari. It uses Pointer Events, `requestAnimationFrame` and
inline SVG.

## License

MIT © Mark Wylde
