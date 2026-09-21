# Camera Phase 3 — Shared orbit preset (optional polish)

**Branch:** `fix/cabinet-orbit-screen-space-panning`  
**Status:** Implemented locally (uncommitted). Local only — do not push from bot.

## What landed

- `src/domain/orbit/orbitControlsPreset.ts` — small shared commons + separate overrides
- Wired into Model View and CabinetScene for **screen-space panning** (+ damping factors from overrides)
- Unit test: `src/domain/orbit/orbitControlsPreset.test.ts`
- **Not** unified: mouse maps, distance policy (beyond documenting CabinetScene numbers), framing, demand frameloop, auto-rotate

## Shared vs separate

| Concern | Shared? | Where |
|---|---|---|
| `screenSpacePanning` | yes | `ORBIT_SCREEN_SPACE_PANNING` |
| `enableDamping` | yes (flag only) | shared commons |
| damping factor | **no** | `0.06` Model View / `0.15` CabinetScene |
| zoom-to-cursor | **no** | Model View only |
| mouse maps | **no** | stay in each component |
| min/max distance / target | **no** | CabinetScene overrides object only; Model View still uses span resolvers |

## Still out of this phase

- Demand-loop / always-on RAF changes
- Fit-on-load parity work
- Auto-rotate
- Debug HUD (Phase 4)
