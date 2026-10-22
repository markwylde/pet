## 1. Ollie

- [x] 1.1 Create `packages/pet/src/characters/ollie.ts` (`id: 'ollie'`, `name: 'Ollie'`, `kind: 'night owl'`, `skeleton: false`, palette per design) drawing tail feathers, round body with chest feather rows, talons, head with ear tufts and facial disc, and wings at rest. Verify that `renderIcon(Ollie)` renders without error.
- [x] 1.2 Implement the owl face: iris-ringed eyes with distinct drawings for all eight eye shapes, blink via `eyeOpen`, look offset, brows, blush, a beak that bends with `mouthCurve` and opens with `mouthOpen`, and tears. Verify with tests that each eye shape gives different markup and that `mouthOpen: 1` differs from `0`.
- [x] 1.3 Add the glasses with transparent lenses, drawn over the eyes and following the look offset at 0.8×, and the continuous `busyLevel` slide (design decision 2). Verify with tests that glasses markup is lower when `code: 1` than at rest, and identical between two resting renders at different times.
- [x] 1.4 Map the rest of the pose: wings from `armL`/`armR`, talons from `legL`/`legR`, head tilt from `antenna` plus idle drift (clamped ±10°), sweat drop, flying flap and tucked talons when `propeller`/`flame` is active. Verify with tests that wing markup changes with `armR`, head markup changes with `antenna` and across `time` at rest, wing markup differs across `time` when flying, and `renderIcon(Ollie, { pose: { propeller: 3, flame: 1, keyboard: 1 } })` contains no robot prop colours.
- [x] 1.5 Add the busy feather ruffle (design decision 4). Verify with tests that chest markup differs across `time` when busy and is identical across `time` at rest.
- [x] 1.6 Export `Ollie` from `characters/index.ts` (add it to `characters`) and from `src/index.ts`. Verify with tests that `make({ character: Ollie })` labels itself "Ollie", `characters.Ollie` is `Ollie`, and `renderIcon(Ollie, { title: 'Ollie' })` has `aria-label="Ollie"`.
- [x] 1.7 Tune geometry, `effectsOffsetY` and `iconViewBox` in the demo (`npm run dev`) by playing every animation group (idle, happy, sad, busy, flying, talk, system) and dragging. Check that it reads as an owl, the eyes stay inside the glasses at full look offset, nothing clips, and effects clear the tufts.

## 2. Apps and docs

- [x] 2.1 Add Ollie to the demo picker (`apps/demo/src/App.tsx` `CHARACTERS`). Verify that `npm run typecheck` passes and that selecting Ollie shows "Ollie the Night Owl".
- [x] 2.2 Add Ollie to the site crew list with the blurb from the proposal, and to the footer icons (`apps/site/src/main.ts`). Verify that `npm run build` succeeds and the crew shows a "Pick Ollie" card.
- [x] 2.3 Update `packages/pet/README.md` (features list, `character:` comment, exports table). Verify by re-reading it against the final exports.
- [x] 2.4 Regenerate `docs/characters.svg` with all five characters using a one-off scratchpad script over `renderIcon`, and update the alt text in the root `README.md`. Verify by opening the SVG and checking that five characters render untruncated.

## 3. Final checks

- [x] 3.1 Run `npm test`, `npm run typecheck`, `npm run lint` and `npm run build` from the repo root, and confirm all pass, including the unchanged render-baseline snapshots for existing characters.
