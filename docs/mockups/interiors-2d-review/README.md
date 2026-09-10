# Interiors 2D workspace — visual review

Status: **appearance approved (A default); live chrome landed as CSS only**.
Captured 10 September 2026. Separate from completed workflow build steps 1–8.
2D handlers are unchanged; inspector/command-map refinement is still open.

[Back to the workflow specification](../../UI_WORKFLOW_REDESIGN.md) ·
[Open the interactive mockup](index.html)

## Direction (approved)

**A — Light drafting studio** is the default appearance. **B** remains an
optional dark frame around the same bright plan. Both reduce permanent controls
to the project header, free area navigation and one compact plan toolbar. Room
essentials are contextual; less frequent settings expand on demand. Libraries
open only when needed.

**Functionality is unchanged by this approval.** Perspective / Orbit /
Walkthrough, plan tools, materials, review/export and engineering commands stay
reachable; only chrome and layout targets change after the refinement gate.

The interactive copy preserves its sandboxed iframe and Content Security Policy.
It is local and unpublished. Screenshots below cover every distinct 2D panel in
this proposal, including lower sections. They are normal viewport captures with
overlap, not a single scaled-down image; open any image to inspect it at full size.

## Screenshot walkthrough

### 1. A — Light drafting studio: header and toolbar

Preferred direction. Light controls, unnumbered area navigation and a single drawing toolbar. The next capture continues below this view.

![A — Light drafting studio: header and toolbar](screenshots/01-light-overview.png)

### 2. A — Complete plan and footer

The entire room boundary, opening, dimensions and footer are visible. A bright canvas and simplified symbols make the plan easier to read.

![A — Complete plan and footer](screenshots/02-light-lower.png)

### 3. Room settings expanded

Room essentials remain above Doors & windows, Import plan / PDF and Room & run management. The following capture shows the lower controls in full.

![Room settings expanded](screenshots/03-expanded-room.png)

### 4. Openings, underlay and runs — lower detail

Add door/window, Choose underlay, opacity, Calibrate scale, Manage rooms and Edit cabinet run are visible. These are proposed entry points; the dialogs are not implemented in this mockup.

![Openings, underlay and runs — lower detail](screenshots/04-expanded-room-lower.png)

### 5. Plan layers

Cabinets, Dimensions, Labels and Grid move out of the permanent top bars into an expandable section.

![Plan layers](screenshots/05-layers.png)

### 6. Export sheet and branding expanded

Drawing style, paper size, PDF/PNG choice, company name, drawing title and revision are shown together. This previews settings only; it does not generate an export.

![Export sheet and branding expanded](screenshots/06-export-expanded.png)

### 7. B — Dark frame: header and toolbar

Alternative dark chrome retains readable controls and the same navigation. The drawing surface remains light.

![B — Dark frame: header and toolbar](screenshots/07-dark-frame-top.png)

### 8. B — Bright plan inside dark chrome

Complete plan and footer in the alternative theme. Changing chrome does not require changing plan colors.

![B — Bright plan inside dark chrome](screenshots/08-dark-frame-plan.png)

### 9. Materials inspector

Soft sage, Natural oak and Chalk white demonstrate visible cabinet fills. These are illustrative choices, not the production material catalogue or application-scope design.

![Materials inspector](screenshots/09-materials.png)

### 10. Draw wall — completed example

Two clicks add a visible wall segment and an illustrative length in the status line. Production must preserve real snapping, topology, dimensions and undo.

![Draw wall — completed example](screenshots/10-draw-wall.png)

### 11. Measure — completed example

Two clicks add a dimension example. Mockup measurements use illustrative coordinates and are not manufacturing evidence.

![Measure — completed example](screenshots/11-measure.png)

## Existing functionality that must remain reachable

| Current surface | Proposed home | Preservation requirement |
| --- | --- | --- |
| Select, drawing, measure, pan | One plan toolbar | Existing handlers, keyboard commands and selection behavior |
| Fit, zoom, snapping | Plan toolbar / canvas / room essentials | Preserve camera state and real snap options; explicit zoom still needs design |
| Print toggles and export | Layers and Export sheet | Preserve every current layer, branding, template and output option |
| Door/window, underlay/PDF | Expandable room controls | Preserve import, calibration, placement and editing |
| Cabinet runs | Contextual run inspector | Preserve create/edit/snap and all existing run commands |
| Materials | Contextual material inspector | Preserve catalogue, slots, scope and actual material feedback |
| File, save, undo/redo, 2D/3D | Shared header | Restore all production entries; mock header is incomplete |
| Planning issues | Actionable footer entry | Preserve severity, counts, locate and review actions |

## Review limits and required refinements

- File and Save are placeholders. Undo only removes mock strokes. Redo, save
  status and a working 2D/3D switch still need to be added to the final design.
- Room fields demonstrate placement, not geometry editing. Wall/opening/run
  selection inspectors and full cabinet/object libraries need detailed frames.
- Cabinets and Review navigation only change mock context; Present is a
  placeholder that reveals sheet settings. These are not final designs for
  those areas and do not replace the existing workflow specification.
- Import, calibration, room/run management and export actions are previews.
  The four mock layer checkboxes do not represent the entire production layer
  inventory. Export needs its complete output and validation states.
- The footer needs the live issue-count/Locate treatment. Plan zoom controls,
  keyboard focus, disabled states and drawing cancellation need design coverage.
- Expanded sections grow this review page so all content can be inspected.
  Production must use independent panel scrolling without resizing or displacing
  the drawing canvas. Narrow stacking is a fallback, not mobile CAD acceptance.
- Dimensions, symbols and materials are illustrative. This is not evidence of
  drawing accuracy, manufacturing output or production performance.

## Approval checklist

- [x] Choose A (recommended) or B as the default appearance. → **A default; B optional**
- [x] Accept a bright 2D canvas with stronger linework and quieter grid.
- [x] Accept one plan toolbar; move layers/print options into expandable settings.
- [x] Accept contextual room essentials and on-demand libraries (pending left-library + selection-inspector frames).
- [x] Review all expanded captures for readability and text wrapping.
- [ ] Complete missing header, selection, zoom, issues and dialog states above.
- [ ] Map every production command to its retained entry point before relocation.
- [ ] Authorize implementation after the refinement pass (not after appearance alone).
- [x] Confirm functionality preservation: no feature removal; camera/perspective and domain commands stay.

## Verification in this pass

Opened both appearances and expanded room, underlay, run, layers and export
sections. Exercised two-click wall drawing and measurement and captured their
visible results. Inspected the screenshots for readable controls and included
lower captures where content continues. No application tests were run because
only documentation and static review assets changed.
