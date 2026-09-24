# Cabinet Studio workspace redesign — Stage 1 baseline

Audit only. Product code was not changed. Stages 2–7 are recorded as later work and were not implemented.

## 1. Branch / SHA

| Field | Value |
| --- | --- |
| Branch | `codex/studio-workspace-redesign` |
| HEAD | `e6546fa8c470c1cb63c10cc8b63627c32616d1a3` |
| Subject | `fix(web): stop local sessions on login and registration` |
| Author | `Danish-13-Khan <dan.my1313@gmail.com>` |
| Commit date | `2026-09-23 18:13:37 +0530` |

`git status --short` was empty before this audit was written. Uncommitted Stage 1 files are this document, `scripts/stage1-baseline/`, and `docs/studio-workspace-redesign/stage1-samples/`. No product UI code was changed.

## 2. Product surfaces map

Workbench modes live in `src/domain/desktopUx/workbench.ts`: `job`, `room`, `interiors`, `cabinets`, `drawings`, `production`, `reports`. Web launch forces Interiors (`src/App.tsx` mount effect calls `handleWorkbenchModeChange("interiors")` and `openLivingRoomProjectHome()` when `isTauriRuntime()` is false). Switching to Interiors sets `sceneBrowserVisible: false` and `sheetBrowserVisible: false`.

Interiors canvas views are `LivingRoomWorkspaceView = "plan" | "model" | "render"` (`src/components/livingRoomPlan/workspaceProps.ts`). Design areas are Room, Cabinets, Materials, Review, Present (`INTERIORS_WORKFLOW_AREAS` in `src/domain/desktopUx/interiorsWorkflowArea.ts`).

| Surface | Where it lives today |
| --- | --- |
| Interiors projects home | `useLivingRoomPlanEditor` holds `projectHomeOpen` (`src/hooks/useLivingRoomPlanEditor.ts`). `LivingRoomPlanWorkspace` (`src/components/LivingRoomPlanWorkspace.tsx`) renders `LivingRoomPlanHomeShell` when there is no project or the home is open. Home content: `PlannerV2ProjectHome` / `InteriorsCompactProjectsHome`, with `InteriorsProjectsIntro`, `InteriorsProjectsRecents`, `InteriorsProjectsStarters`, `InteriorsProjectsPhase1Qa`. |
| 2D plan | Area `room` sets `plannerMode: "build"` and `workspaceView: "plan"`. Canvas: `LivingRoomPlanStage` → `LivingRoomPlanView` (`src/components/livingRoomPlan/LivingRoomPlanStage.tsx`, `src/components/LivingRoomPlanView.tsx`). Chrome hook: `useInteriorsWorkspaceChrome`. |
| 3D | `workspaceView === "model"` renders `LivingRoomModelView` (`src/components/LivingRoomModelView.tsx`) from the same stage. Present area forces `plannerMode: "render"` and `workspaceView: "model"`. |
| Review | `InteriorsWorkflowAreaPanel` case `"review"` renders `InteriorsReviewPanel` (`src/components/livingRoomPlan/InteriorsReviewPanel.tsx`): plan issues, model-quality notes, proposal gate, and the same live-quote block used in Present. |
| Present / quote freeze | `plannerMode === "render"` mounts `InteriorsPresentPanel` (`src/components/livingRoomPlan/LivingRoomPlanWorkspaceBody.tsx`). Quote UI: `InteriorsPresentQuote`, commercial fields: `InteriorsPresentCommercial`, PDF action: `InteriorsPresentActions` → `useProposalWorkflow.createProposal`. Freeze hook: `useProposalWorkflow.freezeQuote` → `freezeQuoteAndSyncLedger` (`src/hooks/freezeQuoteAndSyncLedger.ts`). |
| Payments | `InteriorProjectTools` dialog tab `"Payments"` renders `InteriorPaymentsPanel` (`src/components/livingRoomPlan/InteriorProjectTools.tsx`). The tools button is passed only when a project is open and the home is closed (`LivingRoomPlanWorkspace`). |
| Engineering / cut list | Interiors handoff: `EngineeringHandoffSection` inside `InteriorsPresentActions`, driven by `useEngineeringHandoff`. After handoff, `resolvePostHandoffBridge` (`src/domain/engineerBridge/reportCenterBridge.ts`) targets workbench `cabinets`, `reports`, or `production`. Production workspace is `ReportCenter` `mode="production"` (materials, nesting, hardware, cutlist, machining, costing). Reports workspace is `mode="reports"` (packet, review, rooms, schedule, runs, quote). Cut-list CSV: `useProductionFileExport.handleExportCutlistCsv` and interiors `useMillworkSchedule` via `prepareCutlistCsvExport`. Cabinet quote freeze (separate from the interiors freeze): `ReportCenter` `QuoteTab` → `useReviewWorkflow.handleFreezeQuoteSnapshot`. |
| Scene tree | `SceneTreePanel` mounts in `AppToolRail` only for workbench `room`, `cabinets`, or `drawings`. Job mode uses `WorkspaceSceneBrowser` in `AppWorkspace` when the scene browser is visible. Interiors does not mount either tree. Domain builder: `buildSceneTree` in `src/domain/sceneTree/buildSceneTree.ts`. Selection/isolate/focus/reorder hook: `useSceneTreeOps` (`src/hooks/useSceneTreeOps.ts`), wired from `useAppController`. |

