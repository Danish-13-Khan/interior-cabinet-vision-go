# Step 6 — model adapters, assembly, and material quality feedback

Completed September 9, 2026.
Scope: step 6 of [UI workflow redesign](../UI_WORKFLOW_REDESIGN.md).
Surfaces existing adapter / assembly / GLB / catalog-preview signals in Review and
the viewport. Compile, assembly validation, and export-gate math are unchanged.

## What landed

| Piece | Location |
| --- | --- |
| Quality issue mapping | `modelQualityFeedback.ts` — missing adapter, geometry fallback, corner preview, assembly issues |
| Review section | `InspectorModelQualityChecks` + `InteriorsReviewPanel` — Locate + Preview vs Blocks export |
| GLB load fallback banner | `ModelGlbFallbackBanner` via `reportModelGlbFallback` from `AssetBackedObject` |
| Viewport banner host | `ModelViewFeedbackBanners` (texture + GLB) |
| Catalog “No preview” | Object browser, millwork library, cabinet-run catalog cards |
| CSS | `interiors-camera-material-feedback.css` |

Corner wardrobe rows are **preview** (simplified L-box). Geometry fallback and
cabinet missing-adapter rows are **blocking** for proposal/client export, matching
existing gates.

## Explicitly out of scope

- Changing `compileCabinet`, `validateCabinetAssembly`, or export gate logic
- Quote / freeze / approval dialog redesign (step 7)
- Client Present chrome removal
- Inventing new corner cut or manufacturing math

## Suggested verification (user-run)

```bash
npx tsc --noEmit
npx vitest run src/domain/livingRoom/modelQualityFeedback.test.ts
npx playwright test tests/e2e/phase-m1-camera-nav.spec.ts
npx playwright test tests/e2e/phase-i5-material-browser.spec.ts
```

Visual: open **Review** — Model & material quality section lists adapter/assembly
rows with Preview vs Blocks export; place a no-thumb library card and confirm
**No preview**; force a GLB fail to see the model fallback banner.
