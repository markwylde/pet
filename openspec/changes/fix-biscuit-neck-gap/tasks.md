## 1. Geometry

- [x] 1.1 In `packages/pet/src/characters/biscuit.ts`, replace the torso ellipse with a broad-shouldered path whose top tucks under the head across x ∈ [-40, 40] and whose lower half matches today's ellipse. Re-centre the belly patch. Verify by rendering the icon and confirming no background shows between head and torso.
- [x] 1.2 Raise `anchors.shoulder` to about `(30, -62)` and tune it so each foreleg top sits inside the torso or head with no gap. Verify by rendering at rest in the demo (`npm run dev`).

## 2. Tests

- [x] 2.1 Add a test to `packages/pet/test/characters.test.ts` asserting that the head and torso overlap at the shoulder x, and that each foreleg's top lies inside the torso or head outline. Verify that it fails on `main`'s geometry and passes after 1.1 and 1.2.
- [x] 2.2 Run `npm test`, `npm run typecheck` and `npm run lint` and verify all pass, including the existing stage-fit and `iconViewBox` tests.

## 3. Visual check

- [x] 3.1 Step through every built-in animation in the demo (especially wave, jump and fly) and the site crew card and footer icon. Verify the head stays joined to the body and the paws stay on stage.
