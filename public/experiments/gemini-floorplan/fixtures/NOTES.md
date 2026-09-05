# Fixture pack

Synthetic PNGs for Phase 1 demos (not customer plans).
Served from `public/experiments/gemini-floorplan/fixtures/`.

| File | Intent |
| --- | --- |
| rect-kitchen.png | Simple rectangle |
| l-living.png | L-shape / low scale confidence |
| two-room.png | Shared wall |

Offline JSON mirrors live in `src/experiments/gemini-floorplan/sampleProposals.ts`.

Regenerate: `node scripts/gemini-floorplan/generate-fixtures.mjs`
