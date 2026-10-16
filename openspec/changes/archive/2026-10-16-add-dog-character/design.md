## Context

How each frame is drawn today:

- `renderFrame` (`packages/pet/src/render/index.ts`) draws a fixed robot skeleton for every character, in this order:
  1. rocket flame
  2. `parts.legs` (stick legs, shoe feet)
  3. `parts.antenna` (stalk, bobble or propeller hat)
  4. `character.body()`
  5. `screen()`
  6. keyboard
  7. `parts.arm` × 2 (stick arms, ball joint and ball hand)
  8. sweat

  Effects above the head come last.
- `screen()` clips everything to `SCREEN` (x −42…42, y −124…−58). It paints the gradient, then the face (`crtFace` or `matrixFace`) and the screen overlays, then scanlines, a dimming rect and glass.
- A character can only recolour the skeleton (`limbs`) and move its anchors.

Biscuit is a brand-new, non-robot design (see proposal.md, Why). So the change is mostly about making each robot-only layer optional or replaceable. `Pose` and `animations.ts` stay untouched, because every existing animation must play on Biscuit unchanged.

## Goals / Non-Goals

**Goals:**
- Build general extension points (`face: 'toon'`, `arm`, `legs`, `antenna: false`, `rocket: false`) that any custom character can use, with Biscuit as their first user.
- Keep Pixel and Rack output byte-identical.
- Drive all of the dog's motion (ears, ear-flap flight, tail, paws) from the existing `pose` and `time`.

**Non-Goals:**
- No dog-only animations, such as barking or fetching.
- No new `Pose` fields.
- No changes to the generic props: the keyboard, sweat, hearts, zzz, sparkles, rain cloud, gears and speed lines are shared cartoon effects, not robot parts.

## Decisions

**1. `face: 'toon'` means screenless.**
For crt and matrix, `renderFrame` calls `screen()` as today. For toon it calls `toonLayer()`, which:
- draws `toonFace` unclipped, inside the glitch jitter transform;
- draws tears on top;
- draws a dim ellipse over the face, with opacity `(1 - p.screen) * 0.5`;
- always keeps the mouth visible.

The alternative was a separate `screen?: boolean`. It would allow nonsense combinations, such as a CRT face with no screen, for no real gain.

**2. The toon face lives in `render/toon.ts` and mirrors `crt.ts`.**
- It uses the same `EYE_Y`, `EYE_DX` and `MOUTH_Y`, so gaze offsets carry over.
- Eyes are solid ink ovals with a white glint for `open` and `wide`. The other shapes are ink strokes with no glow filter.
- The mouth is the CRT curve with a cartoon "w" upper lip under the nose and a pink tongue.
- For toon, the existing palette fields keep their names but change meaning:
  - `phosphor` is the ink colour.
  - `phosphorDim` is the bubble's secondary text.
  - `screenInner` and `screenOuter` are the bubble's fill and outline.

  Renaming them would break custom characters, so instead `types.ts` and the README document the toon meanings.

**3. Screen overlays go in a thought bubble.**
`parts.thoughtBubble(content, offsetY, ctx)` draws a cloud with two trailing puffs. It is centred at (−30, −178 + `effectsOffsetY`), off to the left so it clears the gears, and clamped so its top stays below −245. Inside it, `progressBar`, `code` and `spinner` are translated from screen-centre coordinates (about y −91) to the bubble centre. For toon characters, gears move right by 56 so they don't collide with it.

Rejected alternatives:
- A held tablet: it fights the animated arms.
- Drawing on the body: too small to read.

**4. Part overrides on `Character`.**
New optional fields:
- `arm(ctx: LimbContext & { side, angle, shoulder })`
- `legs(ctx: LimbContext & { left, right })`
- `antenna?: boolean` (default `true`)
- `rocket?: boolean` (default `true`)

`LimbContext` is `BodyContext` reused: `pose`, `time`, `id`, `url`, `h`.

