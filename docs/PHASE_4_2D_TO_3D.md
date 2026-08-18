# Phase 4 — 2D to 3D

**Status:** Complete

The planner has one canonical `InteriorProject`. The 2D plan edits that document, and the model viewport compiles that same document into a Three.js scene—there is no separate 3D source of truth.

## Delivered

- 2D walls compile into 3D wall segments.
- Doors and windows cut openings into their host walls and render as 3D opening nodes.
- Cabinet objects use their same position, rotation, size, and material data in 3D.
- The product header switches between the shared 2D plan and 3D model in one click.
- The model viewport now includes Orbit, Front, Top, and Perspective views; Perspective preserves project-camera framing.
- Orbit, pan, zoom, selection, movement, and the cutaway control remain available in the 3D viewport.

## Acceptance path

1. Draw or resize a room in **Build** while in 2D.
2. Add a door/window and a wardrobe-wall cabinet.
3. Select **3D Model** in the header.
4. Use the view buttons to inspect the matching walls, opening, and cabinet from Orbit, Front, Top, and Perspective.
