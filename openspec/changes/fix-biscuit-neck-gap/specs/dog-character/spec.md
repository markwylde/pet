## MODIFIED Requirements

### Requirement: Biscuit looks like a cartoon dog
Biscuit SHALL be an original cartoon dog design, not derived from the robot characters. It SHALL be drawn with a rounded furry head, a muzzle with a nose, two floppy ears, furry forelegs ending in round paws, stubby hind legs with big paws, and a tail. Its head, torso and forelegs SHALL read as one connected figure: the torso SHALL meet the underside of the head, and each foreleg SHALL start inside the torso or head outline, so no background shows between the head and the torso or between the head and the forelegs at rest. It SHALL NOT show a screen, antenna, propeller hat, ball-joint arms, shoe feet or rocket flames. Its framing SHALL fit fully inside its `iconViewBox`, and SHALL fit inside the stage at rest and during every built-in animation.

#### Scenario: Static icon
- **WHEN** `renderIcon(Biscuit, { title: 'Biscuit' })` is called
- **THEN** it returns an `<svg>` with `aria-label="Biscuit"` that contains the dog's body, ears and tail

#### Scenario: Head joins the body
- **WHEN** Biscuit is rendered at rest
- **THEN** the top of the torso sits above the lowest point of the head outline across the shoulder span, so the two shapes overlap

#### Scenario: Forelegs join the head and body
- **WHEN** Biscuit is rendered at rest
- **THEN** the top of each foreleg lies inside the torso or head outline, with no gap above it
