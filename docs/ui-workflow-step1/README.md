# Step 1 — inventory and preservation baseline

Completed September 9, 2026 against application commit
`d6ca8ee162dd799529cf3e61b58967f3e9d97049`.
Scope: step 1 of [UI workflow redesign](../UI_WORKFLOW_REDESIGN.md).
No application controls, handlers, serialization, styling or navigation changed.

## Evidence

- [46 explicit command-palette entries](COMMANDS.md), each with its current
  handler/source and proposed destination.
- [Source inventory](source-inventory.json): those commands, 13 literal storage
  keys, and 1,788 JSX event bindings with source lines and destination buckets.
- [Baseline files](baseline/manifest.json): canonical project JSON, cutlist CSV,
  machine-preview JSON, default shortcuts and contextual commands by view.
- [Unit-test summary](test-summary.json): 927 passed, zero failed/skipped.
- `npm run build`: passed; existing large-chunk warning remains.

The source inventory is intentionally broader than the five sales screens: it
retains engineering and shell handlers. Counts are static source evidence, not
1,788 distinct user commands or proof every control works at runtime. Repeated
bindings, callback forwarding and generated controls are included. Dynamically
dispatched actions require the contracts below. No capability is intentionally
removed: a control without a precise redesign destination stays on its existing
surface until its replacement is reviewed and verified.

## Screens, command contracts and proposed destinations

Paths below are relative to `src/`. These are migration owners; retain their
existing domain commands rather than recreating behavior in new UI components.

| Current surface / source | Capability and handler contract | Proposed location | Existing verification reference |
| --- | --- | --- | --- |
| `routes/RootRouter.tsx` | Web landing/login/register/app gate; Tauri direct app entry | Existing entry flow | Build; web auth remains demo-only |
| `livingRoomPlan/InteriorsProjects*` under components | Create job, starters, open/recent, restore/discard recovery | Projects | `phase-5-empty-room-template.spec.ts`, `living-room-release.spec.ts` |
| `hooks/useProjectFileIo.ts`, `useLivingRoomRecovery.ts` | Load/save, parse errors, autosave/recovery | Header File / Projects | `interiorsSaveReopen.ts`, `desktopExperience.test.ts` |
| `components/livingRoomPlan/interiorsDrawRoomCommands.ts` | `onBuildTool`, `onSetPlanUnderlay`, `onReplaceUnderlay`, `onToggleSiteMeasure`, `onActiveRoom`, `onRenameRoom`, `onDeleteRoom`, `onMergeRooms` | Room tools / room manager | Room drawing, room-management and PDF-underlay browser specs |
| `hooks/useLivingRoomBuildCommands.ts`; `domain/livingRoom/buildCommandDispatcher.ts` | Build tool dispatch, openings, structural and surface edits | Room / selection inspector | `buildToolCommands.test.ts`, `phase-e-build-tools.spec.ts` |
| `domain/livingRoom/structuralCommands.ts`, `openingCommands.ts`, `panelCommands.ts` | Wall/opening/panel operations; attachment-aware changes | Room / contextual Advanced | Wall editing, openings and panels tests |
| `hooks/useLivingRoomPlanEditor.ts`, `useLivingRoomPlanHotkeys.ts` | Selection, placement, nudge, rotate, duplicate, remove, undo/redo | Canvas selection / Edit | Precision canvas and selection-parity specs |
| `components/livingRoomPlan/interiorsCabinetRunCommands.ts` | `onCreateRun`, `onUpdateRun`, `onCompleteRun`, `onTogglePlanMarks`; gap/alignment/extend/fillers options | Cabinets / Run inspector | Freeform runs, fillers/corners, golden run specs |
| `components/livingRoomPlan/CatalogObjectBrowser.tsx` | Filter/search and catalog-item selection | Cabinets / supporting objects | `phase-5-catalog-object-browser.spec.ts` |
| `components/livingRoomPlan/LivingRoomInspectorPanel.tsx` | Object, architecture, wall/opening and finish child inspectors | Selection inspector | Selection parity, wall editing and material tests |
| `components/livingRoomPlan/ContextualCommandRail.tsx` | `onCommand(id)` selection-dependent dispatch | Single contextual action group | `contextualCommandRail.test.ts`, contextual rail browser spec |
| `components/livingRoomScene/ModelViewToolbar.tsx` | Presets, Fit/Focus, guide, clear selection, camera height/FOV, active camera, style, cutaway, rotation, quality | Canvas View; camera popover; Materials; object inspector | Camera navigation and wall-visibility specs |
| `components/livingRoomScene/ModelViewStylePalette.tsx` | Existing style selection | Materials / room style presets | Material browser and preview-default specs |
| `domain/livingRoom/materialLayerCommands.ts`, `domain/catalog/finishCommands.ts` | Material layers and finishes; keep supported scopes/import behavior | Materials / slot inspector | Material layer, texture import, URL import tests |
| `hooks/useProposalWorkflow.ts` | Live quote, proposal revision and downstream workflow | Review / proposal | Proposal quote, release, view-binding tests |
| `components/livingRoomPlan/InteriorsPresent*` | Existing present/quote/commercial/capture navigation | Review / Present | `phase-5-present-send.spec.ts`, golden run |
| `components/livingRoomScene/RenderStudioExportActions.tsx` | Render export actions; retain quality/honesty and capture checks | Present / Render Studio | Render QA, render-honesty specs |
| `hooks/useProductionFileExport.ts` | Prepared file export and actual write gating | Engineering / Export | `productionFileExport.test.ts` |
| `hooks/useAppCommandItems.ts`, `commandItems/draftingCabinetCommands.ts` | File/Edit/Arrange/View/Tools/Export/Review and drafting palette | Header command palette + domain-specific surfaces | `desktopUx.test.ts`; generated command inventory |
| `components/AppWorkspace.tsx`, `WorkspaceDrawingPane.tsx` | Engineering drawing workspace and related tools | Existing engineering workbench | Production, technical drawing and cabinet identity tests |