`SceneTreePanel` is labeled “Cabinet Tree” and renders `CabinetTreeBrowser`.

## 3. Scene tree / hierarchy today

`SceneTreeNodeKind` in `src/domain/sceneTree/types.ts`:

```ts
"room" | "wall" | "run" | "cabinet" | "opening"
```

`buildSceneTree` comment and implementation stop at opening leaves: room → wall → run → cabinet → opening. Walls follow `back-wall`, `left-wall`, `right-wall`, `free`. Runs come from `detectCabinetRuns`. Cabinets not in a run become a loose run (`loose-${side}`). Opening children come from `resolveCabinetComposition(cabinet.config).openingStructure` and `collectOpeningLeaves`. If there is no structure, the cabinet has no children.

Node ids from the Stage 1 sample (default base + drawer, one room):

| Kind | Example id |
| --- | --- |
| room | `room:room-1` |
| wall | `wall:room-1:back-wall` |
| run | `run:room-1:run-1` |
| cabinet | `cabinet:room-1:cab-base` |
| opening | `opening:room-1:cab-base:opening-primary` |

Opening content types (`src/domain/cabinetOpeningStructure/types.ts`): `door`, `drawer-stack`, `open-shelf`, `divider`, `empty`. The sample tree has two opening nodes: `OP-1 · Door Opening` (`opening-primary` on the base) and `DW-1 · Drawer Stack` (`opening-primary` on the drawer cabinet). There is one door line in the cut list with `quantity: 2`, and one opening node. Drawer box parts are cut-list lines with no tree nodes.

### Selection, isolate, focus

`CabinetTreeBrowser.activateNode`:

- `room` → `onSelectRoom`
- `opening` → select the cabinet if the room is not active, then `onSelectOpening(cabinetId, openingId)`
- `cabinet` → `onSelectCabinet` in the active room, or `onSelectCabinets` when switching rooms
- `run` in the active room → `onSelectRun` when the run id is in the `runs` prop; otherwise the descendant `cabinetIds` are selected
- wall (and any other non-opening group) → `onSelectCabinets` with `node.cabinetIds`

`useSceneTreeOps.handleTreeSelectCabinets` replaces the cabinet selection, or unions it when additive. A different room goes through `selectCabinetsInRoom`.

Isolate (`handleTreeIsolate` + `resolveIsolateSet` in `src/domain/sceneTree/ops.ts`) toggles a set of cabinet ids. Repeating the same set clears isolate (`null`). `useProjectCommit.getVisibleProject` filters the engineering viewport to those cabinet ids (after layer visibility). The tree row shows isolate and focus when `node.cabinetIds.length > 0` (`CabinetTreeRow`). Focus replaces the selection and calls `fitView()` (`CabinetScene` imperative `fitView` bumps a fit version).

Reorder is cabinet-in-run only: `reorderCabinetInRun` returns null for `loose-*` runs and for moves past the ends. It repacks placements along the run axis.

Rename is room and cabinet only, and cabinet rename is refused when the node’s room is not the active room.

### Gap versus a full part tree

