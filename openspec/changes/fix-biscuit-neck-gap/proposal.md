## Why

Biscuit's head floats above its body: in the site's crew card there is a visible gap between the bottom of the head and the tops of the forelegs, so the dog reads as a stack of separate parts rather than one pup.

## What Changes

- Reshape Biscuit's torso so its top tucks under the head's lower edge, closing the neck gap.
- Move Biscuit's shoulder anchor up so the forelegs start under the head and overlap the torso, with no background showing between head, torso and arms.
- Add a regression test that checks the head, torso and shoulder geometry overlap.
- No API, export, animation or palette changes. Legs, tail, ears and face stay where they are.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `dog-character`: "Biscuit looks like a cartoon dog" gains the rule that head, torso and forelegs are drawn as one connected figure, with no gap between them.

## Impact

- `packages/pet/src/characters/biscuit.ts`: torso shape and `anchors.shoulder`.
- `packages/pet/test/characters.test.ts`: new connectedness test.
- Visible in the demo picker, the site crew card and the footer icon. The `iconViewBox` should not need to change; check it still frames the dog.