`renderFrame` calls the override when present, and the shared part otherwise. Each one stays in the same layer slot, so the z-order is unchanged.

Rejected: one "replace the whole skeleton" hook. A character would then have to re-implement layering and every effect. Per-part hooks keep each override small, and the rest stays shared.

`antenna: false` makes `parts.antenna` return `''` in all poses, including propeller poses. Flight is left to `body()`. `rocket: false` skips `parts.flame`.

**5. Biscuit is an original design (`characters/biscuit.ts`).**
- **Body, drawn in `body()`, back to front:**
  1. tail: behind everything
  2. round torso with a cream belly
  3. head with cheek fluff
  4. cream muzzle patch with a glossy black nose
  5. two floppy ears overlapping the head edges

  The toon face is inked on top, over the head, with the eyes above the muzzle and the mouth under the nose.
- **Arms:** a tapered furry foreleg, a filled path in fur colour with a soft outline, about 26px long. It ends in a round cream paw with three toe creases and pivots at the shoulder by `angle`. There are no joint circles.
- **Legs:** short, stubby hind legs with big oval paws and a pink pad visible on lift. They lift by `left`/`right` like the shared legs.
- **Ears:** each rotates about its root.
  - At rest: a droop, plus `pose.antenna * 0.8` sway.
  - In flight (`propeller > 0`): the ears raise towards horizontal and flap as `sin(time * 2π * (2 + 2 * propeller))`. That gives roughly 4 Hz in slow flight and roughly 8 Hz in fast flight.

  This replaces the propeller hat and rocket flames, while speed lines remain.
- **Tail:** a `mood()` helper classifies the pose using the spec's predicates. The wag is `base + amp * sin(time * 2π * freq)`:

  | Mood    | Frequency | Amplitude | Base |
  | ------- | --------- | --------- | ---- |
  | neutral | 1.2 Hz    | 12°       | 0°   |
  | busy    | 3 Hz      | 18°       | 0°   |
  | happy   | 5 Hz      | 25°       | 0°   |
  | sad     | 0.4 Hz    | 4°        | 35°  |

  The wag is a pure function of time, like Rack's drive lights.
- **Palette:**
  - fur: tan `#d9a066`
  - belly, muzzle and paws: cream `#f6e3c4`
  - ears and tail tip: brown `#8a5a33`
  - ink and nose: `#2b1d14`
  - thought bubble: white `#ffffff` fill, `#c9b9a6` outline
- **Geometry:**
  - head: roughly x −50…50, y −150…−56
  - shoulders: about (40, −50)
  - `effectsOffsetY`: −14, to clear the ears
  - `sweat` anchor: on the brow
  - `iconViewBox`: tuned to include the tail and ears

**6. Wiring.**
- Export `Biscuit` and `LimbContext` from the package.
- In the demo, add `biscuit: Biscuit` to `CHARACTERS`. Replace the heading ternary with a `TITLES` map: `{ pixel: 'Terminal', rack: 'Server', biscuit: 'Dog' }`.
- On the site, add a `CREW` entry with the blurb "A very good boy. Ink-drawn face, ears that double as wings." and add Biscuit to the footer.

## Risks / Trade-offs

- [Screen-tuned animations (`gloomy`'s flicker, `glitch`) read oddly on a dog] → Jitter and a shadow keep them legible. Review each animation visually in the demo.
- [The keyboard prop in `busy2` sits at the robots' body height] → Position Biscuit's torso and paws so the paws rest on it naturally. If they don't, tweak the shoulder anchor during visual review.
- [Palette names are misleading for toon] → Document the toon meanings rather than rename them.
- [Tail and ear phase jump when the mood or flight changes] → Acceptable for a cartoon. A fix would need per-pet state in `body()`, which is out of scope.

## Open Questions

- Final fur colours, ear shape and breed feel will be tuned in visual review. That changes neither the specs nor the tasks.
