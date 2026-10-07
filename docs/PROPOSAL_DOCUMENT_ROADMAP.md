# Proposal document roadmap (client PDF and its views)

**Status:** Phase 0 done 2026-10-07 (content bugs in the current PDF). Phases 1–3 proposed; pick one before any `src/` edit.
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
| No cover, no company identity, no per-room story or per-room price, one long flow | the layout is the Phase B "readable branded PDF" minimum | Open: Phase 2 |
| Validity and quote id in cards, approval block at the end | fine, keep | — |

**Camera authoring today.** Each `ApartmentRoomSpec.camera` is `{ eyeMm, targetMm }` typed by hand (`specs/threeBhkRoomsA.ts`, `threeBhkRoomsB.ts`, …). Eye height 1600, target 1100, no reference to where the composer put the joinery. The rooms that read well (Living, Kitchen) are the ones whose joinery happens to sit where the author looked. `applyShowcaseCameras` turns each into a `CameraEntity` and a package bookmark; `listProposalNamedViews` selects all bookmarks when the surface has no explicit selection.

**Verification today.** `proposalPdf.test.ts` rasterises the golden proposal with `pdfjs-dist`, checks A4, no clipping, legible fonts, that the red golden stills paint and are not clipped, and `GOLDEN_PROPOSAL_PAGE_COUNT = 2`. Phase 0 kept the still's longest edge at 70 mm so that page count holds.

## 2. Decisions

- **D1 Views default to joinery rooms.** A proposal view is a room with at least one production cabinet or wardrobe. Passage, balcony, walk-in without joinery and baths without vanities are not selected by default. The user can still tick them in Present. Order: hero room first, then by cabinet count.
- **D2 Frame on the joinery, not on a wall.** A camera is derived per room from the composed joinery: target at the centre of the joinery bounding box at 1100 mm; eye on the far side of the room's free area, 1500 mm high, far enough that the whole run fits a 44° field with 10 % margin, clamped 500 mm inside the room. Authored `camera` in the spec stays as an override. A test projects the joinery corners and asserts they land inside the frame.
- **D3 One document, four kinds of page.** Cover (hero still full width, customer, project, date, revision, validity); one page per view (still at its own aspect, that room's cabinets with marks, finishes used there, room subtotal when itemized); finish board (one swatch per finish, drawn from the material colour, name and where it is used); price page (summary lines, tax, total, inclusions, exclusions, approval). A4 portrait stays.
- **D4 Photo first.** When an accepted Cycles still exists for a view it is used; otherwise the WebGL capture. The caption says which.
- **D5 Identity from settings.** Brand name, contact line and an optional logo come from quote settings, not a constant.
- **D6 Real glyphs.** Embed one Unicode sans (Inter or Noto Sans, regular and semibold) so ₹ and dashes print; `pdfSafeText` stays as the fallback for unembedded text.

## 3. Phases

### Phase 0 — Content bugs in the current layout (done 2026-10-07)

Aspect-correct stills, `Rs` for ₹, single Total, room-grouped finish lines, deduplicated finishes, views list only when a still is missing, identity line without an empty project number. Verified by regenerating the 3 BHK proposal with real stills through `exportProposalPdf` and rasterising it.

### Phase 1 — Views that show the joinery (~1 day)

- `proposalViews.ts`: default selection = joinery rooms (D1), with the existing explicit selection untouched.
- `apartmentTemplates/frameJoineryCamera.ts`: derive `{ eyeMm, targetMm }` from the room's joinery bounds (D2); `applyShowcaseCameras` uses it when the spec has no `camera`. Remove the hand-typed cameras for the rooms in the evidence table; keep Living and Kitchen where they read well, or let the rule replace them if the test shows the rule frames better.
- Test: for every template and every selected view, project the joinery bounding box with the camera and assert all corners fall inside 90 % of the frame.
- Re-record card stills and hover clips for the rooms whose cameras changed (`TEMPLATE_CARD_MEDIA_ROADMAP.md` gates).

**Done when:** the 3 BHK proposal defaults to 7 views (Foyer, Living, Kitchen, Utility, Study, Guest, Kids, Master minus any without joinery) and each still shows its cabinets.

### Phase 2 — The document (~2 days)

- `proposalDocument.ts`: add `rooms[]` (view, cabinets, finishes, subtotal) and `brand` from settings (D5); keep the flat lists for the frozen payload.
- `proposalPdfCover.ts`, `proposalPdfRoom.ts`, `proposalPdfFinishBoard.ts`, `proposalPdfPricing.ts` (D3). Embed the font (D6) through `jsPDF.addFileToVFS`/`addFont` from a base64 module.
- Verification: `GOLDEN_PROPOSAL_PAGE_COUNT` becomes a function of view count; the raster checks gain "cover has a still" and "every room page has a still".

**Done when:** the golden proposal and the 3 BHK proposal both pass the raster checks, and the 3 BHK PDF reads cover → rooms → finishes → price → approval with ₹ printed.

### Phase 3 — Preview before export (~0.5 day)

Present shows the rendered pages (reuse `proposalPdfRaster`) before "Create Proposal" commits the release, so a bad frame is caught in the app, not in the customer's inbox.

## 4. Open questions

1. Logo: file upload in settings (data URL in the project) or a brand asset bundled with the build?
2. Per-room subtotals when `priceDetail` is "included": show nothing, or "Included" per room as now?
3. Should the tour clips follow the new cameras automatically, or stay on the hand-authored path for the hero room?
