## Purpose

Defines Biscuit, the built-in cartoon dog: how it looks, how its ears and tail move, how it is exported, and where it appears in the demo and the site.

## ADDED Requirements

### Requirement: Biscuit is a built-in character
The library SHALL export a character named `Biscuit` from the package root, and SHALL include it in `characters`. Its `id` SHALL be `biscuit`, its `name` SHALL be `Biscuit`, and its `kind` SHALL be `cartoon dog`. It SHALL use `face: 'toon'`, its own `arm` and `legs`, `antenna: false` and `rocket: false`.

#### Scenario: Importable and listed
- **WHEN** a consumer imports `{ Biscuit, characters }` from `@markwylde/pet`
- **THEN** `Biscuit` is defined and `characters.Biscuit === Biscuit`

#### Scenario: Accessible label
- **WHEN** a pet is created with `character: Biscuit`
- **THEN** the pet's aria-label contains "Biscuit" and "cartoon dog"

### Requirement: Biscuit looks like a cartoon dog
Biscuit SHALL be an original cartoon dog design, not derived from the robot characters. It SHALL be drawn with a rounded furry head, a muzzle with a nose, two floppy ears, furry forelegs ending in round paws, stubby hind legs with big paws, and a tail. It SHALL NOT show a screen, antenna, propeller hat, ball-joint arms, shoe feet or rocket flames. Its framing SHALL fit fully inside its `iconViewBox`, and SHALL fit inside the stage at rest and during every built-in animation.

#### Scenario: Static icon
- **WHEN** `renderIcon(Biscuit, { title: 'Biscuit' })` is called
- **THEN** it returns an `<svg>` with `aria-label="Biscuit"` that contains the dog's body, ears and tail

### Requirement: Ears react to motion
Biscuit's ears SHALL rotate according to the pose's `antenna` value. Each animation's existing antenna sway SHALL therefore move the ears.

#### Scenario: Ears flop when jumping
- **WHEN** Biscuit is rendered with two poses that differ only in `antenna`
- **THEN** the ear transforms differ between the two renders

### Requirement: Biscuit flies by flapping its ears
When `propeller` > 0, Biscuit's ears SHALL lift outward and flap. The flap rate SHALL increase with `propeller`, so fast flight flaps faster than slow flight.

#### Scenario: Ears flap in flight
- **WHEN** Biscuit is rendered with `propeller` = 1 at several times within one second
- **THEN** the ear angles vary between the frames and are raised above their resting droop

#### Scenario: Faster flight, faster flaps
- **WHEN** ear angles are sampled over one second at `propeller` = 1 and at `propeller` = 3
- **THEN** the `propeller` = 3 samples complete more flap cycles

### Requirement: Tail wags faster when happy or busy
Biscuit's tail SHALL swing back and forth over time. Its wag frequency SHALL be higher when the pose is happy (`hearts` > 0, `sparkles` > 0, or `eye` is `happy` or `heart`) or busy (`code` > 0, `spinner` > 0, `progress` ≥ 0, or `gears` > 0) than when it is neutral. When the pose is sad (`tears` > 0 or `cloud` > 0), the tail SHALL hang low and barely move.

#### Scenario: Happy wag is faster than idle
- **WHEN** the tail angle is sampled over one second for an idle pose and for a pose with `hearts` > 0
- **THEN** the happy pose completes more wag cycles than the idle pose

#### Scenario: Sad tail droops
- **WHEN** Biscuit is rendered with `tears` > 0
- **THEN** the tail hangs lower and swings through a smaller angle than at idle

### Requirement: Biscuit appears in the demo and the site
The demo app's character picker SHALL offer Biscuit, and the demo heading SHALL show each character's name and kind correctly for all three built-ins. The landing site's crew list and footer SHALL include Biscuit.

#### Scenario: Pick Biscuit in the demo
- **WHEN** a user selects Biscuit in the demo's character picker
- **THEN** the pet switches to Biscuit and the heading names Biscuit as a dog

#### Scenario: Site crew
- **WHEN** the landing site loads
- **THEN** a Biscuit card with a "Pick Biscuit" button appears in the crew list, and Biscuit's icon appears in the footer
