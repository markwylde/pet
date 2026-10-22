## Why

The crew has two gadgets (Pixel, Rack) and two animals (Biscuit, Whiskers). Ollie, a little night owl, is a third animal with a coder joke built in ("up past midnight with you"). Its anatomy fits the existing animation system well: big round eyes show every eye shape clearly, wings act as arms, and it can genuinely fly without the robot propeller or jet flames.

## What Changes

- Add **Ollie**, a cartoon owl wearing tiny round reading glasses, as a built-in character exported from `@markwylde/pet` and included in `characters`.
- Ollie is a self-drawn character (`skeleton: false`), like Whiskers. It draws one egg-shaped head-and-body silhouette whose top corners are the ear tufts, big eyes in pale eye discs, an orange beak, glasses, a chevron-marked belly, wings, orange feet and tail feathers. It has no screen, stick limbs, antenna or robot props.
- Ollie interprets the shared pose in an owl-like way. `armL`/`armR` raise its wings, `legL`/`legR` lift its talons, `antenna` sway tilts its head, and flying (`propeller`/`flame`) makes its wings really flap.
- Signature behaviours:
  - **Glasses slide down its beak while busy** (`code`, `spinner`, `progress` or `gears` active) and push back up when it stops.
  - **Slow head-tilt when idle**, a gentle tilt over time in the resting pose.
  - **Feathers ruffle while busy**, a quick shimmer on the chest feathers, much like Whiskers' faster tail.
- Show Ollie in the demo's character picker, the site's crew list (blurb: "Up past midnight with you. Glasses slide down its beak while it thinks, and it actually flaps when it flies.") and footer, the README, and the `docs/characters.svg` line-up.

## Capabilities

### New Capabilities
- `ollie-character`: The Ollie built-in night owl: identity, look, how it interprets every pose, its glasses, head-tilt and feather behaviours, and where it appears.

### Modified Capabilities
<!-- none: the self-drawn-characters capability already covers everything Ollie needs; no other spec's requirements change -->

## Impact

- `packages/pet/src/characters/` (new `ollie.ts`, `index.ts`), `packages/pet/src/index.ts` export.
- Public API: additive only (`Ollie`, `characters.Ollie`). No renderer or type changes.
- `packages/pet/test/` gains Ollie coverage.
- `apps/demo/src/App.tsx` (picker), `apps/site/src/main.ts` (crew + footer), `packages/pet/README.md`, root `README.md` (image alt text), `docs/characters.svg`.
