# Step 8 — workflow entry-point reachability

Runtime map for the five free Interiors areas after Steps 3–7.
Signatures live in `src/domain/desktopUx/interiorsWorkflowEntryPoints.ts`.

| Area | Nav `data-testid` | Signature control | Notes |
| --- | --- | --- | --- |
| Room | `interiors-workflow-area-room` | `interiors-tool-select` | Draw/select/import tools on Room rail |
| Cabinets | `interiors-workflow-area-cabinets` | `interiors-cabinet-run-catalog` | Area defaults chrome tool to Cabinet |
| Materials | `interiors-workflow-area-materials` | `paint-apply-summary` | Surface paint panel |
| Review | `interiors-workflow-area-review` | `interiors-review-panel` | Layout + model quality + proposal gates |
| Present | `interiors-workflow-area-present` | `interiors-present-titlebar` | Client 3D strip; no selection marks |

## Cross-area journey controls

| Control | `data-testid` | Role |
| --- | --- | --- |
| Open Present (Review) | `interiors-review-present` | Review → Present |
| Return to Review | `interiors-present-return-review` | Present → Review |
| Header Present | `interiors-present` | Direct Present entry |
| Inspector object | `inspector-object-{id}` | Selection without canvas hit (2D/3D) |

## Retention rule

Existing entry points remain until a replacement is verified in smoke or a
focused e2e. This checklist proves **reachability**, not manufacturing output.
