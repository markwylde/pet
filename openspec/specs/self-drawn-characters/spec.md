# self-drawn-characters Specification

## Purpose

Lets a character opt out of the shared robot skeleton (screen face, stick limbs, antenna and robot props) and draw its whole figure from the animation pose, so pets that aren't gadgets can use the same animation system.

## Requirements

### Requirement: Skeleton opt-out
A character SHALL be able to set `skeleton: false`. When omitted in `defineCharacter`, `skeleton` SHALL default to `true`, and characters with the skeleton SHALL render exactly as before this change.

#### Scenario: Default keeps the skeleton
- **WHEN** a character is defined without `skeleton`
- **THEN** it renders with the screen face, stick limbs and antenna as before

#### Scenario: Existing characters unchanged
- **WHEN** Pixel or Rack is rendered in any pose
- **THEN** the output is unchanged from before this change

### Requirement: Self-drawn characters own their whole figure
For a character with `skeleton: false`, the library SHALL NOT draw the screen (face, background, glass, scanlines), arms, legs, antenna, propeller hat, jet flames, keyboard, sweat drop, or the progress, code, spinner and tears read-outs. The character's body function SHALL be the only thing drawn inside the body transform, and it SHALL receive the full current pose and time.

#### Scenario: No robot parts
- **WHEN** a `skeleton: false` character is rendered in a pose with `propeller`, `flame`, `keyboard`, `progress` and `code` all active
- **THEN** none of the propeller hat, flames, keyboard, progress bar, code lines, screen or stick limbs appear in the SVG

#### Scenario: Body receives the pose
- **WHEN** a `skeleton: false` character is rendered with `armR` set to 120
- **THEN** its body function is called with a pose whose `armR` is 120

### Requirement: Generic motion and effects still apply
For a character with `skeleton: false`, the library SHALL still apply the body transform (position, rotation, squash/stretch), and SHALL still draw the ground shadow, speed lines, and the above-head effects (hearts, zzz, sparkles, rain cloud, gears), offset by `effectsOffsetY`.

#### Scenario: Hearts above a self-drawn character
- **WHEN** a `skeleton: false` character plays an animation that sets `hearts`
- **THEN** hearts are drawn above it

#### Scenario: Flip
- **WHEN** a `skeleton: false` character plays an animation that rotates the body
- **THEN** the character's drawing is rotated with the body transform
