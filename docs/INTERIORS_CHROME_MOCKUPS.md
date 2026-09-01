# Interiors Chrome Mockups

**Status:** UI reference for the next Interiors HARDEN pass  
**Governing strategy:** [Cabinet Studio Product and Development Book](./CABINET_STUDIO_PRODUCT_BOOK.md)  
**Interactive reference:** [Open the complete four-screen A/B mockup](./mockups/interiors-chrome-mockups.html)

## 1. Purpose

This document records the agreed direction for simplifying the Interiors user
experience without changing Cabinet Studio into a general-purpose interior
decorating product.

The interaction reference is Floorplanner / RoomSketcher / Rayon-style canvas
authoring. The product identity remains the Cabinet Studio golden loop:

```text
Measured room
  → cabinet run
  → credible 2D / 3D review
  → priced proposal
  → client approval
  → same cabinet IDs sent to engineering
```

The mockups change the **Interiors chrome and information architecture**. They do
not replace room geometry, cabinet adapters, quotation, proposal, approval,
engineering handoff, or production derivations.

## 2. Product boundaries

The mockups must preserve these constraints from the Product Book:

- Cabinet-sales completion comes before general-interiors breadth.
- Cabinets, cabinet runs, open shelves, fillers, and countertops are the
  primary designed objects.
- Furniture may remain a small supporting set; it is not a first-class product
  path or catalog race.
- 3D must credibly represent the same cabinets; photoreal or AI-decoration
  parity is not the target.
- Quote, proposal, approval, and engineering handoff remain prominent closing
  outcomes after the plan exists.
- Production-only controls, schedules, and raw file formats must not crowd the
  sales design surface.
- The Golden Cabinet Run name may be removed from normal UI, but the complete
  revise → price → freeze → proposal → approval → engineering loop remains the
  primary acceptance journey.

## 3. Shared application model

All authoring screens use one common shell:

```text
┌───────────────────────────────────────────────────────────────┐
│ Project · Room · Revision    Undo/Redo    2D | 3D    Present  │
├───────────┬─────────────────────────────────────┬─────────────┤
│ One tool  │                                     │ Contextual  │
│ rail      │               CANVAS                │ properties  │
│           │                                     │             │
└───────────┴─────────────────────────────────────┴─────────────┘
```

Rules:

1. Open on useful work, not a four-step workflow sermon.
2. Use one tool rail.
3. Show properties only for the current selection.
4. Treat 2D and 3D as views of the same authored project, not workflow stages.
5. Keep advanced controls discoverable from the relevant wall, opening,
   cabinet, or run.
6. Put commercial closure behind one clear `Present` action.
7. Unlock `Send to Engineering` only after the required frozen revision and
   approval state exist.

## 4. Screen 1 — Projects

### Iteration A — Calm guided (recommended)

- Clear `New cabinet job` entry point.
- Short explanation of the room-to-engineering value proposition.
- Recent jobs shown with room/run type, revision, and meaningful status.
- Best for first-use comprehension and smaller shops.

### Iteration B — Compact professional

- Searchable job table.
- Status filters for Design, Quoted, and Engineering.
- Higher information density for shops managing many concurrent jobs.
- Candidate for a later density preference, not the initial default.

### Acceptance

A user can create or reopen a job and enter the design canvas without seeing
internal demos, production reports, or QA terminology.

## 5. Screen 2 — Draw Room

### Iteration A — Calm guided (recommended)

- Labeled rail: Select, Room, Wall, Door, Window, Cabinet, Run, Shelf, Material.
- Large 2D plan canvas with direct wall and opening manipulation.
- Right-side properties appear for the selected wall or opening.
- Minimal status strip for units, scale, object count, and blocking validity.

### Iteration B — Compact professional

- Icon-only tool rail.
- Floating contextual dimensions near the selected wall.
- Maximum canvas area for experienced operators.
- Appropriate after tool recognition and keyboard shortcuts are proven.

### Acceptance

A trained user can create the benchmark room, including the known wall, door,
window, height, and thickness, without navigating between permanent panels.

## 6. Screen 3 — Cabinet Run

### Iteration A — Calm guided (recommended)

- Cabinet-family catalog beside the same canvas.
- Base, drawer, wall, tall, and open-shelf families are first-class.
- Cabinets are placed against a wall and snapped into a run.
- The same selected cabinet is editable in 2D and 3D.
- The inspector exposes size, fronts, interior, material, and run membership.
- Run length, fillers, countertop continuity, and actionable warnings remain
  visible without exposing production reports.

### Iteration B — Compact professional

- Narrow catalog and icon rail.
- Floating W × H × D editor over the 3D view.
- Faster for experienced users but less self-explanatory.
- Candidate for a later compact-density mode.

### Acceptance

The complete Golden brief can be built and revised while preserving cabinet
types, cabinet IDs, run membership, fillers, countertop, and downstream price.

## 7. Screen 4 — Present and Send

### Iteration A — Calm guided (recommended)

`Present` opens a contextual closing panel over the credible 3D client view:

1. Review the live selling total.
2. Review commercial settings.
3. Freeze the current revision's quote.
4. Create the proposal PDF.
5. Record client approval against that revision.
6. Send the same cabinet identities to engineering.

Only blocking validation is shown. Raw CSV, schedule, production, and machine
outputs remain secondary outcomes outside this panel.

### Iteration B — Compact professional

- Dedicated closing page.
- Larger proposal preview and deliverables summary.
- Explicit revision milestone rail.
- Better for commercial review meetings or complex approvals.

### Acceptance

A cabinet revision updates the live price; quote freeze records the revision;
proposal and approval reference the same revision; engineering receives the
same room, openings, cabinets, configurations, run, fillers, and countertop.

## 8. Recommended implementation roadmap

```text
Shared Interiors shell
  → Projects
  → Draw Room
  → Cabinet Run
  → Present and Send
  → remove obsolete Interiors chrome
  → responsive, accessibility, persistence, and golden-loop hardening
```

### Phase 1 — Shared shell

- Replace duplicate Interiors headers and the four-step rail.
- Introduce the common project header, single tool rail, canvas, and contextual
  inspector composition.
- Keep existing domain controllers and persistence paths.

### Phase 2 — Projects

- Ship Iteration A.
- Preserve file open, recovery, recent projects, create job, and save/reopen.

### Phase 3 — Draw Room

- Route existing room, wall, opening, underlay, snap, and validation commands
  into the new tool-first chrome.

### Phase 4 — Cabinet Run

- Route the existing cabinet catalog, placement, run, material, geometry, and
  configuration editors into the shared canvas.

### Phase 5 — Present and Send

- Consolidate live price, quote freeze, proposal, approval, and handoff into
  the `Present` outcome.
- Keep schedule and production outputs outside the drawing surface.

### Phase 6 — Remove old chrome

- Remove the workflow step rail, Review Studio presentation, permanent empty
  inspectors, customer-visible Golden/Release demo buttons, and workbench
  controls that do not belong on the Interiors canvas.

### Phase 7 — Hardening

- Responsive desktop and tablet behavior.
- Keyboard and focus behavior.
- Undo/redo across room and cabinet edits.
- Save/reopen and recovery.
- Stable selection between 2D and 3D.
- Quote staleness after revision.
- Proposal/approval/engineering revision integrity.
- Golden workflow end-to-end coverage.

## 9. Design decision

Iteration A is the recommended default for all four screens. Iteration B is
retained as a compact professional direction and may be adopted selectively
after the default workflow is validated. Both directions share the same
product model and must never create separate authored scenes or cabinet data.