Browser references above are located in `tests/e2e`; domain test names identify
the relevant existing checks. They are future migration gates, not a claim that
all browser tests were rerun during this step.

## Shortcuts and focus rules

The exact configurable defaults are captured in [shortcuts.json](baseline/shortcuts.json).
Authoritative sources: `src/domain/desktopUx/shortcutMap.ts`,
`src/hooks/useEditorShortcuts.ts`, `useLivingRoomPlanHotkeys.ts`, and
`useModelViewCameraHotkeys.ts`.

- Cmd/Ctrl bindings use either platform modifier, not both simultaneously.
- Global map includes new/save, undo/redo, copy/paste/duplicate/select-all/remove,
  command palette/help, plan/front/side/3D, rail/inspector visibility, workspace
  cycling, drafting select/note/leader, grid, rotate, snap and materials.
- With 3D canvas focus, 1–5 mean Top/Front/Side/Isometric/Perspective. F fits the
  room and Shift+F focuses selection; camera handlers run in capture phase.
- Outside that focus, Interiors 1/2 switch plan/model; F/Shift+F fit plan or
  selection, Cmd/Ctrl+0 fits plan. Escape cancels the tool and clears selection.
- Interiors additionally uses M measure, R/Shift+R rotate ±90°, brackets cycle
  selection, arrows nudge one snap interval and Shift+arrows five intervals.
- B/openMaterial respects the configured binding even in focused 3D.
- The Interiors plan hook hardcodes several shortcuts rather than consuming all
  configurable defaults. Do not claim complete remapping parity in a new UI.
- Modal and editable-field guards must survive the redesign. The plan hook
  excludes input/textarea/select; the camera hook additionally excludes
  contenteditable. Review this existing discrepancy before changing focus rules.

## Contextual commands and camera controls

[Context matrix](baseline/contextual-commands.json) covers plan/model/render for
none, wall, cabinet, panel and other selection kinds. Retain these distinctions:

- None: Select, Measure, Camera; Measure omitted in model view.
- Wall: Material, Add Panel, Hide Wall.
- Cabinet/other: Rotate, Duplicate, Material, Delete.
- Attached panel: Flip Side, Duplicate, Material, Delete. Free Y rotation would
  be overwritten by attachment reflow and must not replace Flip Side.
- A view-only wall cutaway is not the structural operation of lowering a wall.

Moving ModelViewToolbar requires destinations for all its callbacks, not just
the visible Fit buttons: `onViewPreset`, `onCameraHeightMm`,
`onFieldOfViewDegrees`, `onActiveCameraId`, `onApplyStyle`, `onCutawayWalls`,
`onSetRotation`, `onViewportQuality`, `onOpenGuide`, `onClearSelection`,
`onFitRoom`, `onFocusSelection`. Focus Selected is disabled without selection;
rotation is disabled without an active object. Keep these predicates.

## Saved-data boundary

Canonical files use `format: interior-project`, schema version 2, and millimetres.
`src/domain/interiorProject/fileFormat.ts` validates and migrates canonical files,
cabinet project wrappers and single-cabinet configurations; it also enforces a
byte limit. The adapter preserves cabinet identities through engineering handoff.

The inventory lists storage keys for project browser, living-room recovery,
session state, layout, shortcuts, recent files, templates, workshop library,
plan readability, Interiors UI mode, 3D guide and demo web session/theme. These
are key names from source only: no personal saved projects or browser contents
were read or committed. Session persistence is debounced 400 ms and contains
file path, workspace, drafting tool, selected/active cabinet and layout state.

Do not rename keys, reset recovery, alter schema version or change cabinet IDs
as part of the visual migration. Separate preferences from project geometry.

## Baseline output contract

`scripts/ui-workflow-baseline.ts` uses four existing golden cabinet families
(base, wall, tall and drawer) and a synthetic default room. It is an output
fixture, not a physically validated kitchen layout: the instances overlap.

It records the canonical saved file, production cutlist and machine-intent JSON,
then verifies cutlist/machine output equality after loading the saved file.
Input creation/update/date defaults are fixed; only the machine output's
`generatedAt` is normalized. All manufacturing fields remain compared. Machine
preview is not verified CNC code. SHA-256 hashes and byte sizes are recorded in
the manifest for subsequent comparison.

This baseline does not cover pixel renders, PDF bytes, real user projects, every
legacy variant or every commercial configuration. Existing proposal, PDF,
identity, production-gate and migration unit tests passed; targeted browser and
visual checks remain necessary when the corresponding UI moves.

## Repeat and review

```sh
node scripts/ui-workflow-inventory.mjs
node_modules/.bin/vite-node scripts/ui-workflow-baseline.ts
npm test
npm run build
```

The baseline command checks committed files by default and fails on drift.
`--record` is only for an intentional, reviewed baseline update. Never record
over a failure merely to get a green check. Inventory generation updates source
line references; review its diff when handlers are moved.

## Step 1 exit decision

- Complete: source/command inventory, screen and data migration owners, default
  shortcuts, selection/view command matrix and repeatable output fixtures.
- Complete: unchanged golden output through save/reopen, 927 unit checks, build.
- Carry forward: exact placement of retained engineering tools in the detailed
  screen designs; browser reachability, visual quality and actual legacy-project
  recovery checks during later phases. Static mappings cannot certify these.
- Step 2 can start with contrast/overflow fixes while retaining current handlers.
  Any command lacking a verified replacement must stay reachable on its current
  surface; removal is not an acceptable way to simplify the UI.
