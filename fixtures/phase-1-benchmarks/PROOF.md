# Phase 1 proof pack

Generated: 2026-08-26T15:25:04.829Z
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
| latency | pending | Substitute latency evidence collected, but official pass/fail still requires locked tauri-desktop evidence. Substitute over-budget rows: bench-daylight-sofa/camera-a/draft=5291ms, bench-daylight-sofa/camera-a/client-preview=28287ms, bench-daylight-sofa/camera-b/draft=11509ms, bench-daylight-sofa/camera-b/client-preview=23926ms, bench-millwork-media/camera-a/draft=3708ms, bench-millwork-media/camera-a/client-preview=17871ms, bench-millwork-media/camera-b/draft=13214ms, bench-millwork-media/camera-b/client-preview=27620ms, bench-evening-lamp/camera-a/draft=5268ms, bench-evening-lamp/camera-a/client-preview=29233ms, bench-evening-lamp/camera-b/draft=6528ms, bench-evening-lamp/camera-b/client-preview=13983ms. Measured on arm64 · darwin 25.5.0 · 16 GB RAM via browser-dev-substitute (Browser preview harness substitute on Wednesday, August 12, 2026 because Tauri desktop automation is not available in this environment.). |
| honesty | pass | Preset honesty + README/UI corpus avoid affirmative photoreal / Synaps / AI claims. |
| automation | pass | All 5 automation gates green (2026-08-13T05:49:21.788Z). |
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
| bench-daylight-sofa/camera-a | 5291 | 28287 |
| bench-daylight-sofa/camera-b | 11509 | 23926 |
| bench-millwork-media/camera-a | 3708 | 17871 |
| bench-millwork-media/camera-b | 13214 | 27620 |
| bench-evening-lamp/camera-a | 5268 | 29233 |
| bench-evening-lamp/camera-b | 6528 | 13983 |

## Manual PR attachments
- Side-by-side Draft vs Client Preview PNGs under `tmp/phase-1-baselines/`
- Fill `fixtures/phase-1-benchmarks/latency-samples.json` or run `npm run phase1:latency`, then re-run `npm run phase1:proof`
- Machine string and optional substitute reason live in that JSON