The tree does not contain carcass, compartment, door leaf, drawer box, stretcher, toe-kick, or face-frame nodes. `SceneTreeNode` carries `cabinetId` and `openingId`. It has no `partId`. Opening ids are composition leaf ids (`opening-primary` in the default configs), which are a different namespace from construction part ids (`left-side`, `door`, `drawer-side`).

That hierarchy is the engineering cabinet tree. The Interiors 3D view selects living-room object ids through `LivingRoomModelView`, not `SceneTreeNode`s.

## 4. Part identity and cut list

Construction parts are `CabinetPart` (`src/domain/cabinetConstruction/types.ts`). `createCabinetConstruction` (`src/domain/cabinetConstruction/createConstruction.ts`) builds them from the clamped config plus `resolveCabinetComposition`. Current construction keys are the string ids passed to `createPart` in `partsCase.ts`, `partsInterior.ts`, and `partsExtras.ts`, for example `left-side`, `right-side`, `top`, `bottom`, `back`, `shelf`, `door`, `drawer-front`, `drawer-side`, `drawer-front-back`, `drawer-bottom`, `toe-kick`. Shelf and door keys change suffix when the opening count changes: a single opening uses `shelf` or `door`; more than one uses `shelf-${opening.id}` or `door-${opening.id}` (`partsInterior.ts`). This audit does not claim those keys stay the same across edits. Stability is a Stage 2 mutation-test question.

`getConstructionFlatParts` copies `part.id` to `key`. `createCabinetProductionCutlist` (`src/domain/productionCutlist.ts`) then sets:

- `key`: `` `${cabinet.id}:${part.key}` ``
- `partId`: `part.key`
- `shopRef`: `formatPartShopRef(cabinetIndex, partIndex + 1)` → `C01-P01` style (`src/domain/shopTerms/markCodes.ts`). Shop ref is the 1-based position in the flat part list, so it changes if part order changes.

`createExportableProjectCutlist` (`src/domain/productionOutputs.ts`) returns `[]` when `diagnoseProjectIdentity` (`src/domain/cabinetIdentity/productionGate.ts`) is blocking. Machine export reads those lines. `MachinePartMetadata` (`src/domain/machineExport/types.ts`) keeps `shopRef`, `partId`, and `cabinetId`. `createMachineJobDocument` does not add a field equal to the cut-list `key`, but that key is `cabinetId + ":" + partId`. Operations are intent/preview (`MACHINE_EXPORT_DISCLAIMER`: “Intent / preview only — not verified CNC toolpaths”).

BOQ lines reuse the cut-list key (`buildBoqFromReport` in `src/domain/boq/fromReport.ts` sets `key: line.key`).

### Sample proof that tree nodes do not name those parts

Generated by `scripts/stage1-baseline/generate.ts` from `getDefaultCabinetConfig("base")` and `getDefaultCabinetConfig("drawer")` on the back wall, then `createProjectProductionCutlist` and `buildSceneTree`. Full dump: `docs/studio-workspace-redesign/stage1-samples/part-identity-vs-tree.json`.

- Cut-list lines: 19
- Scene-tree nodes: 7, kinds only `room | wall | run | cabinet | opening`
- Construction part ids for `cab-base`: `left-side`, `right-side`, `top`, `bottom`, `back`, `shelf`, `divider`, `door`, `toe-kick`
- Construction part ids for `cab-drawer`: those case parts plus `drawer-front`, `drawer-side`, `drawer-front-back`, `drawer-bottom`, `toe-kick`
- `cutlistKeysPresentAsTreeNodeIds`: `[]`

Example cut-list identity: `cab-base:left-side` / partId `left-side` / shop ref `C01-P01`. The matching tree node is `cabinet:room-1:cab-base`, and the door opening node is `opening:room-1:cab-base:opening-primary`, not `cab-base:door`.

### Stage 2 risk

Stage 2 (part identity across tree, 3D, and cut list) cannot treat current tree node ids as part ids. A proof has to join three different keys:

1. Tree: `opening:${roomId}:${cabinetId}:${leaf.id}` or `cabinet:${roomId}:${cabinetId}`
2. Cut list / BOQ: `${cabinetId}:${CabinetPart.id}`
3. Machine export: `partId` + `cabinetId`, plus a positional `shopRef`

