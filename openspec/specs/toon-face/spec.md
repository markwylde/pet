# toon-face Specification

## Purpose

Defines the screenless `toon` face kind: a cartoon face inked straight onto the body of a character that keeps the shared skeleton, and how screen-only effects behave when there is no screen.

## Requirements

### Requirement: Characters can choose a toon face
A character SHALL accept `face: 'toon'` in addition to `'crt'` and `'matrix'`. A toon character SHALL be drawn without a screen panel, screen gradient, scanlines, LED grid or glass highlight. The face SHALL be drawn in the character's `palette.phosphor` colour as ink, directly over the body.

#### Scenario: Toon character has no screen
- **WHEN** a pet is created with a character whose `face` is `'toon'`
- **THEN** the rendered SVG contains the face, and contains no screen background, scanline pattern, matrix grid or glass highlight

#### Scenario: Existing faces unchanged
- **WHEN** a pet is rendered with Pixel (`crt`) or Rack (`matrix`)
- **THEN** its output is the same as before this change

### Requirement: Toon face draws every expression
The toon face SHALL render every `EyeShape` (`open`, `happy`, `closed`, `heart`, `x`, `squint`, `spiral`, `wide`). It SHALL follow `eyeOpen` for blinking and `lookX`/`lookY` for gaze. It SHALL draw brows when `brow` > 0, blush when `blush` > 0, a mouth that follows `mouthCurve`/`mouthOpen`/`mouthWidth`, and tears when `tears` > 0.

#### Scenario: Every eye shape renders
- **WHEN** a toon character is rendered with each `EyeShape` in turn
- **THEN** each render succeeds and produces distinct eye markup

#### Scenario: Built-in animations play
- **WHEN** every built-in animation is played on a toon character
- **THEN** none of them throws, and each frame produces valid SVG

### Requirement: Screen overlays move to a thought bubble
For a toon character, the progress bar, scrolling code and spinner SHALL be drawn inside a thought bubble above the character's head, positioned with `effectsOffsetY`, instead of on a screen. The bubble SHALL appear only while at least one of those overlays is active. The mouth SHALL stay visible while the bubble shows.

#### Scenario: Loading shows a bubble
- **WHEN** a toon character plays an animation that sets `progress` ≥ 0, `code` > 0 or `spinner` > 0
- **THEN** a thought bubble containing that overlay is drawn above the head

#### Scenario: No bubble at rest
- **WHEN** a toon character is idle, with no progress, code or spinner
- **THEN** no thought bubble is drawn

### Requirement: Screen effects degrade gracefully without a screen
For a toon character, `glitch` > 0 SHALL jitter the face horizontally, and `screen` < 1 SHALL dim the face with a shadow whose opacity is proportional to `1 - screen`.

#### Scenario: Gloomy dims the face
- **WHEN** a toon character renders a pose with `screen` = 0.6
- **THEN** a shadow is drawn over the face, and its opacity is greater than zero
