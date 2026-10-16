## Why

Every built-in pet today is a little robot gadget built on one shared skeleton: a glowing screen face, stick arms and legs, an antenna, and robot props like the propeller hat, jet flames and keyboard. Whiskers is a brand new kind of pet, a ginger cartoon cat, and it should look and move like a cat, not like a robot dressed as one.

## What Changes

- Add **Whiskers**, a ginger cartoon cat, as a third built-in character exported from `@markwylde/pet` and included in `characters`.
- Whiskers draws its entire figure itself: head, cat face (eyes, nose, whiskers, mouth), ears, body, tail, and paws. None of the robot skeleton is used: no screen, stick limbs, antenna, propeller hat, jet flames, keyboard, or code/progress/spinner screen read-outs.
- Whiskers still plays every built-in animation. It reads the same pose (eyes, mouth, looking, arm and leg positions, antenna sway, effect intensities) and interprets each in a cat-like way: arm angles move its front paws, leg lifts move its back paws, antenna sway twitches its ears, and flying stretches it out with its ears swept back.
- Its tail swishes gently when idle and faster while it is busy.
- Body motion (bounce, squash, flip, fly), the ground shadow, speed lines, and the effects above the head (hearts, zzz, sparkles, rain cloud, gears) still apply. They are generic, not robot parts.
- Extend the character definition so any character can opt out of the shared robot skeleton (`skeleton: false`) and draw itself completely from the pose. The default stays the robot skeleton, so Pixel, Rack and existing custom characters are unaffected.
- Show Whiskers in the demo's character picker and the site's crew list and footer; document it and the new option in the README.

## Capabilities

### New Capabilities
- `self-drawn-characters`: A character can opt out of the shared robot skeleton and draw its whole figure from the pose, while body motion, shadow and above-head effects still apply.
- `whiskers-character`: The Whiskers built-in cartoon cat: identity, look, how it interprets every pose, its tail, and where it appears.

### Modified Capabilities
<!-- none: no specs exist yet in openspec/specs -->

## Impact

- `packages/pet/src/characters/` (new `whiskers.ts`; `types.ts`, `define.ts`, `index.ts`), `packages/pet/src/render/index.ts` (skip robot parts for self-drawn characters), `packages/pet/src/index.ts` export.
- Public API: additive only. `Character` gains `skeleton: boolean` (optional on input, default `true`). No breaking changes.
- `packages/pet/test/pet.test.ts` gains coverage for self-drawn characters and Whiskers.
- `apps/demo/src/App.tsx` (picker + heading), `apps/site/src/main.ts` (crew + footer), `packages/pet/README.md`.
