## Context

`renderFrame` (`packages/pet/src/render/index.ts`) draws every character with one robot skeleton: inside the body transform it draws flame, legs, antenna (and propeller hat), `character.body()`, the screen (face plus progress/code/spinner/tears, glitch, scanlines, glass), keyboard, arms and sweat. Outside it, it draws the shadow and speed lines, and the above-head effects group offset by `effectsOffsetY`. Animations are pure functions returning a `Pose`, so a character that renders from the pose gets every animation for free.

## Goals / Non-Goals

**Goals:**
- A cat that shares nothing visual with the robots, driven by the existing animations and `Pose`.
- One small, general opt-out in the renderer rather than cat-specific branches.

**Non-Goals:**
- New `Pose` fields or cat-only animations (purr, meow, stretch).
- Splitting robot parts into reusable building blocks for self-drawn characters.

## Decisions

**1. `skeleton: boolean` on `Character` (default `true`).**
In `renderFrame`, when `skeleton` is false the body-transform group contains only `c.body({ pose, time, id, url, h })`. Shadow, speed lines and the effects group are unchanged. The `defs()` gradients stay in place since they're cheap and the cat may reuse `glow`/`body-side`. Alternatives: a `face: 'cat'` style plus antenna/limb flags. Rejected because each robot part would need its own flag, and the cat would still inherit robot conventions. A full `render` override was also rejected: it would duplicate the shadow and effects logic.

`face`, `palette`, `limbs` and `anchors` stay required in the type (filled by defaults) but are ignored for self-drawn characters, except `anchors.sweat`, which has no meaning there. Document this in the type's JSDoc.

**2. Whiskers lives entirely in `characters/whiskers.ts`.**
It is split into small local helpers: `tail`, `backPaws`, `body`, `head`, `ears`, `face` (eyes/brows/nose/whiskers/mouth/blush/tears), `frontPaws`, `sweatDrop`. They are drawn in that order so the tail sits behind and the front paws in front. The cat's eyes are its own design: big rounded eyes with highlight, and vertical-slit pupils for `wide`. Each `EyeShape` maps to a cat-appropriate drawing, e.g. `happy` gives upturned arcs, `closed` gives sleepy curves, `heart` gives pink hearts, `x` gives crosses, `squint` gives > <, and `spiral` gives rotating spirals. The mouth is an "ω" that bends with `mouthCurve` and becomes an open rounded mouth with a pink tongue as `mouthOpen` grows.

**3. Pose mapping.**
| Pose | Whiskers |
| --- | --- |
| `armL/armR` (deg) | front paw rotates about a shoulder pivot on the body side; paw lifts with the angle |
| `legL/legR` (px) | back paw raised by that many px |
| `antenna` (deg) | left ear rotates `+a*0.6`, right ear `-a*0.4` for an asymmetric twitch |
| `eye`, `eyeOpen`, `lookX/Y`, `brow`, `blush`, `tears`, `mouth*` | face as above |
| `sweat` | drop by the head |
| `propeller > 0 \|\| flame > 0` | flying pose: front paws forward, ears flattened back, tail streaming straight |
| `code/spinner/progress/gears` | busy: faster tail (gears still float above the head via the generic effect) |
| `screen`, `glitch`, `keyboard` | ignored |

**4. Tail.**
`rate = busy ? 9 : 2`; tail curve control points swing by `sin(time * rate) * amp`. It is drawn as a thick stroked path in fur colour with a darker tip stripe, curling up behind the body on the right.

**5. Geometry and palette.**
Feet at (0,0) as with all characters. Big cartoon head (about x −52…52, y −150…−66), compact body (y −72…−10), ears to about y −180, tail to about x +78. Starting values are `effectsOffsetY: -30` and `iconViewBox` about `'-80 -190 175 196'`, tuned visually. Colours: fur `#f29a4a`→`#e07b2c`, cream `#fde7c8`, stripes `#c4621f`, outline `#7a3e16`, ink `#3b2314`, nose/tongue pink `#ff8fab`. `palette` is required by the type, so give it the ink colours. It isn't rendered.

**6. Demo heading uses `character.kind`.**
Replace the `character === Rack ? 'Server' : 'Terminal'` ternary with `character.kind`.

## Risks / Trade-offs

- [The fly animation's legibility relies on the propeller and flames] → The dedicated flying pose plus the speed lines carry it. Check in the demo.
- [Working animations lose their screen read-outs on the cat] → Busy is shown with the faster tail and focused eyes. Gears still float above. This is accepted, because the user wants nothing robot-like.
- [`face`/`palette`/`limbs` are meaningless for self-drawn characters] → Document it rather than restructure the type, which keeps the change additive.
