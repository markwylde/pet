## 1. Baseline and types

- [ ] 1.1 Before any change, capture `renderIcon(Pixel)` and `renderIcon(Rack)` as snapshot fixtures in `packages/pet/test`; verify the snapshots are committed and `npm test` passes
- [ ] 1.2 In `characters/types.ts`, widen `face` to `'crt' | 'matrix' | 'toon'`, add a `LimbContext` type, optional `arm` and `legs` functions, and `antenna?` / `rocket?` booleans, and document what the palette fields mean for toon; verify with `npm run typecheck`
- [ ] 1.3 In `defineCharacter`, default `antenna: true` and `rocket: true`; verify the "fills in defaults" test passes after it asserts both

## 2. Part overrides

- [ ] 2.1 In `renderFrame`, call `character.arm` and `character.legs` when present, in the same layer slots as the shared parts, otherwise draw the shared parts; verify with a test that a custom `arm` and `legs` replace the joint circles and shoe feet, and that `arm` gets changing angles during `happy1`
- [ ] 2.2 Make `parts.antenna` draw nothing when `antenna: false`, including in propeller poses, and skip `parts.flame` when `rocket: false`; verify with tests that `flying-slow` has no antenna or hat markup, and that `flying-fast` has speed lines but no flame
- [ ] 2.3 Verify that the Pixel and Rack snapshots from task 1.1 are still byte-identical

## 3. Toon face

- [ ] 3.1 Create `render/toon.ts` with `toonFace`, covering all 8 `EyeShape`s, brows, blush, the "w" mouth with tongue, and ink with no glow; verify with a test that renders each eye shape and checks the markup is distinct
- [ ] 3.2 Add `parts.thoughtBubble`, with progress, code and spinner re-centred inside it, centred at y −178 + `effectsOffsetY` and its top clamped below −245; verify with a test that it appears only while one of those overlays is active, and that its bounds sit inside `STAGE_VIEWBOX`
- [ ] 3.3 Add the toon branch in `renderFrame`: `toonLayer()` with glitch jitter, a dim ellipse for `screen < 1` and tears, the mouth always shown, the bubble in the effects group, and gears at x +34; verify with a test that toon output has no `screen-clip`, scanline or glass markup, and that a `screen: 0.6` pose draws a shadow with opacity above zero

## 4. Biscuit

- [ ] 4.1 Create `characters/biscuit.ts` with its palette, geometry, `face: 'toon'`, `antenna: false` and `rocket: false`, and draw the tail, torso, head, muzzle, nose and ears in `body()`; verify `renderIcon(Biscuit, { title: 'Biscuit' })` returns an svg labelled "Biscuit"
- [ ] 4.2 Implement Biscuit's `arm` (a furry foreleg with a round paw and toe creases) and `legs` (stubby hind legs with big paws and a pad on lift); verify with a test that the icon contains no shared joint circles or shoe feet
- [ ] 4.3 Make the ears sway with `pose.antenna`, and raise and flap them at a rate that rises with `propeller`; verify with tests that changing only `antenna` changes the ear transforms, that `propeller` = 1 gives varied, raised ear angles, and that `propeller` = 3 completes more flaps per second than `propeller` = 1
- [ ] 4.4 Add `mood()` and the time-based tail wag using the design's table; verify with tests that the happy wag completes more cycles per second than idle, and that the sad wag hangs lower with a smaller swing
- [ ] 4.5 Export `Biscuit` (also in `characters`) and `LimbContext`; verify with a test that `characters.Biscuit === Biscuit` and that the aria-label contains "Biscuit" and "cartoon dog"
- [ ] 4.6 Add a test that plays every name in `ANIMATIONS` on Biscuit and advances frames without throwing; verify with `npm test`

## 5. Demo, site and docs

- [ ] 5.1 In `apps/demo/src/App.tsx`, add `biscuit: Biscuit` to `CHARACTERS` and replace the heading ternary with a `TITLES` map (Terminal / Server / Dog); verify with `npm run typecheck` and by picking Biscuit in `npm run dev`
- [ ] 5.2 In `apps/site/src/main.ts`, add a Biscuit card to `CREW` and add Biscuit to the footer pets; verify in `npm run site` that "Pick Biscuit" switches the pet
- [ ] 5.3 Update `packages/pet/README.md` to list Biscuit, and document `face: 'toon'`, `arm`, `legs`, `antenna: false`, `rocket: false`, the thought bubble and the toon palette meanings; verify by reading the rendered README

## 6. Integration check

- [ ] 6.1 Run `npm test`, `npm run typecheck`, `npm run lint` and `npm run build`, and confirm all of them pass
- [ ] 6.2 In the demo, play every animation group on Biscuit and check that the ears, ear-flap flying, tail, paws on the keyboard, thought bubble, tears and gloomy dimming all read well and stay on stage; tune the look if needed (design Open Question)
