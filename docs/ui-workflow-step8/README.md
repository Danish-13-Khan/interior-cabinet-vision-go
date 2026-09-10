# Step 8 — starters, saved projects, and golden journey verification

Completed September 9, 2026.
Scope: step 8 of [UI workflow redesign](../UI_WORKFLOW_REDESIGN.md).
Verification-only. No handler, gate, or manufacturing math changes.

## What landed

| Piece | Location |
| --- | --- |
| Entry-point map | `interiorsWorkflowEntryPoints.ts` + unit test |
| Smoke helpers | `tests/e2e/ui-workflow-step8.helpers.ts` |
| Smoke e2e | `tests/e2e/ui-workflow-step8-smoke.spec.ts` |
| Present→edit selection | `leavePresentForCabinetEdit` + golden `selectGoldenCabinet` inspector path |
| Entry checklist | [ENTRY_POINTS.md](ENTRY_POINTS.md) |

## Verification matrix

| Journey | Covered by |
| --- | --- |
| Empty-room starter | Step 8 smoke + `phase-5-empty-room-template.spec.ts` |
| Other popular starters | Existing `phase-5-*-template.spec.ts` / living-room template |
| Five free areas reachable | Step 8 smoke `assertWorkflowAreasSmoke` |
| Review → Present → Return to Review | Step 8 golden smoke |
| Present → cabinet edit | Step 8 golden smoke (`leavePresentForCabinetEdit`) |
| Save / reopen JSON | Step 8 golden smoke + `interiorsSaveReopen` |
| Full priced Present/approve/send | Existing `phase-5-present-send.spec.ts` / golden run |
| Full golden manufacturing path | Existing `npm run test:golden` (pointer only) |

## Explicitly out of scope

- Redesigning quotation / freeze / approval / export dialogs
- Replacing the full golden or roadmap-exit suites
- Claiming manufacturing correctness from UI smoke alone

## Suggested verification (user-run)

```bash
npx tsc --noEmit
npx vitest run src/domain/desktopUx/interiorsWorkflowEntryPoints.test.ts
npx playwright test tests/e2e/ui-workflow-step8-smoke.spec.ts
npx playwright test tests/e2e/phase-5-present-send.spec.ts
# optional pointer:
# npm run test:golden
```
