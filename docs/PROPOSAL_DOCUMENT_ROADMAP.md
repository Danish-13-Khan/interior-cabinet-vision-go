# Proposal document roadmap (client PDF and its views)

**Status:** Phase 0 done 2026-10-07 (content bugs in the current PDF). Phase 1 built 2026-10-08 (views and derived cameras). Phase 2 built 2026-10-08 (the four-page document, embedded font, brand). Phase 3 proposed; see §3 for what is left.
**Goal:** The proposal a customer receives looks like it came from a studio: a cover with the hero photo, one page per room with the view and what is in it, a finish board, a clear price, terms and signatures. Every view in it shows the joinery the customer is paying for.
**Scope:** `domain/livingRoom/proposal/*` (document model, jsPDF layout, verification), the proposal view selection, and the showcase camera authoring in `domain/apartmentTemplates/specs/*`.
**Relationship to other docs:** Views come from the apartment showcase cameras in
[`APARTMENT_TEMPLATES_ROADMAP.md`](APARTMENT_TEMPLATES_ROADMAP.md) §4 and the photo stills from
[`PHOTO_STILLS_RENDER_ROADMAP.md`](PHOTO_STILLS_RENDER_ROADMAP.md). The trust contract in
[`STILLJOB_TRUST_CONTRACT.md`](STILLJOB_TRUST_CONTRACT.md) decides which stills may appear.
Card stills and hover clips ([`TEMPLATE_CARD_MEDIA_ROADMAP.md`](TEMPLATE_CARD_MEDIA_ROADMAP.md)) read the same cameras, so camera changes re-record media.

---

## 1. Evidence (3 BHK proposal exported 2026-10-07, 7 pages)

Read from the exported PDF and the code that wrote it (`proposalPdf.ts`, `proposalPdfDraw.ts`, `proposalDocument.ts`, `proposalClientPayload.ts`).

| Seen in the PDF | Cause | State |
| --- | --- | --- |
| Every still stretched to a 170 × 70 mm band (16:9 squeezed to 2.4:1) | `drawViewFrames` ignored the image aspect | Fixed (Phase 0) |
| Prices printed as `¹4,722,620` | jsPDF core fonts are WinAnsi; ₹ has no glyph | Fixed: `pdfSafeText` spells `Rs` (Phase 0). A Unicode font is Phase 2 |
| "Total" listed twice in Price summary | summary lines already end with Total | Fixed (Phase 0) |
| 65 lines "Guest Bath · Wall finish — room face" in Cabinet summary | one priced line per surface | Grouped per room (Phase 0) |
| "Smoked Walnut — Back" twice, roles in lower case | slot keys differ by case | Fixed (Phase 0) |
| "Named client views" repeats the 12 captions | redundant section | Shown only when a view has no still (Phase 0) |
| 12 views; Foyer shows a door, Utility a door leaf, Balcony the floor, Passage a corridor, Kids a wardrobe edge, Master two doors, both baths a tile wall | cameras are hand-authored eye/target points per room; the proposal selects every bookmark by default | Open: Phase 1 |
| 12 views printed, but the template authors 14 cameras and an empty selection means "all" | the proposal surface and client payload cap views at 12 (`slice(0, 12)` in `proposalSurface.ts`, `proposalClientPayload.ts`), so the last two bookmarks (Master Bath, Walk-in) were dropped; not a still-binding bug | Explained (Phase 1). The cap stays; the default is now 7 views |
| No cover, no company identity, no per-room story or per-room price, one long flow | the layout is the Phase B "readable branded PDF" minimum | Open: Phase 2 |
| Validity and quote id in cards, approval block at the end | fine, keep | — |

**Camera authoring today.** Each `ApartmentRoomSpec.camera` is `{ eyeMm, targetMm }` typed by hand. Thirteen rooms use eye 1600 / target 1100 with no reference to where the composer put the joinery. Living is the exception: a raised three-quarter shot (eye 2450, target 800) that is also the tour's opening shot and the card still. `applyShowcaseCameras` turns each into a `CameraEntity` at 44° and a package bookmark, and skips rooms whose spec has no `camera`, so a room without one has no view at all. Field-of-view values elsewhere in the repo run from 35° to 46°; there is no single inherited value.

