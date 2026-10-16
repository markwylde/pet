## Purpose

Lets a character replace or hide the robot skeleton parts the library draws for every character (stick arms, shoe feet, antenna, propeller hat and rocket flames), so characters that aren't robots can bring their own anatomy.

## ADDED Requirements

### Requirement: Characters can draw their own arms
A character SHALL accept an optional `arm` function. It receives the side (`'L'` or `'R'`), the arm angle from the pose, the shoulder anchor, and the same `pose`, `time`, `id`, `url` and `h` helpers that `body` gets. When `arm` is given, its markup SHALL replace the shared stick arm on both sides, drawn in the same layer. When it is omitted, the shared arm SHALL be drawn as today.

#### Scenario: Custom arm replaces stick arm
- **WHEN** a character defines `arm` and is rendered
- **THEN** the output contains the custom arm markup for both sides, and none of the shared arm's joint or hand circles

#### Scenario: Arm follows animation
- **WHEN** a character with a custom `arm` plays `happy1`
- **THEN** the `arm` function is called with angles that change over the animation

### Requirement: Characters can draw their own legs
A character SHALL accept an optional `legs` function. It receives the left and right lift values from the pose, plus the same helpers as `arm`. When `legs` is given, its markup SHALL replace the shared legs and feet. When it is omitted, the shared legs SHALL be drawn as today.

#### Scenario: Custom legs replace shoe feet
- **WHEN** a character defines `legs` and is rendered
- **THEN** the shared shoe-shaped feet are not drawn, and the custom legs are

### Requirement: Characters can hide the antenna and propeller
A character SHALL accept `antenna: false`, and the default SHALL be `true`. When it is `false`, the library SHALL NOT draw the antenna stalk, the bobble or the propeller hat in any pose. The `propeller` pose value SHALL still be passed to `body` so the character can show flight its own way.

#### Scenario: No antenna or hat while flying
- **WHEN** a character with `antenna: false` plays `flying-slow`
- **THEN** no antenna or propeller hat markup appears in any frame

### Requirement: Characters can hide rocket flames
A character SHALL accept `rocket: false`, and the default SHALL be `true`. When it is `false`, the library SHALL NOT draw foot flames. Speed lines SHALL still be drawn.

#### Scenario: Fast flight without flames
- **WHEN** a character with `rocket: false` plays `flying-fast`
- **THEN** no flame markup appears, and speed lines do

### Requirement: Defaults keep existing characters unchanged
When none of `arm`, `legs`, `antenna` or `rocket` is given, rendering SHALL be identical to the behaviour before this change.

#### Scenario: Pixel and Rack unchanged
- **WHEN** Pixel and Rack icons are rendered
- **THEN** the markup is byte-identical to the markup produced before this change
