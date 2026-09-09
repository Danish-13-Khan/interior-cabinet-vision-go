# Workflow visual review

Status: proposed UI reference, not an implemented application. Review with the
[full specification](../../UI_WORKFLOW_REDESIGN.md) before building.

[Open the interactive concept](index.html). This local standalone copy preserves
the sandboxed iframe and CSP from the visualization renderer. Its outer frame
is taller for local review. It has not been published. Open it in a browser;
Markdown renderers may only show its source.

## What to review

Follow Room → Cabinets → Materials → Review → Present, then return to design.
Search for a shower or refrigerator; expand the library categories, material
scope, room presets, placement and advanced construction. Check long names and
dimensions. Select a finish to see the illustrative cabinet fronts change.

The drawing is illustrative and many controls are demonstrations. It is not
evidence of real geometry, material fidelity, quotations or production output.
The specification records these limitations and additional required screens.

## Screenshot guide

Captures show the local concept, not the current production application. Desktop
captures use 1280 CSS px width. Tall panels have a separate lower-panel capture;
these are viewport screenshots, not stitched full-page renderings.

### 1. Room and plan

Review the compact room tools and dominant plan canvas. The final room inspector
must reflect room/wall/opening selection; the concept retains a cabinet inspector.

![Room workflow](screenshots/01-room.png)

### 2. Cabinet and object library

Object names and dimensions occupy separate lines. Cards grow with content.
The shower and vanity names continue in the lower-panel capture.

![Cabinet library](screenshots/02-cabinets.png)

### 3. Material selection and expanded sections

Review target surface, current material, readable swatches and application scope.
Style names use full-width wrapping entries. Lower entries are shown next.

![Material workflow](screenshots/03-materials.png)

![Expanded material inspector](screenshots/03-materials-expanded.png)

### 4. Lower inspector and long object names

Review complete preset names, placement fields, construction fields and long
object labels. In implementation, the panel will scroll independently while
the canvas remains visible.

![Lower expanded inspector and library](screenshots/06-inspector-detail.png)

### 5. Review

Issues need a clear Locate action. Quote review, engineering and production
entries are navigation placeholders; full commercial forms remain specified in
the workflow document and require a detailed design pass.

![Review workflow](screenshots/04-review.png)

### 6. Present

Side panels disappear so the design dominates. Final client mode must also
remove selection marks, editing-only view controls and the concept message.

![Presentation layout](screenshots/05-present.png)

### 7. Responsive layout

At 736 px the inspector moves below the canvas/library. At 390 px the content
stacks. Both reference widths were checked for root horizontal overflow:
702/702 px and 356/356 px client/scroll width respectively.

![Narrow screen layout](screenshots/07-narrow-layout.png)

![Mobile stacked layout](screenshots/08-mobile-layout.png)

## Review checklist before implementation

- [ ] Agree on the shared header and five freely accessible navigation areas.
- [ ] Agree on library card height, preview/name/dimension layout and filtering.
- [ ] Agree on inspector essentials and advanced-section grouping.
- [ ] Agree on independent panel scrolling and narrow-screen panel access.
- [ ] Detail room, run, opening and empty-selection inspectors.
- [ ] Detail quotation, freeze, approval, save/recovery and export dialogs.
- [ ] Map every existing action/shortcut to its new entry point.
- [ ] Confirm renderer/geometry work has separate acceptance criteria from UI.

## Validation performed in this documentation pass

- Opened and switched all five concept stages in the browser.
- Selected a finish and observed the cabinet-front color update.
- Expanded presets, scope, placement and construction sections.
- Captured viewport images including lower-panel content.
- Checked root width versus scroll width at 736 and 390 px.

Application tests were not rerun: this pass changes documentation and static
review assets only. No production UI, domain data or exported output changed.
