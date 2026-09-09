# Step 2 — control contrast and overflow

Completed September 9, 2026.
Scope: step 2 of [UI workflow redesign](../UI_WORKFLOW_REDESIGN.md).
CSS-only on the existing Interiors layout. Handlers, domain math, navigation
shell, and serialization are unchanged.

## Goal

Unify Interiors control styling and fix pale-on-pale contrast plus clipping
overflow in Calm Guided and Compact Pro, without moving tools or rebuilding the
shared shell (step 3).

## What landed

| File | Role |
| --- | --- |
| `src/styles/interiors-control-tokens.css` | `--iu-*` shell tokens plus control ink/border/focus/error/disabled tokens. Stops `color: inherit` from pushing muted parent ink onto buttons. |
| `src/styles/interiors-controls.css` | Shared enabled, hover, selected (`.is-active` / `.is-primary`), disabled, `:focus-visible`, `.is-error`, and loading (`[aria-busy]` / `.is-loading`) states. |
| `src/styles/interiors-contrast-overflow.css` | Model toolbar wrap + readable type; style presets as full-width wrapping rows; catalog cards with wrapping name/dimension rows; Compact inspector body scroll. |
| `src/styles/interiors-ui-modes*.css` | Existing Calm/Compact layout split to ≤200 lines per file (chrome/projects, compact projects, authoring, present). |

Import order in `src/App.css`: tokens → mode layout modules → controls →
contrast/overflow → projects home layout.

## Surfaces covered

- Header: File/history/save, view switch, Present
- Left rail and contextual command rail
- Catalog filters and object cards
- Model view toolbar and style palette
- Inspector fields and Compact floating inspector scroll
- Present panel primary/secondary controls

## Explicitly out of scope

- Shared shell / unnumbered area navigation (step 3)
- Moving room/cabinet/material tools (step 4)
- 2D Room reference redesign (parallel design work before step 3)
- Domain, costing, manufacturing, or handler changes
- Screenshot-based manufacturing proof

## State matrix checklist (Calm and Compact)

Verify visually at 1280 px, 1440 px, and ~200% zoom:

- [ ] Enabled controls use ink on panel backgrounds (not muted-on-pale)
- [ ] Selected / `.is-active` uses green soft + green ink
- [ ] Disabled shows muted ink, panel-2 fill, and not-allowed cursor
- [ ] Keyboard `:focus-visible` outline uses green control focus token
- [ ] Autosave / field `.is-error` uses red ink and error background
- [ ] Loading (`aria-busy` / `.is-loading`) uses dashed border + progress cursor
- [ ] Long catalog names wrap; dimensions remain a separate line
- [ ] Style preset names wrap on full-width rows (e.g. Warm Contemporary)
- [ ] Compact inspector scrolls when every section is expanded
- [ ] Model toolbar wraps rather than shrinking label text

## Preservation

Step 1 inventory and handlers remain authoritative. No JSX event bindings or
domain modules were edited for this step. Existing entry points stay until a
later migration verifies replacements.

## Suggested verification (user-run)

```bash
npx tsc --noEmit
# Optional smoke against existing Interiors e2e (CSS-only; expect unchanged behavior)
npx playwright test tests/e2e/phase-5-catalog-object-browser.spec.ts
```

Reply with pass/fail counts, or paste only failures.
