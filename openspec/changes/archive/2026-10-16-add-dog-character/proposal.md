## Why

Every pet that ships today is a robot-like gadget with a glowing screen for a face (Pixel the CRT, Rack the server). A cartoon dog gives people a warm, organic option for websites and apps where a computer mascot feels wrong. It is a brand-new character design, not a reskin of the robots: it has its own face, limbs and way of flying. To make that possible, the library has to let a character replace the robot skeleton parts it currently forces on everyone.

## What Changes

- Add a new built-in character, **Biscuit**, a cartoon dog with its own design throughout:
  - a furry body and a muzzle with a nose
  - floppy ears that react to motion
  - chunky furry forelegs with round paws, and stubby hind legs with big paws
  - a tail that wags faster when the pet is happy or busy
  - no screen, antenna, propeller hat, ball-joint arms, shoe feet or rocket flames
  - flies by flapping its ears like wings

  It is exported as `Biscuit` and added to `characters`.
- Add a third face kind, `face: 'toon'`. It is drawn in ink straight onto the body, with no screen, bezel, scanlines or glass. It supports every existing `EyeShape`, plus brows, blush, mouth and tears.
- Screenless rendering for `toon` characters:
  - Overlays that normally appear on the screen (progress bar, code, spinner) appear in a cartoon thought bubble above the head.
  - `glitch` becomes a face jitter. `screen` dimming becomes a soft shadow over the face.
- New opt-outs on `Character` so a character can bring its own parts:
  - `arm` and `legs` draw functions replace the shared stick limbs.
  - `antenna: false` hides the antenna and propeller hat. The character's `body()` sees `pose.propeller` and can animate its own way of flying.
  - `rocket: false` hides the foot flames.

  All of these default to today's behaviour.
- Add Biscuit to the demo's character picker, and fix the demo's "Name the Kind" heading, which currently only knows about Rack and Pixel.
- Add Biscuit to the landing site's crew list and footer.
- Document all of the above in the package README.

## Capabilities

### New Capabilities
- `toon-face`: the screenless `toon` face kind. Covers expressions, the thought bubble for screen overlays, and what `glitch` and `screen` do without a screen.
- `custom-parts`: lets a character replace or hide shared skeleton parts (`arm`, `legs`, `antenna: false`, `rocket: false`).
- `dog-character`: the built-in Biscuit character. Covers its look, ears, ear-flap flying, the tail wag that responds to mood, its exports, and its appearance in the demo and the site.

### Modified Capabilities
(none: no specs exist yet in `openspec/specs/`)

## Impact

- `packages/pet/src/characters/`: a new `biscuit.ts`. `types.ts` widens the `face` union and adds `arm`, `legs`, `antenna` and `rocket`. `define.ts` gets defaults for the new fields. `index.ts` adds the exports.
- `packages/pet/src/render/`: a new `toon.ts` face. `index.ts` gets the screenless branch and the part overrides. `parts.ts` gets a thought bubble and respects the opt-outs.
- `packages/pet/src/index.ts`: exports `Biscuit` and the new limb context type.
- `packages/pet/test/pet.test.ts`: new tests.
- `apps/demo/src/App.tsx` and `apps/site/src/main.ts`: list Biscuit.
- `packages/pet/README.md`: documents the new options.
- The changes add to the public API and do not break it. Pixel and Rack render exactly as before.
