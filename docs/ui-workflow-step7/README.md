# Step 7 — Review / Present / engineering journey with existing gates

Completed September 9, 2026.
Scope: step 7 of [UI workflow redesign](../UI_WORKFLOW_REDESIGN.md).
Integrate Review → Present → engineering navigation using existing proposal and
handoff gates. Strip client Present editing chrome. Do not redesign full
quotation / freeze / approval / export dialog forms yet.

## What landed

| Piece | Location |
| --- | --- |
| Proposal gate feedback | `proposalGateFeedback.ts` — map existing gate items to Review/Present rows |
| Proposal readiness section | `InspectorProposalGateChecks` in Review and Present |
| Client identity strip | `InteriorsProposalIdentity` — customer + project # via `patchJob` |
| Journey CTA | `InteriorsReviewJourney` — next-action hint + Open Present + design-pass note |
| Return to Review | Present panel + `returnToReview` on workspace chrome |
| Client Present strip | `modelViewClientPresentationProps` — no selection marks, grid, or picks |
| Present titlebar | Units only; plan readability editing toolbar removed from Present |
| CSS | `interiors-present-client.css` |

Proposal, freeze, handoff, and export gate math are unchanged.

## Explicitly out of scope / design-pass follow-up

- Full quotation, freeze, approval, and export dialog redesign
- Relocating cutlist / machine export forms into Review
- Changing `buildProposalGate`, freeze, or handoff validators
- Removing header File/Save/Undo during Present (sales close still needs them)

## Suggested verification (user-run)

```bash
npx tsc --noEmit
npx vitest run src/domain/livingRoom/proposalGateFeedback.test.ts
npx vitest run src/domain/livingRoom/modelViewClientPresentation.test.ts
npx playwright test tests/e2e/phase-5-present-send.spec.ts
npx playwright test tests/e2e/ui-workflow-step8-smoke.spec.ts
```

Visual: Review shows Proposal readiness + identity fields; Present hides grid and
selection outlines; Present titlebar has no readability edit toolbar; Return to
Review restores the Review area.
