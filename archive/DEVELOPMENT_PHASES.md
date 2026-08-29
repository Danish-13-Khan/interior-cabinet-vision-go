# Interior Design Tool — Delivery Phases

This execution order follows `HLD.md`. Each phase ships through the desktop UI,
canonical project document, persistence, and automated tests. New source modules
should stay below 200 lines; split by responsibility rather than accumulating
feature-specific helpers in a single file.

### 1. Foundation

**Outcome:** A designer can create a project, define rooms, walls and openings,
save it locally, reopen it, and safely undo or redo edits.

**Implemented vertical slice**

- Canonical, versioned `InteriorProject` document in millimetres.
- Rooms, four walls, doors, windows, dimensions, and wall visibility.
- Schema validation, explicit migrations, and legacy-file migration.
- Desktop JSON save/open, browser fallback, recent files, and dirty state.
- Snapshot-based undo/redo across room and project edits.

**Key seams:** `src/domain/interiorProject/`, `src/domain/projectRooms/`,
`src/hooks/useProjectFileIo.ts`, and `src/hooks/useEditorHistory.ts`.

**Definition of done**

- A saved project round-trips rooms, openings, dimensions, units, and version.
- Invalid or old files are repaired or migrated with a recorded result.
- Undo/redo restores both project and active-room state.

### 2. 2D authoring

**Outcome:** A user can select a wall, place cabinet modules, transform them,
snap them predictably, and read dimensions in plan and elevation views.

**Acceptance checks**

- Placement respects wall, room, and opening boundaries.
- Move, rotate, resize, align, distribute, and snap are undoable commands.
- The same project state drives plan, elevation, and selection feedback.

### 3. Cabinet configurator

**Outcome:** Wall units can be configured visually with doors, drawers, panels,
materials, hardware, and construction rules.

**Acceptance checks**

- Cabinet configuration remains parametric and serializable.
- Invalid dimensions and clearances are visible before export.
- Material and hardware choices appear in technical output data.

### 4. Technical outputs

**Outcome:** The project generates plans, elevations, cutlists, schedules,
costing, quotations, and PDF/CSV exports from the same document.

**Acceptance checks**

- Dimensions, parts, quantities, and cost totals are deterministic.
- Exports identify their project version and remain reproducible after reload.
- Production warnings block misleading or incomplete output.

### 5. Visualization

**Outcome:** The parametric project synchronizes into a navigable 3D scene with
materials, lights, and cameras.

**Acceptance checks**

- 3D is compiled from the document; it is never an independently edited model.
- Room shell, openings, and cabinetry remain spatially aligned with 2D.
- Rendering fallbacks and asset failures are surfaced to the user.

### 6. Render polish

**Outcome:** Designers can produce reliable client-facing presentation renders.

**Acceptance checks**

- Render presets define camera, lighting, quality, and output dimensions.
- Review checks flag blank, poorly framed, or untrusted output.
- Accepted renders are packaged with relevant project context.

### 7. Pilot hardening

**Outcome:** Real workshop projects can be completed reliably and efficiently.

**Acceptance checks**

- Pilot scenarios cover authoring, validation, export, reload, and review.
- Performance budgets and error handling are measured on representative jobs.
- Production release is gated by review, revisions, and outstanding warnings.