Quantity is collapsed onto one line (`door` qty 2; `drawer-side` qty `drawerCount * 2`). One physical piece is not one node and not one cut-list row. A current construction key sometimes appends the opening leaf id (`door-${opening.id}`) when more than one opening of that kind exists. The default single opening omits that suffix (`door`, `drawer-front`). Interiors 3D selection is a fourth id space (living-room object ids) until the engineering adapter copies cabinet ids.

## 5. Quote / freeze / proposal

### Live versus issued

`buildLiveInteriorQuote` (`src/domain/livingRoom/proposal/liveQuote.ts`) prices the interior document through `cabinetProjectFromInteriorProject`, `createProjectReport`, and `buildProjectQuote`, plus interior estimate lines when the estimate is enabled. `latestFrozenQuote` is `quoteHistory[0]`. `appendFrozenQuote` prepends the new snapshot (`src/domain/livingRoom/proposal/commercialState.ts`). `isQuoteStale` / `quoteStaleReason` (`staleQuote.ts`) mark stale when design fingerprint, rates fingerprint, sell total, cabinet count, or revision differ. A missing frozen snapshot is not stale.

`createQuoteSnapshotFromQuote` (`src/domain/quoteSnapshotFromQuote.ts`) copies summary cards and `estimateLines` into `detailLines`. Comment in that file: snapshots are not rebuilt from live data afterwards. `clampQuoteSnapshot` deep-copies nested lines (called out in `freezeCabinetProjectQuote`).

Two freeze entry points:

| Path | Call chain |
| --- | --- |
| Interiors Present | `useProposalWorkflow.freezeQuote` → `freezeQuoteAndSyncLedger` → `tryFreezeProposal` → `freezeProposal` → `freezeLiveQuote` + `appendFrozenQuote`, then `syncFrozenQuoteToLedger` |
| Engineering Reports quote tab | `useReviewWorkflow.handleFreezeQuoteSnapshot` → `prepareCabinetFreezeForLedger` → `freezeCabinetProjectQuote` (`src/domain/quoteExport/cabinetFreeze.ts`) → `syncFrozenQuoteToLedger` |

`tryFreezeProposal` refuses when entitlements fail `gateFreezeQuotes` or when `live.missingRate` is true. UI copy: freeze requires an active paid plan (Designer or higher). If ledger sync fails, the freeze still applies and `ledgerStatus` is surfaced.

Cabinet re-freeze bumps the revision when the latest snapshot is stale and the job revision was not already advanced (`freezeCabinetProjectQuote`). Interiors does the same via `bumpRevisionWhenStale` in `freezeProposal`, unless the revision label was already moved.

### Markup, GST, validity

`DEFAULT_QUOTE_SETTINGS` (`src/domain/quoteSettings.ts`): markup 18%, tax 18%, tax label `GST`, discount 0, validity 30 days, finish premium 10%, currency `INR`. `quoteValidUntil` adds `validityDays` to `quotedAt`. `buildProjectQuote` rounds money to whole rupees and applies finish premium, labour allowance, markup, discount, then tax.

Present UI (`InteriorsPresentCommercial`) edits markup %, tax % (label from `taxLabel`), discount %, and validity days. `InteriorsPresentQuote` shows selling total, frozen/live/stale status, validity date, and the Freeze button. It does not list BOQ rows.

### Export entry points

| Export | Entry |
| --- | --- |
| Live quote CSV | `csvFromProjectQuote` — columns Kind, Label, Amount, Detail, plus a total row |
| Issued snapshot CSV | `csvFromFrozenSnapshot` (`src/domain/quoteExport/csvRows.ts`). Missing `detailLines` emits `Not captured on this revision` |
| Live BOQ CSV | `csvFromBoqViews` via `buildCommercialExportBundle` (`src/domain/quoteExport/buildExportBundle.ts`). Bundle comment: live quote and live BOQ are current design/rates; `frozenCsv` is the issued quote. `liveDivergesFromFrozen` is set when sell total or cabinet count differ |
| Proposal PDF | Domain `exportProposalPdf` / `exportInteriorProposalPdf` (`src/domain/livingRoom/proposal/proposalPdf.ts`) return a `Blob`. The UI wraps that blob in `useProposalWorkflow.createProposal`, which then calls `promptSavePath` / `writeBinaryBlob`. Gate must be `ready`. Release is recorded only after the file is written (`proposalExportCommit`, `recordProposalRelease`). Stage 1 did not exercise the exporter. |
| Invoice template | Domain `buildInvoiceTemplateDocument` / `exportInvoiceTemplatePdf` (returns a `Blob`) / `jsonFromInvoiceTemplate` (`kind: "invoice-template"`). Payments UI creates a ledger invoice with `createInvoiceAndRollForward`, which is a commercial document. Stage 1 did not exercise the PDF exporter. |

