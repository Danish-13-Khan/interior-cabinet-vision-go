# Phase 6 — V2 Review, Render, and Export

**Status:** Complete

## Delivered

- V2 Render mode presents a dedicated Review + Export panel beside the existing
  Render Studio.
- The panel previews live millwork schedule lines from the canonical project.
- CSV and PDF exports call the existing schedule/production export commands.
- Layout issues are shown before output actions, with the first three messages
  visible in an amber review state.
- The client-preview section directs the designer to select a camera and run
  Draft or Client Preview in the adjacent Render Studio.

## Data rule

Schedule, warnings, render settings, and exported files are derived from the
same `InteriorProject`. Render output does not become editable project geometry.

## Acceptance path

1. Enter V2 Render mode with at least one cabinet in the room.
2. Verify the schedule dimensions match Plan/Model values.
3. Introduce a layout issue and verify the review warning appears before export.
4. Capture a client preview in Render Studio.
5. Export CSV/PDF and reopen the project to verify design data remains intact.