**What counts as joinery.** A cabinet the quote prices carries the cabinet identity extension (`CABINET_IDENTITY_EXTENSION`); that is what reaches `quote.cabinetLines` and the proposal's cabinet list. In the 3 BHK that is Foyer (shoe cabinet), Kitchen (8), Utility (tall unit), Study (the open shelf, printed as C11), Guest (2), Kids and Master (wardrobes). The bath vanity is a catalog sink, and the Living TV niche and feature wall have cabinet kind but no identity: shown, not priced. So the Living hero has no cut-list joinery and is kept by the hero rule.

**Selection default today.** "Empty selection means every bookmark" is coded three times: `listProposalNamedViews`, `toggleProposalView` (starts from `availableIds`) in `proposalViews.ts`, and `selectedCameraIds` in `quoteFingerprint.ts`. Changing one without the others re-selects dropped views on the first untick in Present, or makes the fingerprint disagree with the printed views.

**Framing helper today.** `cabinetRunFrame.ts` already fits a camera to the cabinet bounding box (`cabinetSceneBoundsMm`, `aabbFitDistanceMm`, fill 0.7, client elevation 22°, cutaway sides) and `cameraScreenBounds.ts` projects a box into the frame. It works on a whole scene, not one room, and assumes walls on the camera side can be cut away, which a photo still cannot do.

**Verification today.** `proposalPdf.test.ts` rasterises the golden proposal with `pdfjs-dist`, checks A4, no clipping, legible fonts, and `GOLDEN_PROPOSAL_PAGE_COUNT = 2`. `collectViewImageGaps` checks only the first page that carries a still; "missing-header-band" requires ink in the top 90 mm of page 1, which a full-bleed cover satisfies.

## 2. Decisions

