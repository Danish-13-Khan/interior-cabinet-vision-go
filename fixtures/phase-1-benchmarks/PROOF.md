# Phase 1 proof pack

Generated: 2026-08-13T01:58:06.625Z
Overall: **PENDING**

## Latency environment
tauri-desktop · draft 1280x720 <= 3000ms · client-preview 1920x1080 <= 8000ms · Apple Silicon laptop, >=16 GB RAM, power plugged in · warm run after discarded cold run

## Latency evidence
- Surface: `browser-dev-substitute`
- Machine: arm64 · darwin 25.5.0 · 16 GB RAM
- Substitute reason: Browser preview harness substitute on Wednesday, August 12, 2026 because Tauri desktop automation is not available in this environment.


## Frames
- `bench-daylight-sofa/camera-a` · camera `lr-camera-bench-daylight-sofa-camera-a`
- `bench-daylight-sofa/camera-b` · camera `lr-camera-bench-daylight-sofa-camera-b`
- `bench-millwork-media/camera-a` · camera `lr-camera-bench-millwork-media-camera-a`
- `bench-millwork-media/camera-b` · camera `lr-camera-bench-millwork-media-camera-b`
- `bench-evening-lamp/camera-a` · camera `lr-camera-bench-evening-lamp-camera-a`
- `bench-evening-lamp/camera-b` · camera `lr-camera-bench-evening-lamp-camera-b`

## Scorecard
| Check | Status | Detail |
|---|---|---|
| ladder | pass | All 6 frames differ on ≥3 Draft vs Client Preview axes. |
| grounding | pass | Client Preview contact opacity 0.94 / res 768 / far 4m |
| window-key | pass | Windowed benchmarks emit a stronger shadowed Client Preview key. |
| framing | pass | All 6 hero frames pass eye-level framing QA (no ceiling-heavy / cut-feet). |
| latency | pending | Substitute latency evidence collected, but official pass/fail still requires locked tauri-desktop evidence. Substitute over-budget rows: bench-daylight-sofa/camera-a/draft=5458ms, bench-daylight-sofa/camera-a/client-preview=29086ms, bench-daylight-sofa/camera-b/draft=11487ms, bench-daylight-sofa/camera-b/client-preview=23768ms, bench-millwork-media/camera-a/draft=3809ms, bench-millwork-media/camera-a/client-preview=18078ms, bench-millwork-media/camera-b/draft=13135ms, bench-millwork-media/camera-b/client-preview=28153ms, bench-evening-lamp/camera-a/draft=5527ms, bench-evening-lamp/camera-a/client-preview=29209ms, bench-evening-lamp/camera-b/draft=6512ms, bench-evening-lamp/camera-b/client-preview=13068ms. Measured on arm64 · darwin 25.5.0 · 16 GB RAM via browser-dev-substitute (Browser preview harness substitute on Wednesday, August 12, 2026 because Tauri desktop automation is not available in this environment.). |
| honesty | pass | Preset honesty + README/UI corpus avoid affirmative photoreal / Synaps / AI claims. |
| automation | pass | All 5 automation gates green (2026-08-12T19:28:10.195Z). |
| data-safety | pass | Benchmark projects serialize/load without Three/path payloads. |

## Draft vs Client Preview ladder
| Frame | Diff axes | Pass |
|---|---|---|
| bench-daylight-sofa/camera-a | key-light-contrast, contact-grounding, material-punch, exposure-framing | yes |
| bench-daylight-sofa/camera-b | key-light-contrast, contact-grounding, material-punch, exposure-framing | yes |
| bench-millwork-media/camera-a | key-light-contrast, contact-grounding, material-punch, exposure-framing | yes |
| bench-millwork-media/camera-b | key-light-contrast, contact-grounding, material-punch, exposure-framing | yes |
| bench-evening-lamp/camera-a | key-light-contrast, contact-grounding, material-punch, exposure-framing | yes |
| bench-evening-lamp/camera-b | key-light-contrast, contact-grounding, material-punch, exposure-framing | yes |

## Latency table (fill `latency-samples.json`)
| Frame | Draft ms | Client Preview ms |
|---|---:|---:|
| bench-daylight-sofa/camera-a | 5458 | 29086 |
| bench-daylight-sofa/camera-b | 11487 | 23768 |
| bench-millwork-media/camera-a | 3809 | 18078 |
| bench-millwork-media/camera-b | 13135 | 28153 |
| bench-evening-lamp/camera-a | 5527 | 29209 |
| bench-evening-lamp/camera-b | 6512 | 13068 |

## Manual PR attachments
- Side-by-side Draft vs Client Preview PNGs under `tmp/phase-1-baselines/`
- Fill `fixtures/phase-1-benchmarks/latency-samples.json` or run `npm run phase1:latency`, then re-run `npm run phase1:proof`
- Machine string and optional substitute reason live in that JSON
