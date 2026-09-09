# Step 3 — shared shell and inspector expansion

Completed September 9, 2026.
Scope: step 3 of [UI workflow redesign](../UI_WORKFLOW_REDESIGN.md).
Builds the shared Interiors shell navigation, day-one File menu, and inspector
expand/scroll behavior. Existing tool placements stay until step 4.

## Gate note

The required first-class 2D Room reference remains open in the workflow-review
checklist. This step lands the shell contract against the existing plan canvas
and Step 1 inventory; it does not replace plan tooling with concept SVG.

## What landed

| Piece | Location |
| --- | --- |
| Workflow area type + chrome mapping | `src/domain/desktopUx/interiorsWorkflowArea.ts` (+ test) |
| Free area state on chrome hook | `src/hooks/useInteriorsWorkspaceChrome.ts` (`workflowArea` / `setWorkflowArea`) |
| Unnumbered nav | `InteriorsWorkflowNav.tsx` — Room, Cabinets, Materials, Review, Present |
| File menu | `InteriorsWorkspaceFileMenu.tsx` — Open / Save / Export JSON via existing props |
| Header wiring | `InteriorsWorkspaceHeader.tsx` + `LivingRoomPlanWorkspace.tsx` |
| Empty Room / Review inspector | `LivingRoomPlanWorkspaceInspector.tsx` shows room essentials or review context without a cabinet selection |
| Expandable advanced sections | `InspectorSection.tsx`; wall topology/UV and cabinet construction wrapped |
| Shell CSS | `src/styles/interiors-shared-shell.css` — nav, file menu, details, independent panel scroll |

## Area → existing chrome (no tool relocation)

| Area | plannerMode | studioPanel | view |
| --- | --- | --- | --- |
| Room | build | build | plan |
| Cabinets | design | cabinets | preserve |
| Materials | design | materials | preserve |
| Review | design | cabinets | preserve |
| Present | render | cabinets | model |

Selection is not cleared on area switch. Cabinets/Materials/Review preserve 2D/3D.

## Follow-up (step 4+)

- Step 4 relocated area-specific tools and libraries — see
  [Step 4 evidence](../ui-workflow-step4/README.md).
- Quote/freeze/approval dialog redesign, Present polish, and plan reference
  remain later steps.

## Suggested verification (user-run)

```bash
npx tsc --noEmit
npx vitest run src/domain/desktopUx/interiorsWorkflowArea.test.ts
```

Visual: open a job, switch all five areas freely, confirm File → Open/Save/Export,
Undo/Redo, expand wall Advanced and cabinet Advanced construction, confirm catalog
and inspector scroll independently at 1280/1440.