### UI gap

There is no React component under `src/components` that renders a BOQ. `rg` for `Boq` / `boq` in `src/components` returned no matches. Present and Review share `InteriorsPresentQuote` (one selling total). `InteriorsPresentPanel` includes this note: “Live quote and commercial fields stay here until the commercial dialog design pass.” A split shell with a live BOQ beside an issued proposal is not in the UI. BOQ exists as domain export (`src/domain/boq/`) beside the quote CSV in `buildCommercialExportBundle`.

The connected commercial sample reuses `designedAndRated`, `placeSmokeMillwork`, and `fillMissingCategoryRates` from `src/domain/livingRoom/proposal/designToFreezeSmoke.helpers.ts` (the same helpers as `designToFreezeSmoke.test.ts`). Project id `stage1-cabinet-commercial`, snapshot `stage1-cabinet-snap-1`, timestamp `2026-09-23T12:00:00.000Z`. Summary: `docs/studio-workspace-redesign/stage1-samples/cabinet-commercial-summary.json`.

- Cabinets on the adapted project: `smoke-wardrobe` (`living:wardrobe-wall`, almirah) and `smoke-base` (`living:base-cabinet-900`, base).
- Cut list: 20 lines. Keys include `smoke-wardrobe:left-side` and `smoke-base:door` (`cabinet-commercial-cutlist.csv`).
- Frozen quote cabinet count 2. Issued lines include `C01 · Wardrobe Wall` (4801) and `C02 · Base Cabinet · 900` (2083), plus interior finish lines (`cabinet-commercial-frozen-quote.csv`).
- Sell total 53403 INR, workshop 38123, markup 18% (6904), GST 18% (8146), valid until `2026-10-23T12:00:00.000Z`. Live total matches. `missingRate` is false.
- Ledger project id is the interior id `stage1-cabinet-commercial`. Document total equals the frozen sell total (`cabinet-commercial-ledger.json`).

## 6. Payment ledger

Types: `src/domain/paymentLedger/types.ts`. Public API: `src/domain/paymentLedger/index.ts`.

- Documents: `frozen_quote` | `invoice`. Thread: `quoted` → `accepted` → `invoiced`.
- Current obligation: `currentObligationForProject`. Superseded documents report outstanding 0 and overdue 0 (`computeDocumentBalances`).
- Schedule: `setPaymentSchedule`. Instalment sum above the document total throws. Audit action `schedule_set`.
- Receipts: `recordPayment`. FIFO allocation is `applyPaymentsFifo` (`src/domain/paymentLedger/fifo.ts`). Overdue ignores future instalments.
- Corrections: `voidPayment`, `refundPayment`, `correctPayment`, `reallocatePayment` in `adjustPayments.ts`. Void, refund, and correct require a reason (`requireCorrectStamp`). They call `assertPaymentMutation(gate, "correct")`.
- Invoice: `createInvoiceAndRollForward`. `registerCommercialDocFromFreeze` refuses when the current obligation is already an invoice (`INVOICE_SUPERSEDE_REFUSE`).
- Storage: `PAYMENT_LEDGER_STORAGE_KEY = "cabinet-studio-payment-ledger-v1"` (`store.ts`). `InteriorPaymentsPanel` reads and writes that key on this device. Copy in the panel: “Records only: no money is collected here.”
- Wiring: panel is the Payments tab of Project tools. View requires `canUsePaymentRecords`; a company org also needs a seat with `payments:view`. Writes call `assertPaymentMutation`. Empty state: “Freeze a quote in Present to create a commercial obligation for this project.”
- Cabinet projects get a ledger id through `ensureCabinetLedgerProjectId` inside `prepareCabinetFreezeForLedger`. The design-to-freeze smoke asserts that id is the interior project id, not `"cabinet-project"` or the job number.

