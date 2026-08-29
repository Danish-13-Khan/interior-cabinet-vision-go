# Phase 2 — 2D room authoring

**Status:** Complete

The wardrobe-wall flow now begins with an editable, persistent room shell.

- Build mode edits room width, depth, and height in millimetres.
- Each canonical wall is selectable in the plan or from the Build panel.
- Doors and windows can be added to the selected wall, edited for offset, width, height, and sill, or removed.
- Opening positions are constrained to the length of their host wall, preserving a valid 2D shell for the 3D model.
- An imported floor plan remains an optional calibrated tracing underlay.

This phase intentionally keeps wall authoring rectangular. Multi-segment walls, freehand drawing, room merging, and floor-plan recognition are later phases.
