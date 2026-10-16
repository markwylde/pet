## 1. Self-drawn characters

- [x] 1.1 Add `skeleton: boolean` to `Character` (optional in `CharacterInput`, JSDoc noting which fields are ignored when false) and default it to `true` in `defineCharacter`; verify `npm run typecheck` passes.
- [x] 1.2 In `renderFrame`, when `skeleton` is false draw only `c.body(...)` inside the body transform, keeping shadow, speed lines and above-head effects; verify a test with a stub `skeleton: false` character asserts that propeller/flame/keyboard/progress/code don't render, that hearts do, and that the body function receives the pose.
- [x] 1.3 Confirm Pixel and Rack are unchanged: `renderIcon(Pixel)` and `renderIcon(Rack)` output is identical before and after (snapshot or string compare), and `npm test` passes.

## 2. Whiskers

- [x] 2.1 Create `characters/whiskers.ts` (`id: 'whiskers'`, `name: 'Whiskers'`, `kind: 'cartoon cat'`, `skeleton: false`) drawing tail, back paws, body with cream belly and stripes, head with muzzle, ears and front paws; verify `renderIcon(Whiskers)` renders without error.
- [x] 2.2 Implement the cat face: distinct drawings for all eight eye shapes, blink via `eyeOpen`, look offset, brows, blush, nose, whiskers, ω mouth that opens with `mouthOpen`, tears; verify tests that each eye shape gives different markup and that `mouthOpen: 1` differs from `0`.
- [x] 2.3 Map the rest of the pose: paws from `armL/armR` and `legL/legR`, ears from `antenna`, sweat drop, flying pose when `propeller`/`flame` is active, and a tail rate that is faster when busy; verify tests that ear markup changes with `antenna`, that tail markup differs across `time`, and that busy and idle tail positions diverge at the same time offset.
- [x] 2.4 Export `Whiskers` from `characters/index.ts` (add to `characters`) and `src/index.ts`; verify tests that `make({ character: Whiskers })` labels itself "Whiskers", `characters.Whiskers` exists, and `renderIcon(Whiskers, { title: 'Whiskers' })` has `aria-label="Whiskers"`.
- [x] 2.5 Tune geometry, `effectsOffsetY` and `iconViewBox` in the demo (`npm run dev`), playing every animation (idle, happy, sad, thinking/working, fly, drag) and checking that it reads as a cat, nothing clips, and effects clear the ears.

## 3. Apps and docs

- [x] 3.1 Add Whiskers to the demo picker (`apps/demo/src/App.tsx` `CHARACTERS`) and use `character.kind` in the heading; verify `npm run typecheck` passes and selecting Whiskers switches the pet.
- [x] 3.2 Add Whiskers to the site crew list with a blurb and to the footer icons (`apps/site/src/main.ts`); verify `npm run build` succeeds.
- [x] 3.3 Update `packages/pet/README.md`: Whiskers in the features list and exports table, plus `skeleton: false` in the custom-character section with a short example; verify by re-reading against the final types.

## 4. Final checks

- [x] 4.1 Run `npm test`, `npm run typecheck`, `npm run lint` and `npm run build` from the repo root; all pass.
