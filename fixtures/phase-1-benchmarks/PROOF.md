# Phase 1 proof pack

Generated: 2026-08-12T19:28:11.205Z
Overall: **PENDING**

## Latency environment
tauri-desktop · draft 1280x720 <= 3000ms · client-preview 1920x1080 <= 8000ms · Apple Silicon laptop, >=16 GB RAM, power plugged in · warm run after discarded cold run

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
| latency | pending | Fill fixtures/phase-1-benchmarks/latency-samples.json under tauri-desktop · draft 1280x720 <= 3000ms · client-preview 1920x1080 <= 8000ms · Apple Silicon laptop, >=16 GB RAM, power plugged in · warm run after discarded cold run |
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
| bench-daylight-sofa/camera-a |  |  |
| bench-daylight-sofa/camera-b |  |  |
| bench-millwork-media/camera-a |  |  |
| bench-millwork-media/camera-b |  |  |
| bench-evening-lamp/camera-a |  |  |
| bench-evening-lamp/camera-b |  |  |

## Manual PR attachments
- Side-by-side Draft vs Client Preview PNGs under `tmp/phase-1-baselines/`
- Fill `fixtures/phase-1-benchmarks/latency-samples.json` then re-run `npm run phase1:proof`
- Machine string lives in that JSON (`machine` field)
