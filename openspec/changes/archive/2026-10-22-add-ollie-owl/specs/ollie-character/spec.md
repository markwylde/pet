## Purpose

Ollie is a built-in cartoon night owl in tiny reading glasses. It draws its whole figure itself, interprets every animation in an owl-like way, and has its own idle and busy behaviours.

## ADDED Requirements

### Requirement: Ollie is a built-in character
The library SHALL export a character named `Ollie` with id `ollie`, name `Ollie` and kind `night owl`, and SHALL include it in the `characters` collection alongside the existing built-ins. Pixel SHALL remain the default character.

#### Scenario: Import and use
- **WHEN** a consumer creates a pet with `character: Ollie`
- **THEN** the pet renders Ollie and `pet.character` is `Ollie`

#### Scenario: Collection
- **WHEN** a consumer reads `characters`
- **THEN** it contains `Ollie` as well as `Pixel`, `Rack`, `Biscuit` and `Whiskers`

#### Scenario: Accessible label
- **WHEN** an Ollie pet is mounted
- **THEN** its body's accessible label contains "Ollie"

### Requirement: Ollie is a cartoon owl, not a robot
Ollie SHALL be a self-drawn character (`skeleton: false`) drawn as a cartoon owl in thick cartoon ink. Its head and body SHALL read as one egg-shaped silhouette with no neck, with the ear tufts as the top corners of that silhouette. It SHALL have big eyes set in pale round eye discs, an orange beak between them, round reading glasses, a pale chevron-marked belly, two wings with feathered tips, orange feet and tail feathers. It SHALL have no screen, stick limbs, antenna or robot props.

#### Scenario: No robot parts
- **WHEN** Ollie is rendered in any pose, including one with `propeller`, `flame` and `keyboard` active
- **THEN** the SVG contains no screen, stick limbs, antenna, propeller hat, jet flames or keyboard

### Requirement: Owl face shows every expression
Ollie's face SHALL show a distinct, recognisable look for every eye shape (`open`, `happy`, `closed`, `heart`, `x`, `squint`, `spiral`, `wide`). It SHALL follow eye openness (blinks), looking direction, brows, blush and tears. Its beak SHALL follow the pose's smile and frown, and SHALL open as `mouthOpen` increases so it visibly talks. The eyes SHALL stay visible behind the glasses in every shape.

#### Scenario: Every eye shape renders
- **WHEN** Ollie is rendered with each eye shape in turn
- **THEN** each produces different eye markup without error

#### Scenario: Talking
- **WHEN** the pose's `mouthOpen` goes from 0 to 1
- **THEN** Ollie's beak is drawn open

#### Scenario: Crying
- **WHEN** the pose's `tears` is above zero
- **THEN** tears fall from Ollie's eyes

### Requirement: Pose drives the owl's body
Ollie SHALL interpret the pose with its own anatomy. `armL`/`armR` SHALL raise its left and right wings, `legL`/`legR` SHALL lift its talons, `antenna` sway SHALL tilt its head, and `sweat` SHALL show a sweat drop by its head. While `propeller` or `flame` is active, Ollie SHALL flap both wings continuously, faster as `propeller` grows, and SHALL tuck its talons under its body instead of showing a robot prop.

#### Scenario: Waving
- **WHEN** the pose's `armR` rises from 8 to 140
- **THEN** Ollie's right wing is drawn raised

#### Scenario: Head tilt from sway
- **WHEN** the pose's `antenna` changes from 0 to 20
- **THEN** Ollie's head is drawn tilted

#### Scenario: Flying
- **WHEN** Ollie plays the fly animation
- **THEN** its wings are drawn in different positions at different times, and no propeller hat or flames appear

### Requirement: Glasses slide down while busy
Ollie SHALL wear its glasses high on its face at rest. While busy (`code`, `spinner`, `progress` or `gears` active), the glasses SHALL slide down towards the tip of its beak. When it stops being busy, they SHALL return to the resting position.

#### Scenario: Busy glasses
- **WHEN** Ollie is rendered busy and at rest at the same time
- **THEN** the glasses are drawn lower in the busy render

#### Scenario: Back to rest
- **WHEN** Ollie is rendered after being busy, in a pose with no busy fields active
- **THEN** the glasses are drawn in the same position as any other resting render

### Requirement: Idle head-tilt
In a resting pose, Ollie's head SHALL tilt slowly from side to side over time, as if it were curious, even when `antenna` is 0. The tilt SHALL be small enough that the head stays attached to the body.

#### Scenario: Head moves over time
- **WHEN** Ollie is rendered at two different times in the resting pose
- **THEN** the head is drawn at different tilts

### Requirement: Feathers ruffle while busy
While busy, Ollie's chest feathers SHALL ruffle visibly over time. At rest they SHALL lie still.

#### Scenario: Ruffle when busy
- **WHEN** a busy Ollie is rendered at two different times
- **THEN** the chest feathers are drawn differently

#### Scenario: Still at rest
- **WHEN** a resting Ollie is rendered at two different times
- **THEN** the chest feathers are drawn identically

### Requirement: Static icon
`renderIcon(Ollie)` and `<PetIcon character={Ollie} />` SHALL frame the whole owl, including ear tufts, wings and tail feathers.

#### Scenario: Labelled icon
- **WHEN** `renderIcon(Ollie, { title: 'Ollie' })` is called
- **THEN** it returns an SVG with `aria-label="Ollie"`

### Requirement: Ollie appears in the demo, site and docs
The demo app's character picker SHALL offer Ollie. The site's crew list SHALL include Ollie with its blurb, and its footer SHALL include Ollie's icon. The README SHALL list Ollie among the built-in characters and exports, and the README's character line-up image SHALL include Ollie.

#### Scenario: Demo picker
- **WHEN** the user selects Ollie in the demo
- **THEN** the pet becomes Ollie and the heading names Ollie as a "night owl"

#### Scenario: Site crew
- **WHEN** the site loads
- **THEN** the crew list shows an Ollie card with a "Pick Ollie" button
