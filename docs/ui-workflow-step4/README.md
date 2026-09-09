# Step 4 — area-specific tool and library relocation

Completed September 9, 2026.
Scope: step 4 of [UI workflow redesign](../UI_WORKFLOW_REDESIGN.md).
Routes room/cabinet/material/review controls through workflow areas while
reusing existing handlers, undo, and domain commands.

## What landed

| Piece | Location |
| --- | --- |
| Area tool lists + catalog routing | `src/domain/desktopUx/interiorsWorkflowArea.ts` (+ tests) |
| Area-filtered tool rail | `InteriorsToolRail.tsx` |
| Area-specific left panels | `InteriorsWorkflowAreaPanel.tsx`, `InteriorsReviewPanel.tsx` |
| Catalog rail orchestration | `LivingRoomPlanCatalogRail.tsx` (props in `livingRoomPlanCatalogRailProps.ts`) |
| Chrome sync on tool pick | `useInteriorsWorkspaceChrome.ts` — `applyChromeTool` updates workflow area |
| Review panel styling | `interiors-shared-shell.css` |

## Area → tools → left panel

| Area | Tool rail | Left panel |
| --- | --- | --- |
| Room | select, room, wall, door, window, import | Build Room catalog (underlay, measure, room mgmt) |
| Cabinets | select, cabinet, run, shelf, objects | Cabinet library, run families, or object browser |
| Materials | select, material | Material browser (swatches, slots, selection paint) |
| Review | select | Layout checks + live quote + Open Present |
| Present | hidden | Present panel (unchanged; step 5+ polish) |

Contextual rail and keyboard shortcuts still call `applyChromeTool`, which
switches workflow area automatically (e.g. Material → Materials area).

## E2E note

Tool rail buttons are area-scoped. Specs that click `interiors-tool-cabinet`
immediately after open should first activate Cabinets:

```typescript
await page.getByTestId("interiors-workflow-area-cabinets").click();
await page.getByTestId("interiors-tool-cabinet").click();
```

Contextual rail entries (e.g. `rail-material`) continue to work without an
extra nav click because they invoke `applyChromeTool` directly.

## Explicitly out of scope

- Quote/freeze/approval dialog redesign (step 7)
- Client Present chrome removal (step 5+)
- Camera/cutaway polish (step 5)
- Domain, costing, or handler rewrites

## Suggested verification (user-run)

```bash
npx tsc --noEmit
npx vitest run src/domain/desktopUx/interiorsWorkflowArea.test.ts
npx playwright test tests/e2e/phase-5-catalog-object-browser.spec.ts
npx playwright test tests/e2e/phase-i5-material-browser.spec.ts
```

Visual: switch each workflow area; confirm rail + left panel match; Room draw
tools still use stage chrome when active; Review shows issues + quote; Materials
shows paint browser only.
