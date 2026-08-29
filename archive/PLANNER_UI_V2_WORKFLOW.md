# Planner UI V2 — Review Workflow

**Status:** Proposed — awaiting design approval.  
**Suggested branch:** `codex/planner-ui-v2`  
**Implementation rule:** Build V2 alongside the current UI. Do not remove or
change the classic workspace during the V2 rollout.

## 1. Purpose

Create a simpler, desktop-first planner for room and cabinet design. It must
remain responsive for the web and preserve the existing application's canonical
project data, save/open behavior, undo/redo, 2D plan, 3D model, schedules, and
render capabilities.

The first approved visual direction is the light, minimal planner shell with:

- a practical project home;
- a four-item mode rail;
- a primary 2D/3D canvas;
- a contextual right inspector;
- a small, always-visible status bar.

## 2. User journey

```text
Open app
  → Project home
  → Create/open a project
  → Build room and openings in 2D
  → Place/configure cabinetry
  → Check the matching 3D model
  → Review schedule and presentation
  → Save/export
```

### A. Project home

**Goal:** Let a designer begin without navigating a dense workspace.

Primary actions:

- **Create a room**
- **Open project**
- Choose a starter: **Blank Room**, **Wardrobe Wall**, or **Import Floor Plan**
- Open a recent project

The user sees only these choices. Advanced setup stays out of the first screen.

### B. Build mode

**Goal:** Define the physical room in 2D.

- Select room, wall, door, or window in the canvas.
- The inspector displays only properties of the selected item.
- Room dimensions are editable as width, depth, and height.
- Doors and windows expose offset, width, height, and sill where applicable.
- A calibrated plan image can be used as a tracing underlay.
- The status bar reports grid, snap, units, zoom, and validation.

### C. Design mode

**Goal:** Place and size cabinetry predictably.

- Cabinet and furniture libraries appear in the left rail.
- Dragging or adding an item places it in the 2D plan.
- Objects snap to walls, corners, and nearby modules.
- Selecting an item opens its dimensions and finish in the inspector.
- All changes are undoable and update plan, model, and schedule from one
  project document.

### D. 2D / 3D review

**Goal:** Inspect the same design in either representation.

- The top bar has a persistent **2D / 3D** switch.
- 2D remains the primary authoring view.
- 3D is compiled from the same project; it is not a separate editable model.
- Selection, materials, positions, and dimensions must match in both views.

### E. Render and outputs

**Goal:** Produce trustworthy client and workshop material.

- The output view shows the millwork schedule and client preview entry point.
- Schedule export provides PDF and CSV.
- Render review remains a separate presentation workflow.
- Every export is derived from the current saved project state.

## 3. Workspace layout

```text
┌───────────────────────────────────────────────────────────────────────┐
│ Cabinet Studio · Project · Undo/Redo · [ 2D | 3D ] · Save · Export   │
├────────────┬─────────────────────────────────────────┬────────────────┤
│ Project    │                                         │ Selected item  │
│ Build      │             Main canvas                 │ Name           │
│ Design     │          2D plan or 3D model            │ W × H × D      │
│ Render     │                                         │ Preset sizes ▾ │
│            │                                         │ Materials ▾    │
├────────────┴─────────────────────────────────────────┴────────────────┤
│ Grid · Snap · Units · Zoom · Selection · Validation                  │
└───────────────────────────────────────────────────────────────────────┘
```

### Top bar

- Product identity and project name
- Undo / redo
- 2D / 3D view switch
- Save state and save action
- Export action

### Mode rail

The primary modes are deliberately limited to four:

1. **Project** — new, open, template, import, save
2. **Build** — room, walls, doors, windows, dimensions
3. **Design** — cabinets, furniture, materials, layers
4. **Render** — camera, preview, client-ready outputs

### Inspector

The inspector never shows a permanent configuration dump. It changes with the
selection:

| Selection | Inspector contents |
| --- | --- |
| Nothing | Helpful next action |
| Room | Width, depth, height, units |
| Wall | Name, length, material, visibility |
| Door/window | Host wall, offset, size, sill |
| Cabinet | W × H × D, common sizes, front configuration, materials |
| Furniture | W × H × D, rotation, material where supported |

### Status bar

- Grid size
- Snap state
- Display units
- Zoom
- Selected item summary
- Validation state

## 4. Dimension editor contract

The W × H × D control is a first-class component shared by plan and model.

- Store all values in millimetres.
- Initially display millimetres; make the control ready for centimetres and
  feet/inches as display options.
- Allow direct numeric entry and keyboard confirmation.
- Provide common-size presets in a dropdown.
- Clearly flag invalid range/clearance values before applying an export.
- Apply valid changes immediately through existing undoable domain commands.
- Never allow a visual-only dimension value that differs from saved project data.

## 5. Responsive behavior

| Surface | Layout |
| --- | --- |
| Desktop / Tauri | Mode rail + large canvas + inspector visible |
| Medium web/tablet | Narrow rail, canvas remains primary, inspector collapsible |
| Small web | Mode rail and inspector become drawers; canvas occupies screen |

The mobile web layout may support review and light edits. The full measured
authoring workflow remains optimized for a wide screen, mouse, and keyboard.

## 6. Coexistence and migration plan

1. Keep `LivingRoomPlanWorkspace` and its current UI unchanged.
2. Add a new V2 workspace composition rather than modifying the existing one.
3. Reuse the existing application controller, domain commands, project schema,
   persistence, and rendering components.
4. Add an explicit **Try new planner** entry from project home.
5. Keep **Classic workspace** available throughout development and testing.
6. Run both UIs against the same saved project fixtures.
7. Make V2 the default only after all acceptance checks pass and the team
   explicitly approves the switch.

## 7. Development sequence

### Milestone 1 — Design system and static shell

- Finalize visual tokens: spacing, type scale, colors, borders, states.
- Implement Project Home, top bar, mode rail, canvas frame, inspector frame,
  and status bar using static states.
- Validate desktop and responsive layouts before connecting data.

### Milestone 2 — Build mode integration

- Connect room dimensions, wall selection, doors, windows, and plan underlay.
- Connect units, snap, validation, and undo/redo feedback.

### Milestone 3 — Design mode integration

- Connect catalog rails and placement actions.
- Build the shared W × H × D editor and preset dropdown.
- Connect selection, movement, rotation, materials, duplicate, and delete.

### Milestone 4 — Shared plan/model canvas

- Embed the existing 2D plan and 3D model renderers in the V2 canvas.
- Implement the shared 2D/3D switch.
- Confirm every edit synchronizes immediately in both views.

### Milestone 5 — Deliver workflow

- Connect schedule preview and PDF/CSV exports.
- Connect the existing Render Studio through the V2 Render mode.
- Clearly show validation/review state before export.

### Milestone 6 — QA and controlled rollout

- Verify V2 and classic UI open the same saved project identically.
- Test save/open, autosave/recovery, undo/redo, imports, selection, resize,
  2D/3D alignment, schedule totals, and export.
- Test responsive web breakpoints and desktop Tauri window sizes.
- Retain classic workspace until V2 is accepted in real design sessions.

## 8. Acceptance checks before V2 becomes default

- A new user can create or open a room project from the home page.
- A user can edit room/opening dimensions in Build mode.
- A user can place, select, resize, and configure a cabinet in Design mode.
- W × H × D values match plan, model, schedule, and saved JSON.
- 2D and 3D are visibly synchronized.
- Saved projects round-trip through both V2 and classic UI without loss.
- The desktop layout and responsive web layout remain usable.
- The existing classic workspace is still available until approval to retire it.

## 9. Explicit non-goals for this UI phase

- Replacing the project domain model
- Deleting the classic UI
- Changing export calculations
- Adding a separate 3D authoring source
- Adding new AI or cloud dependencies

