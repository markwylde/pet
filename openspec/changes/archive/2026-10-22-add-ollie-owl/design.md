## Context

Self-drawn characters (`skeleton: false`) already exist. `renderFrame` calls only `character.body({ pose, time, … })` inside the body transform, then adds the shadow, speed lines and above-head effects. Whiskers (`characters/whiskers.ts`) is the reference: one file of small local helpers, thick ink strokes, and a pose mapping where `busy = code > 0 || spinner > 0 || progress >= 0 || gears > 0` and `flying = propeller > 0 || flame > 0`. Biscuit flaps its ears with `75 + 25 * sin(time * 2π * (2 + 2 * propeller))`. Rendering is a pure function of `(pose, time)`. There is no per-pet state, and transitions come from `lerpPose` blending numeric fields.

## Goals / Non-Goals

**Goals:**
- Ollie lives entirely in `characters/ollie.ts`, with no renderer, `Pose` or type changes.
- Its signature behaviours stay pure functions of `(pose, time)`, so they work in `renderIcon` and tests.

**Non-Goals:**
- Owl-only animations (hoot, 270° head turn) or new `Pose` fields.
- Sharing helpers with Whiskers (eye shapes, tears). Copy and adapt for now; extract only if a third self-drawn character needs them.

## Decisions

**1. File layout mirrors Whiskers.**
Helpers are `tailFeathers`, `silhouette`, `chest`, `talons`, `face` (eye discs, eyes, brows, glasses, beak, blush, tears), `wing` and `sweatDrop`. They are drawn back to front: tail feathers, silhouette and belly, chest marks, talons, the face group, then wings. The wings sit in front so a raised wing overlaps the body the way Whiskers' front legs do.

**1a. One silhouette, with a tilting head.**
Cartoon owls read as owls because the head and body are one egg shape, with no neck, and the ear tufts are its top corners. A first draft with a round head on a separate body read as a teddy bear or a cat. The head (with its tufts) and the pear-shaped body are two overlapping paths. Both are drawn as thick ink outlines first, then both fills go on top. That merges them into one inked silhouette even while the head path is rotated for the tilt. The two eye discs use the same trick, so they form one pale mask with a rim only around the outside.

**2. Busy level is continuous, not boolean.**
`busyLevel = clamp01(max(code, spinner, gears, progress >= 0 ? 1 : 0))`. Glasses slide by `busyLevel * ~10px` down the beak, and ruffle amplitude scales with it. `code`, `spinner` and `gears` are numeric and blended by `lerpPose`, so they ease in and out between animations. That gives the glasses a smooth return to rest without per-pet state. `progress` snaps (it is `-1` when hidden), which is acceptable. Alternative rejected: a boolean `busy` like Whiskers, because glasses popping between two positions looks wrong where a tail speed change does not.

**3. Head tilt = sway + idle drift.**
`tilt = clamp(antenna * 0.5 + (1 - busyLevel) * 4 * sin(time * 0.7), -10, 10)` degrees, rotating the head group about the neck (≈ 0, −70). The idle drift fades out while busy so the owl looks focused. The ±10° clamp follows Whiskers' ear limit and keeps the head joined to the body. Since the body outline overlaps the head bottom, the joint stays hidden at any tilt in range.

**4. Feather ruffle.**
The chest has a few rows of inked "v" feather marks. Each mark is offset by `busyLevel * 1.5 * sin(time * 14 + i)`. When `busyLevel` is 0 the offset is exactly 0, so resting renders are identical across time, as the spec requires.

**5. Pose mapping.**
| Pose | Ollie |
| --- | --- |
| `armL/armR` (deg) | wing rotates about a shoulder pivot on the body side; its three feather tips spread as it rises |
| `legL/legR` (px) | talon lifted that many px |
| `antenna` (deg) | head tilt (decision 3) |
| `eye`, `eyeOpen`, `lookX/Y`, `brow`, `blush`, `tears` | face; eyes sit inside the glasses' lenses, so the lenses are drawn after the eyes with a transparent fill |
| `mouthCurve`, `mouthOpen`, `mouthWidth` | beak: a small downward triangle whose tip bends with the curve; it opens into upper and lower mandibles as `mouthOpen` grows |
| `sweat` | drop beside a tuft |
| `propeller > 0 \|\| flame > 0` | flying: both wings flap with Biscuit's formula; talons tucked; tail feathers fanned |
| `code/spinner/progress/gears` | `busyLevel` (decision 2) |
| `screen`, `glitch`, `keyboard` | ignored |

**6. Eyes.**
Owl eyes dominate the face: an orange iris (r ≈ 15.5) around a black pupil with highlights, set in a pale disc (r 27) and framed by the glasses' lenses (r 20). The other seven shapes reuse Whiskers' approach (arcs, crosses, hearts, chevrons, spirals) at the larger scale. `wide` grows the pupil rather than slitting it.

**7. Geometry and palette.**
Feet at (0,0). Body about x −68…68, y −96…−2. Head about x −63…63, y −151…−64, with tufts to y −178 and a dip between them. Eye discs are centred at (±26, −110). Final values are `effectsOffsetY: -28` and `iconViewBox: '-86 -192 172 198'`. Colours: feathers `#9C6A44`, darker barring `#6E4529`, eye discs `#F6E7CB`, belly `#EFD8B0`, iris `#F5A623`, beak and feet `#F08A24`, glasses frame `#3A2A1F`, and ink `#1E1A17` (shared with Whiskers so the animals look like one family). The `palette` field gets the ink colours, as Whiskers does.

**8. Line-up image.**
`docs/characters.svg` was regenerated by hand from `renderIcon` before, and no script exists. Regenerate it with a one-off `tsx` snippet in the scratchpad and widen the viewBox for five tiles. Adding a committed script was rejected as out of scope.

## Risks / Trade-offs

- [Glasses over big eyes could hide the expression] → Lenses get a transparent fill and a thin frame, and sit slightly larger than the eyes. Check every eye shape in the demo.
- [Head tilt plus `lookX` could push the eyes outside the glasses] → Glasses live in the head group and move with the look offset at a reduced factor (about 0.8×). Verify at `lookX = ±8`.
- [Wings and a raised `armR` wave may read as a flap rather than a wave] → The wave only rotates one wing, and its primaries spread at the top of the arc. Check the `happy` animations in the demo.
