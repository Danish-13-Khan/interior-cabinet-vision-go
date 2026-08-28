# Phase 2 hybrid stills proof

Generated: 2026-08-28T12:00:00.000Z

## Benchmark StillJob gates

| Benchmark | Camera | Trust OK |
| --- | --- | --- |
| bench-daylight-sofa | camera-a | yes |
| bench-daylight-sofa | camera-b | yes |
| bench-millwork-media | camera-a | yes |
| bench-millwork-media | camera-b | yes |
| bench-evening-lamp | camera-a | yes |
| bench-evening-lamp | camera-b | yes |

## Pipeline

- StillJob v2 from InteriorProject + locked camera
- Hero still engine (deterministic grade/contact/sharpen)
- Review: plate | still | diff · Accept / Reject / Retry
- Accepted stills only in client package manifest
- K3 tier honesty: Draft ≠ Client Preview hero ≠ Hybrid Still
