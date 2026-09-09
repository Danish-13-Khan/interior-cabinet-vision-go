# Cabinet Studio UI workflow redesign

Status: proposed design specification for review, September 9, 2026.
This pass changes documentation and local references only. It does not implement
the redesign, approve its release, or replace the Product Book.

## Problem and intended outcome

The supplied kitchen, bathroom, object-browser, and style-preset screenshots
show pale text on pale toolbar buttons, overlapping or clipped text, excessive
stacked chrome, compressed object cards, an overflowing inspector, obstructed
cabinet views, and unfinished model/material presentation. The target is a
readable, canvas-first workspace with every existing operation still reachable.

The earlier [Interiors chrome reference](INTERIORS_CHROME_MOCKUPS.md) remains
background context. This proposal adds explicit overflow rules and a reviewable
five-area navigation model. Navigation areas are freely selectable, not a
mandatory wizard. Existing product boundaries and release gates still apply.

## Complete journey

Projects → create/open/restore job → Room → Cabinets → Materials → Review
→ price → freeze quote → Present/proposal → record approval → engineering
→ production review/export. Return to any design area to revise; existing quote
drift and approval rules determine which downstream states become stale.

### Shared shell

- Header: project/room/revision, file menu, save state, undo/redo, 2D/3D, Present.
- Navigation: Room, Cabinets, Materials, Review, Present; preserve selection,
  camera and panel state where appropriate across switches.
- Left panel: tools or library relevant to the active area. Search and category
  selection stay anchored to that library, not scattered across the viewport.
- Canvas: one compact view toolbar; view preset, Orbit/Walkthrough, Fit, Focus.
  FOV, camera height and other advanced camera options live in a popover.
- Right inspector: selected object identity and essentials, then expandable
  sections. A single property has one authoritative editing control.
- Footer: units, snap and actionable issue count. Detailed help is on demand.
- Keyboard shortcuts remain supported, including command access when panels
  are collapsed. Focus must not jump during field edits or panel expansion.

### 0. Projects and recovery

New job, saved jobs, templates, file open/import, autosave recovery, and room
navigation remain available. Opening malformed or older projects must produce
an actionable recovery state rather than a blank screen. Surface save failure,
unsaved changes and restore choices. Do not overwrite recovery data merely to
preview a template. This screen is specified here but not drawn in the concept.

### 1. Room

Default to the measured plan. Left tools expose selection, room/wall drawing,
doors, windows, obstacles, underlay import, measurement and room management.
Selecting a wall shows length, height and thickness; advanced sections retain
node joins/splits, offsets, coordinates and panel attachment. Openings show their
own dimensions, elevation and placement. Existing snap, topology, dimensions,
undo and underlay tools retain their real behavior.

Switching to 3D must preserve room identity. View cutaway is separate from
lowering a wall to a plan trace or changing wall height. Explain the difference
where structural actions are exposed. Empty selection shows room essentials.

### 2. Cabinets and supporting objects

Browse base/wall/tall cabinets, runs, open shelves, fillers, countertops and
supporting objects. Keep search and category filtering. Cards show a preview,
full readable name and dimensions on separate lines. Missing previews use a
labelled fallback; a dimension-only pill is never an acceptable card.

Select a library item → preview placement → place with existing snap/fit rules
→ inspect/resize → duplicate/rotate/delete as needed. Distinguish library
preview from a placed object. Selecting a run exposes run-level alignment,
fillers, countertop and validation operations. Advanced cabinet construction,
composition, openings, materials and production fields remain reachable.

### 3. Materials

Select a surface/object → select its material slot → preview a finish → choose
scope → apply through the existing command/undo system. Current finish and
target slot stay visible. Scope must be explicit: face/slot, object, compatible
run, or another currently supported scope. Do not invent unsupported bulk edits.

Preserve imported finishes, texture options, UV scale/rotation, material slots,
and existing style presets. Full style names wrap; palette strips supplement
names. Applying a preset must disclose its scope and retain undo. Texture load
failure needs an explanation and retry/fallback, not silent substitution.
Validate material assignments all the way to compiled scene and render output.

### 4. Review and quote

Issues are grouped by severity with object identity, plain explanation and
Locate/Fix actions. Focus the affected cabinet and show relevant properties.
Keep unsupported corner adapters visibly actionable. Distinguish cosmetic
preview issues from production-blocking geometry or data problems.

Review price → edit existing commercial fields → see current totals and pricing
source → freeze revision. Preserve costing settings, currency/tax behavior,
quote snapshots and stale-design detection. The UI must not imply approval or
manufacturability from a clean-looking render. Quote details are not implemented
in the concept; its review actions show only their intended navigation entry.

### 5. Present, approval, and engineering

Present uses saved views with editing panels, selection marks, grids and debug
text hidden. Return to design restores context. Preserve camera decks, render
settings, image/PDF exports, branding and proposal generation. Keep technical
quality diagnostics outside the client view without losing access to them.

