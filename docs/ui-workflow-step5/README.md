# Step 5 — camera framing, cutaways, and material feedback

Completed September 9, 2026.
Scope: step 5 of [UI workflow redesign](../UI_WORKFLOW_REDESIGN.md).
UI-only framing and material feedback. Fit/focus/cutaway/paint domain math and
handlers are unchanged.

## What landed

| Piece | Location |
| --- | --- |
| Compact 3D toolbar | `ModelViewToolbar.tsx` — presets, explore, Fit, Focus, Cutaway, Clear |
| Advanced camera popover | `ModelViewAdvancedCameraPopover.tsx` — FOV, height, camera, quality, rotate, guide |
| Cutaway clarification | Cutaway title/aria + popover hint: view-only ≠ Raise/Lower / wall height |
| Paint apply summary | `surfacePaintFeedback.ts` + `SurfacePaintPanel` — current finish + Applying to |
| Style scope disclosure | `ModelViewStylePalette` — room style is undoable |
| Texture fallback notice | `materialTextureFeedback.ts` + `MaterialTextureLoadBanner` when curated maps fail |
| CSS | `interiors-camera-material-feedback.css` |

Toolbar no longer duplicates the Style select (palette remains the style entry).

## Explicitly out of scope

- Model adapter / GLB / assembly quality feedback — done in
  [step 6](../ui-workflow-step6/README.md)
- Quote/freeze/approval dialog redesign (step 7)
- Client Present chrome removal
- Changing `resolveModelViewFitPose`, cutaway filters, or paint apply math

## Suggested verification (user-run)

```bash
npx tsc --noEmit
npx vitest run src/domain/livingRoom/surfacePaintFeedback.test.ts
npx playwright test tests/e2e/phase-m1-camera-nav.spec.ts
npx playwright test tests/e2e/phase-i5-material-browser.spec.ts
```

Visual: open 3D — primary row shows Fit/Focus/Cutaway; FOV/height only under
**View settings**; Cutaway tooltip mentions view-only; Materials area shows
Current finish + Applying to; style palette states room-wide undoable scope.
