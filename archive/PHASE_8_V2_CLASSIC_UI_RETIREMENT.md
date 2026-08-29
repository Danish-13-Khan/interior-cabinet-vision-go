# Phase 8 — V2 Classic UI Retirement

**Status:** Complete

## Retired

- The New UI / Classic UI toggle.
- Conditional classic workspace rendering.
- Legacy `LivingRoomProjectHome` component.

## V2-only contract

`LivingRoomPlanWorkspace` now always renders the V2 shell, V2 Project Home,
Build/Design workflow constraints, synchronized Plan/Model review, and the
Review + Export panel. The project domain model, persistence, render compiler,
and export systems are unchanged.

## Parity checks

- Save/open and autosave recovery: existing editor commands
- Undo/redo: existing shared editor commands
- 2D/3D: shared project + scene compiler
- Plan underlay import: existing Build command
- Schedule/PDF/CSV: shared millwork hook
- Render/client preview: existing Render Studio

