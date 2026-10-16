## Purpose

Whiskers is a built-in ginger cartoon cat: the first pet that is an animal rather than a robot gadget. It draws its whole figure itself and interprets every animation in a cat-like way.

## ADDED Requirements

### Requirement: Whiskers is a built-in character
The library SHALL export a character named `Whiskers` with id `whiskers`, name `Whiskers` and kind `cartoon cat`, and SHALL include it in the `characters` collection alongside Pixel and Rack. Pixel SHALL remain the default character.

#### Scenario: Import and use
- **WHEN** a consumer creates a pet with `character: Whiskers`
- **THEN** the pet renders Whiskers and `pet.character` is `Whiskers`

#### Scenario: Collection
- **WHEN** a consumer reads `characters`
- **THEN** it contains `Pixel`, `Rack` and `Whiskers`

#### Scenario: Accessible label
- **WHEN** a Whiskers pet is mounted
- **THEN** its body's accessible label contains "Whiskers"

### Requirement: Whiskers is a cartoon cat, not a robot
Whiskers SHALL be a self-drawn character (`skeleton: false`) drawn as a ginger cat with a cream muzzle and belly, tabby stripes, pointed ears, a tail, and four paws. It SHALL have no screen, stick limbs, antenna or robot props.

#### Scenario: No robot parts
- **WHEN** Whiskers is rendered in any pose
- **THEN** the SVG contains no screen, stick limbs, antenna, propeller hat, jet flames or keyboard

### Requirement: Cat face shows every expression
Whiskers' face SHALL have a nose and whiskers, and SHALL show a distinct, recognisable look for every eye shape (`open`, `happy`, `closed`, `heart`, `x`, `squint`, `spiral`, `wide`). It SHALL follow eye openness (blinks), looking direction, brows, blush and tears. Its mouth SHALL follow the pose's smile/frown and open as `mouthOpen` increases so it visibly talks.

#### Scenario: Every eye shape renders
- **WHEN** Whiskers is rendered with each eye shape in turn
- **THEN** each produces different eye markup without error

#### Scenario: Talking
- **WHEN** the pose's `mouthOpen` goes from 0 to 1
- **THEN** Whiskers' mouth is drawn open

#### Scenario: Crying
- **WHEN** the pose's `tears` is above zero
- **THEN** tears fall from Whiskers' eyes

### Requirement: Pose drives the cat's body
Whiskers SHALL interpret the pose with its own anatomy: `armL`/`armR` raise its left/right front paws, `legL`/`legR` lift its back paws, `antenna` sway rotates its ears, and `sweat` shows a sweat drop by its head. While `propeller` or `flame` is active (flying), Whiskers SHALL show a stretched-out flying pose with ears swept back instead of any robot prop.

#### Scenario: Waving
- **WHEN** the pose's `armR` rises from 8 to 140
- **THEN** Whiskers' right front paw is drawn raised

#### Scenario: Ear twitch
- **WHEN** the pose's `antenna` changes from 0 to 20
- **THEN** Whiskers' ears rotate in response

#### Scenario: Flying
- **WHEN** Whiskers plays the fly animation
- **THEN** it shows its flying pose with ears back and no propeller hat or flames

### Requirement: Tail swishes faster when busy
Whiskers SHALL draw a tail that swishes continuously over time, faster while busy (`code`, `spinner`, `progress` or `gears` active) than at rest.

#### Scenario: Idle swish
- **WHEN** Whiskers is rendered at two different times in the resting pose
- **THEN** the tail is drawn in different positions

#### Scenario: Busy swish
- **WHEN** Whiskers is busy
- **THEN** its tail swishes at a visibly higher rate than at rest

### Requirement: Static icon
`renderIcon(Whiskers)` and `<PetIcon character={Whiskers} />` SHALL frame the whole cat, including ears and tail.

#### Scenario: Labelled icon
- **WHEN** `renderIcon(Whiskers, { title: 'Whiskers' })` is called
- **THEN** it returns an SVG with `aria-label="Whiskers"`

### Requirement: Whiskers appears in the demo and site
The demo app's character picker SHALL offer Whiskers, and its heading SHALL describe each character using the character's own kind. The site's crew list and footer SHALL include Whiskers.

#### Scenario: Demo picker
- **WHEN** the user selects Whiskers in the demo
- **THEN** the pet becomes Whiskers and the heading names Whiskers