- **D1 Views default to the hero room plus cut-list rooms.** When a template is applied, `applyShowcaseCameras` writes an explicit `selectedViewCameraIds`: the hero room first, then every room with at least one cut-list cabinet, by cabinet count. The meaning of an empty selection ("all bookmarks") does not change, so released and hand-authored projects keep their views. The three empty-selection sites collapse into one helper, `proposalViewSelection(document)`, so Present, the fingerprint and the PDF agree. Bookmark order is print order, so `applyShowcaseCameras` orders the bookmarks the same way. A joinery room with under 500 mm of floor in front of its run (the tall unit in the 1.2 m utility) gets a camera but is left out of the default, because no photo from inside can show it. For the 3 BHK this is 7 views: Living, Kitchen, Guest, Foyer, Study, Kids, Master. Utility, the three baths, Passage, Balcony and Walk-in stay available to tick in Present. The selection is fixed at apply time: a cut-list cabinet added to a room later does not join the default views, and the user ticks that room in Present. That is by design, not a bug. Present cannot untick the last printed view (an empty stored selection would mean every bookmark again) and cannot tick past the 12-view print limit; `proposalViewToggleLock` says which, and `clampViewSelection` is the one cap, applied to an implicit "every bookmark" selection too, so a pre-Phase-1 project with 14 bookmarks prints 12 live and frozen alike. The quote fingerprint still hashes every bookmark for an implicit selection, as it did before Phase 1, so released proposals on such projects do not turn stale.
- **D2 Frame on the joinery, not on a wall.** For a room whose spec has no `camera`, `frameJoineryCamera.ts` derives one from that room's cut-list cabinets using the projection primitives behind `cabinetRunFrame.ts` (`cameraScreenBounds.ts`, `modelViewFitDistance.ts`) rather than the run frame itself, which fits a whole scene and assumes a cutaway: target at the centre of the cabinet bounding box, eye at a fixed 1500 mm (a standing photo, not the 22° elevation of the cutaway WebGL view), distance such that the cabinets span 80 % of the frame, and never closer than 300 mm to a cabinet. An L-run is judged cabinet by cabinet, not by the empty quadrant of its bounding box. Field of view is vertical, as in Three.js. 42° is chosen, not inherited (about 67° wide at 16:9; the hero keeps its authored 44°). Each derived camera stores its own `fieldOfViewDegrees` because the fallback widens it. The bounding box is cut-list cabinets only; catalog objects do not pull the frame. When the fit distance would put the eye closer than 500 mm to a wall, in this order: widen the vertical field to at most 60°; then move the eye to the inset room corner the run faces (clear of every cabinet); then keep that frame and mark the view `partial`. Small pieces are never shot from closer than 1800 mm, low joinery is aimed at from 900 mm up when its floor edge still fits, and the 500 mm wall inset shrinks to 150 mm on a side where the run leaves no standing room (the 1.2 m utility). `joineryStanding.ts` decides the view direction: a wall backs the run when cabinets cover 30 % of it; parallel runs (the 2 BHK galley) cancel and the view goes down the aisle from its end; standing points are the inset room's corners and edge midpoints. The floor in front of a run is measured from the cabinets on each backing wall to the far standing edge. Seven rooms across the four templates are partial, listed in `frameJoineryCamera.test.ts`: the narrow kitchens and utilities, the Studio kitchenette, and the 3 BHK Master wardrobe. Raising the ceiling to 66° or 72° fixes none of them, so 60° stays.
- **D2b Rooms without cut-list cabinets still get a camera.** `applyShowcaseCameras` must emit a bookmark for every room, not only those with a `camera`. For a room with no cabinets and no authored camera, `frameRoomCamera.ts`: the target is the midpoint of the wall carrying the largest span of placed catalog objects (a bath looks at its vanity wall); an empty room (balcony, passage, walk-in) is viewed along its long axis rather than at a wall it would stand too close to; the eye is on the far side, 500 mm inside, 1600 mm high; target 1100 mm; 42°.
- **D2a Authored cameras are overrides.** Living keeps its authored three-quarter shot (hero, tour opening, card still). Every other hand-typed 3 BHK camera is removed so the rule applies. The same holds for the Studio, 1 BHK and 2 BHK specs: the hero keeps its camera, the rest go.
- **D3 One document, four kinds of page.** Cover (hero still full width, customer, project, date, revision, validity); one page per view (still at its own aspect, that room's cabinets with marks, finishes used there, room subtotal when itemized); finish board (one swatch per finish, drawn from the material colour, name and where it is used); price page (summary lines, tax, total, inclusions, exclusions, approval). Project-wide lines (installation, transport, tax) appear on the price page only and are never spread across rooms. A4 portrait stays.
- **D4 Photo first.** When an accepted Cycles still exists for a view it is used; otherwise the WebGL capture. Which one was used is recorded in the release record and shown in Present, not printed.
- **D5 Identity from settings.** Brand name, contact line and an optional logo come from quote settings. The logo is a data URL stored in quote settings (project-local, no build asset), capped at 200 KB, PNG or JPEG only. SVG is rejected at upload: jsPDF's `addImage` takes raster formats, and `addSvgAsImage` needs the optional canvg dependency and a browser canvas. This fixes the shape of `brand` in the document model before Phase 2.
- **D6 Real glyphs.** Embed one Unicode sans (Noto Sans regular and semibold) so ₹ and dashes print; `pdfSafeText` stays as the fallback. The font is a subset (Latin, ₹, dashes, quotes) produced by a script into `public/fonts/*.ttf`, fetched lazily at export and converted to the binary string `addFileToVFS` wants at load time; tests read the same `.ttf` from disk. No base64 module, which would break the 200-line file ceiling.

## 3. Phases

### Phase 0 — Content bugs in the current layout (done 2026-10-07)

Aspect-correct stills, `Rs` for ₹, single Total, room-grouped finish lines, deduplicated finishes, views list only when a still is missing, identity line without an empty project number. Verified by regenerating the 3 BHK proposal with real stills through `exportProposalPdf` and rasterising it.

### Phase 1 — Views that show the joinery (built 2026-10-08)

0. Regenerate the 3 BHK proposal and explain 12 views against 14 cameras. An explicit selection in that project is nothing; two views without a still is a separate bug in how stills bind to views. Log it either way and carry on; it does not block the new default.
1. `proposalViewSelection.ts`: the one empty-selection helper; `listProposalNamedViews`, `toggleProposalView` and `quoteFingerprint.ts` call it. `applyShowcaseCameras` writes the explicit selection (D1).
2. `apartmentTemplates/frameJoineryCamera.ts`: per-room fit built on `cabinetRunFrame.ts` with `eyeHeightMm`, `fill` and the fallback ladder (D2), plus the no-cabinet rule (D2b); `applyShowcaseCameras` emits a bookmark for every room and uses the derived camera when the spec has no `camera`. Remove the non-hero hand-typed cameras (D2a).
3. Test: for every template and every default view with cut-list cabinets, project the cabinet bounding box with the camera and assert all corners fall inside 90 % of the frame. Views marked `partial` are listed in the test as an allowlist so a new one fails the build. Kitchen (L-shaped) and Utility are the likely entries.
4. Re-record hover clips for rooms whose cameras changed (`TEMPLATE_CARD_MEDIA_ROADMAP.md` gates). The card still is the hero and does not change.

**Built:** steps 0–3 (`proposalViewSelection.ts`, `joineryBounds.ts`, `joineryStanding.ts`, `joineryScreenBounds.ts`, `frameJoineryCamera.ts`, `frameRoomCamera.ts`, `applyShowcaseCameras.ts`, non-hero cameras removed from every spec, tests). Checked in the app on a fresh 3 BHK: the tour shows the hero Living, the kitchen from its free corner, the foyer shoe cabinet and study shelf from the far corner, wardrobes in the bedrooms, vanity mirrors in the baths. **Left:** step 4, the media re-record, and a visual pass over the eight partial rooms.

**Done when:** the 3 BHK proposal defaults to the 7 views in D1, each still shows its cabinets, unticking one view in Present drops only that view, and the quote fingerprint matches the printed views.

### Phase 2 — The document (built 2026-10-08)

- `proposalDocument.ts`: add `rooms[]` (view, cabinets, finishes, subtotal) and `brand` from settings (D5); keep the flat lists for the frozen payload.
- `proposalPdfCover.ts`, `proposalPdfRoom.ts`, `proposalPdfFinishBoard.ts`, `proposalPdfPricing.ts` (D3). Font subset script plus lazy load through `jsPDF.addFileToVFS`/`addFont` (D6).
- Verification: `GOLDEN_PROPOSAL_PAGE_COUNT` becomes a function of view count; `collectViewImageGaps` gains a per-page pass so "every room page has a still" is checked on each page, not only the first; "cover has a still" is added. The "missing-header-band" rule (ink in the top 90 mm of page 1) stays as is and is satisfied by the full-bleed cover; do not loosen it.

**Built:** `proposalRooms.ts` derives one page per printed view (cabinets by quote mark, finishes by room, itemized subtotal); `proposalPdfCover.ts`, `proposalPdfRoom.ts`, `proposalPdfFinishBoard.ts`, `proposalPdfPricing.ts` write the four page kinds over `proposalPdfTheme.ts`; `proposalPdfFont.ts` embeds the Noto Sans subset built by `scripts/proposal-font/build_subset.py` into `public/fonts` (20 KB per weight, OFL notice beside them) and falls back to Helvetica plus `pdfSafeText`; brand name, contact and a PNG/JPEG logo under 200 KB live in quote settings (`InteriorsPresentBrand`); finish lines carry their swatch colour and rooms. Verification reads page text through PDF.js (the embedded font writes glyph ids, not Latin-1 bytes), `proposalPageCount(rooms)` replaces the fixed count, and `expectedRoomPages` checks the cover and every room page paint a still. Checked end to end on the golden proposals and a branded, itemized 3 BHK (10 pages, ₹ printed); the quote spans every room only with the interior estimate enabled, as the app's apartment projects have it.

**Done when:** the golden proposal and the 3 BHK proposal both pass the raster checks, and the 3 BHK PDF reads cover → rooms → finishes → price → approval with ₹ printed.

### Phase 3 — Preview before export (~1 day)

Present shows the rendered pages before "Create Proposal" commits the release, so a bad frame is caught in the app, not in the customer's inbox. `proposalPdfRaster.ts` is Node-only (it resolves the pdf.js worker with `createRequire`), so this phase splits it into a worker-agnostic core and two worker setups: the existing Node one for tests, and the browser `?url` worker that `planUnderlayPdf.ts` already configures.

## 4. Open questions

1. Per-room subtotals when `priceDetail` is "included": show nothing, or "Included" per room as now?
2. The seven partial rooms: accept the far-corner frame as is, lower the eye for tall wardrobes, or author those cameras by hand as hero-style overrides?