Record approval against the correct revision using existing approval controls.
Send the same cabinet identities and design revision to engineering. Engineering
retains technical drawings, cutlists, machining/production files, validation,
readiness gates and overrides already supported. Do not force these controls
into the everyday sales canvas. Changes after approval retain existing drift
and readiness rules. The concept has no live approval, pricing or export engine.

## Layout and expansion contract

| Area | Rule | Review case |
| --- | --- | --- |
| Header/view toolbar | Wrap or move secondary commands to labelled menus; never shrink text to fit | Narrow laptop and 200% zoom |
| Desktop columns | Bounded side panels with a flexible canvas; children use min-width: 0 | 1280 and 1440 px |
| Library cards | Content-driven height; preview, name, dimensions are separate rows/columns; no fixed tiny button height | Long shower and refrigerator names |
| Category filters | Wrapping controls or labelled select; retain accessible category names | Kitchen Appliances and Bathroom |
| Inspector | Essentials first; expandable sections grow in normal flow; dedicated panel scrolling in the eventual desktop app | Open every section |
| Style presets | Full-width entries with palette strip and wrapping name | Warm Contemporary fully visible |
| Forms | Labels and units remain visible; fields cannot force parent width; errors wrap below inputs | Large values and validation text |
| Smaller widths | Reflow/collapse side panels before compressing the canvas; retain explicit reopen controls | 850, 736 and 390 px |
| Empty/loading/error | Explain state and next action; reserve stable preview space | No search results, missing texture/model |

The standalone reference intentionally grows vertically for screenshot review.
Its stacked narrow layout is a fallback concept, not a promise of a complete
mobile CAD editor. The production desktop layout needs independently scrollable
panels and a stable canvas, verified with all accordions expanded.

## Functionality preservation map

This is a capability-level migration map, not a completed handler-by-handler
inventory. Before implementation, enumerate current commands and shortcuts and
append their exact old/new entry points and relevant checks.

| Existing capability | Intended destination | Preservation check |
| --- | --- | --- |
| Files, recovery, rooms, revisions | Header / Projects | Save/reopen and legacy project recovery |
| Undo/redo and shortcuts | Header + existing keybindings | Reversible placement and material changes |
| Draw/measure/underlay/snap | Room | Existing plan workflow |
| Wall topology/openings/panels | Selection inspector / Advanced | Geometry and opening values unchanged |
| Cabinet library and run authoring | Cabinets library / Run inspector | Identities, run parts and placement retained |
| Rotate/duplicate/delete | Selection action group + shortcuts | Original handlers and history behavior |
| Materials/import/UV/presets | Materials + contextual slot inspector | Correct slot, scope, persistence and render |
| Camera/navigation/cutaways | Canvas toolbar / View settings | Geometry unchanged by view operations |
| Issues, pricing, freeze/revisions | Review | Same totals, fingerprints and drift results |
| Rendering, proposals and approvals | Present / Review | Existing export and approval gates |
| Engineering, drawings, cutlist, machine output | Engineering workbench | Same production data for same document |

Likely UI entry points to inspect include `ModelViewToolbar.tsx`,
`ContextualCommandRail.tsx`, `LivingRoomInspectorPanel.tsx`,
`CatalogObjectBrowser.tsx`, `ModelViewStylePalette.tsx`, and the Interiors
workspace/header/present components. Component names are starting points, not
permission to bypass domain commands or rewrite project serialization.

## Build sequence and gates

1. Inventory commands, screens, saved data and baseline outputs. Confirm no
   capability is orphaned by the new navigation.
2. Unify control styling and fix contrast/overflow. Check all enabled, selected,
   disabled, focus, error and loading states in Calm/Compact.
3. Build the shared shell and inspector expansion behavior. Verify widths and
   keyboard access before moving tools.
4. Move room/cabinet/material controls, reusing existing handlers and undo.
5. Fix camera framing/cutaways and material feedback as distinct changes.
6. Resolve model adapters, assembly and material quality separately from CSS.
7. Integrate Review, Present and engineering navigation with existing gates.
8. Verify representative room starters, saved projects and full golden journey.

Required verification: meaningful existing unit/domain tests, build, relevant
browser workflows, visual comparison of long/expanded states, and before/after
production outputs for identical documents. Add focused tests for new behavior;
do not use screenshot quality as proof of manufacturing correctness.

## Current concept limits and review decisions

- The kitchen is illustrative SVG, not the application's real 3D renderer.
- Selecting a library item changes labels/fields but does not place its model.
- Dimension inputs and scope selection do not mutate geometry or project data.
- Material colors preview cabinet fronts; other surface selections are labels.
- Front elevation, quotation, engineering and export entries are placeholders.
- The header omits some production commands (file/save/undo/redo); the final
  shell must include them as specified above.
- Room currently retains a cabinet inspector in the concept; the implemented
  room screen must use the room/wall/opening contextual inspector.
- Present still includes view controls and a concept message; final client mode
  must remove editing-only elements and selection outlines.

Review the navigation, panel arrangement, card readability and expansion first.
Detailed commercial dialogs and geometry-specific inspectors need a subsequent
design pass before their implementation; screenshots must not be treated as
complete specifications for those unrepresented states.

See the [visual review guide](mockups/workflow-review/README.md) for captures.