Stage 1 in-memory sample (`cabinet-commercial-ledger.json`) is the same freeze as section 5 (sell total 53403), as-of `2026-09-23T12:00:00.000Z`:

- document kind `frozen_quote`, thread `quoted`, snapshot `stage1-cabinet-snap-1`, project `stage1-cabinet-commercial`
- schedule Booking 21361 due `2026-09-01` (`inst-booking`), Balance 32042 due `2026-12-01` (`inst-balance`)
- one receipt of 21361
- balances: received 21361, outstanding 32042, overdue 0 (the past instalment was fully covered; the remainder is due in December)

`createLedgerId` uses `Date.now` and `Math.random`. The generator freezes both (section 7), so document id `cdoc-1790164801843-1315` and payment id `pay-1790164801847-2189` repeat on regeneration.

## 7. Export examples

Regenerate every file under `docs/studio-workspace-redesign/stage1-samples/` with:

```bash
node node_modules/vite-node/vite-node.mjs scripts/stage1-baseline/generate.ts
```

The script is `scripts/stage1-baseline/generate.ts`. It installs a fixed clock before domain imports: `new Date()` is `2026-09-23T12:00:00.000Z` (`STAGE1_NOW` in `scripts/stage1-baseline/constants.ts`), `Date.now` is that epoch plus a call counter, and `Math.random` is a seeded LCG (`STAGE1_RANDOM_SEED = 1`). Two consecutive runs produced the same SHA-256 over the sample directory. The script deletes the sample directory first, so the folder matches the generator.

Engineering fixture (`engineeringSamples.ts`): `getDefaultCabinetConfig("base")` and `getDefaultCabinetConfig("drawer")`.

Commercial fixture (`commercialSamples.ts`): `designedAndRated("stage1-cabinet-commercial")`, then `placeSmokeMillwork`, then `fillMissingCategoryRates`. Cut list comes from `cabinetProjectFromInteriorProject` on that same document. Quote freeze and ledger use that same snapshot.

| File | What it is |
| --- | --- |
| `cutlist-sample.csv` | Engineering cut list, 19 lines. First row: `C01-P01`, Base Cabinet, Left Side Panel. |
| `part-identity-vs-tree.json` | Engineering cut-list keys, current construction keys, and flattened scene-tree nodes. `cutlistKeysPresentAsTreeNodeIds` is `[]`. |
| `machine-export-full.json` | Complete `exportProjectMachineFile(..., "json-preview")` for the engineering project. 19 parts, 43 operations, `generatedAt` `2026-09-23T12:00:00.000Z`. This is the regression fixture. |
| `machine-export-summary.json` | Part list with `operationKinds` only, pointing at the full file. |
| `cabinet-commercial-cutlist.csv` | 20 lines for `smoke-wardrobe` and `smoke-base`. |
| `cabinet-commercial-live-quote.csv` | `csvFromProjectQuote` for that interior project. |
| `cabinet-commercial-frozen-quote.csv` | `csvFromFrozenSnapshot` for `stage1-cabinet-snap-1`, cabinet count 2. |
| `cabinet-commercial-ledger.json` | Schedule, receipt, balances, and audit for that freeze. |
| `cabinet-commercial-summary.json` | Cabinet ids, cut-list keys, quote totals, and ledger balances together. |

Proposal PDF and invoice PDF were **not exercised** in Stage 1. `exportInteriorProposalPdf` and `exportInvoiceTemplatePdf` return Blobs without UI file saving. Visual PDF validation is deferred. `quoteExport.test.ts` already asserts invoice JSON `kind: "invoice-template"`.

## 8. Relevant tests

Command (focused files, not the full `npm test` suite):

```bash
npx vitest run \
  src/domain/sceneTree/sceneTree.test.ts \
  src/domain/productionCutlist.test.ts \
  src/domain/projectQuote.test.ts \
  src/domain/quoteExport/quoteExport.test.ts \
  src/domain/livingRoom/proposal/proposalQuote.test.ts \
  src/domain/livingRoom/proposal/phaseBFreeze.test.ts \
  src/domain/livingRoom/proposal/designToFreezeSmoke.test.ts \
  src/domain/paymentLedger/syncFreezeToLedger.test.ts \
  src/domain/paymentLedger/ledgerMutations.test.ts \
  src/domain/paymentLedger/ledgerCorrections.test.ts \
  src/domain/paymentLedger/outstandingFifo.test.ts \
  --reporter=dot
```

