# Dual document rule (phase-0 decision)

**Decision:** Keep both `InteriorProject` and `CabinetProject` for now. The adapter is the permanent seam in this pass. Do **not** merge the models.

## Seam (adapters)

Canonical bridge lives under `src/domain/interiorProject/`:

| Module | Role |
| --- | --- |
| `cabinetAdapter.ts` | `interiorProjectFromCabinetProject` / `cabinetProjectFromInteriorProject` |
| `cabinetAdapterCabinets.ts` | Cabinet object ↔ shell cabinet mapping |
| `cabinetAdapterRooms.ts` | Room / room-config mapping |
| `cabinetAdapterWalls.ts` | Walls, openings, rectangular topology |
| `cabinetAdapterIds.ts` | Stable id / slug helpers |
| `cabinetAdapterShared.ts` | `CABINET_EXTENSION`, `MANAGED_BY`, shared records |

Roadmap text that cites `projectRooms/cabinetAdapter.ts` is outdated; `projectRooms/` owns multi-room **CabinetProject** shell helpers only.

## What each owns

**`InteriorProject`** — whole-interior design of record: rooms, walls, openings, furniture/objects, materials, lights, cameras, surfaces, interior estimate extensions, proposal commercial shell (`extensions`), file format / schema version.

**`CabinetProject`** — millwork editor shell: cabinets, active room config, job meta, quote preferences / history, production and review paths that still speak cabinet-native types. May embed `interiorDocument` and `ledgerProjectId`.

## What never crosses without the adapter

- Room topology, openings, and cabinet identity fields must not be hand-copied between documents.
- Quote freeze on the interiors path converts through `cabinetProjectFromInteriorProject` (see `livingRoom/proposal/liveQuote.ts`).
- Ledger sync on the cabinet path must not invent a second project key when an interior id exists.

Crossing without the adapter duplicates phase 2–6 behaviour and drifts ids.

## Freeze / ledger project id

`ensureCabinetLedgerProjectId` (`paymentLedger/cabinetLedgerProjectId.ts`):

1. Prefer `CabinetProject.interiorDocument.id` (same id space as `InteriorProject.id`).
2. Else reuse persisted `ledgerProjectId`.
3. Else assign once and persist.
4. Never `job.projectNumber`; never the forbidden fallback `"cabinet-project"`.

Freeze snapshots and ledger documents must key commercial history to that stable id so interiors and cabinet freezes for the same job stay one ledger thread.

Locked by `src/domain/livingRoom/proposal/designToFreezeSmoke.test.ts` (living-room freeze plus wardrobe / kitchen millwork through the adapter).

## Explicit non-goals (this pass)

- No merge of `InteriorProject` and `CabinetProject` into one schema.
- No deletion of either document type.
- No new product split; adapter remains the seam until a later, explicit decision.
