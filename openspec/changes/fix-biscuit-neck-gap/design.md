## Context

Head, torso, arms and legs all render inside one transformed group (`renderFrame` → `robot()`), so they move rigidly together and the gap is purely static geometry in `biscuit.ts`. Render order is legs → body (tail, torso, head, face details, ears) → toon face → arms, so arms paint over the head.

Measured from the current shapes (SVG units, origin at the feet):

| Part | Where it is |
| --- | --- |
| Head underside | `C -36 -56 36 -56 44 -72`, lowest ≈ y -60 at x 0, ≈ y -64 at x ±30 |
| Torso | ellipse `cy -36, rx 34, ry 26`, top y -62 at x 0, only ≈ y -48 at x ±30 |
| Shoulder anchor | `(±30, -54)`, so the foreleg top is at y ≈ -56 |

At x ±30 that leaves ≈ 8 units of background between the head and the foreleg tops, and ≈ 16 units between the head and the torso edge beside the arms. That matches the screenshot.

## Goals / Non-Goals

**Goals:** close the neck gap at rest and keep it closed during every animation (wave, jump, fly). Keep Biscuit's silhouette and proportions recognisable.

**Non-Goals:** redrawing the head, face, ears, legs or tail. Changing the shared renderer or other characters.

## Decisions

1. **Replace the torso ellipse with a pear-shaped path that has broad shoulders.** Its top edge runs across x ∈ [-40, 40] at about y -66, hidden under the head. It keeps the current bottom (≈ y -10) and the same waist width, so the hind legs and belly still sit right. The belly patch moves up a few units to stay centred.
   - *Alternative: grow the ellipse (larger `ry`/`rx`).* Rejected. An ellipse that is tall enough at x ±30 to reach the head becomes a balloon and changes the silhouette.
   - *Alternative: add a separate neck shape.* Rejected. It adds an extra outline seam, and a broad-shouldered torso fixes the same gap with one shape.
2. **Raise `anchors.shoulder` to about `(±30, -62)`.** The foreleg top then sits under the cheek fluff and inside the new torso, and the paw stays in roughly the same place. Arms draw over the head, so the small overlap reads as a shoulder tucked against the cheek.
3. **Test the geometry, not pixels.** Export the torso/shoulder constants from `biscuit.ts` (or parse them from the rendered SVG) and assert that the torso top at x = shoulder.x is above the head's lowest point there, and that the foreleg's top y is at or above the torso edge at that x. That covers both new scenarios without adding a raster dependency.

## Risks / Trade-offs

- [Raised shoulders change wave and fly poses: the paw could poke past the ear or the stage edge] → Check every built-in animation in the demo. The existing on-stage tests (`iconViewBox` and stage fit) must still pass.
- [Broader shoulders may clash with the hind-leg tops] → Keep the torso's lower half identical to today's ellipse.