Result after the sample generator landed: **11 files, 48 tests, 48 passed, 0 failed.** Duration about 0.95s (Vitest 1.6.1). No failing names.

| File | Tests | What the file name covers |
| --- | --- | --- |
| `src/domain/sceneTree/sceneTree.test.ts` | 4 | room > wall > run > cabinet > opening; structured names; reorder/pack; isolate toggle |
| `src/domain/productionCutlist.test.ts` | 5 | per-cabinet source refs, grouping, CSV header, shop ref `/^C0\d-P/`, plus costing cases in the same file |
| `src/domain/projectQuote.test.ts` | 4 | quote build |
| `src/domain/quoteExport/quoteExport.test.ts` | 4 | CSV/Excel/JSON bundle and invoice template fields |
| `src/domain/livingRoom/proposal/proposalQuote.test.ts` | 8 | proposal quote |
| `src/domain/livingRoom/proposal/phaseBFreeze.test.ts` | 3 | freeze / rates fingerprint behavior |
| `src/domain/livingRoom/proposal/designToFreezeSmoke.test.ts` | 2 | design → rates → freeze → frozen CSV; millwork through the adapter; ledger id is the interior id |
| `src/domain/paymentLedger/syncFreezeToLedger.test.ts` | 5 | freeze registration and sync |
| `src/domain/paymentLedger/ledgerMutations.test.ts` | 4 | payment writes |
| `src/domain/paymentLedger/ledgerCorrections.test.ts` | 2 | void / refund / correct / reallocate |
| `src/domain/paymentLedger/outstandingFifo.test.ts` | 7 | balances and FIFO |

Other payment tests exist and were not in this run: `reviewFindings.test.ts`, `mustFixFindings.test.ts`, `clientHistory.test.ts`, `cabinetLedgerProjectId.test.ts`.

## 9. Stage 1 done checklist

Proven in this stage:

- Branch and clean HEAD recorded before the audit files.
- Interiors home, 2D plan, 3D model, Review, Present, payments, engineering/cut list, and the cabinet scene tree are mapped to components, hooks, and domain modules.
- `SceneTreeNodeKind` stops at `opening`. Isolate and focus operate on cabinet id sets. The tree is not mounted in the Interiors workbench.
- Cut-list and machine-export identity is `cabinetId` + the current construction key, with a positional shop ref. The engineering sample shows zero overlap between those keys and scene-tree node ids. Key stability under edits is not claimed.
- Quote freeze, GST/markup/validity defaults, live versus `quoteHistory[0]`, stale rules, and proposal/invoice export entry points are located. Present/Review do not render a BOQ.
- One connected fixture runs cabinet → cut list → frozen quote → ledger (`cabinet-commercial-*`). Cabinet count on that freeze is 2.
- Full machine export is `machine-export-full.json` (19 parts). `machine-export-summary.json` is the short index.
- Samples regenerate from `scripts/stage1-baseline/generate.ts` with a fixed clock. Consecutive runs matched.
- Payment schedule, balances, corrections, and `InteriorPaymentsPanel` wiring are located. The ledger sample total matches the frozen sell total.
- Focused domain tests: 48/48 passed.

Deferred (do not treat as done):

- Stage 2: a shared part identity that a tree node, a 3D pick, and a cut-list row can all use, including mutation tests for construction-key suffixes. Current ids do not join (section 4).
- Stage 3: shared shell and tokens.
- Stage 4: shared 2D/3D workspace. Today Interiors plan/model and the engineering `CabinetScene` are separate surfaces, and the scene tree is engineering-only.
- Stage 5: carcass / compartment / door / drawer part tree and manufacturing hierarchy.
- Stage 6: dashboard and commercial shell (split BOQ + live proposal). Domain BOQ and quote CSV exist; the UI does not show them side by side.
- Stage 7: handoff regression and full-suite/e2e proof. This stage ran 11 domain files only.
- Proposal PDF and invoice PDF were not exercised. Domain exporters return Blobs; visual PDF validation is deferred (section 7).
