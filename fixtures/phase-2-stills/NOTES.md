# Phase 2A stills fixtures

Proven:
- StillJob v2 from InteriorProject + locked camera (snapshot id + hash)
- millwork / openings / walls refs + §3.1 gates
- revalidation from saved still-job.json
- review accept provenance (rejected stills are not written here)
- support artifact path contract (hero/depth/normal/material ids)
- Render Studio review UI (plate | still | diff, Accept/Reject/Retry)
- Hero still engine v1 (deterministic grade/contact/sharpen)
- Deterministic rerun gate (§3.1 MAD ≤ 2%)
- Accepted stills in client package manifest only

Not in fixtures (by design):
- WebGL PNG capture bytes (too large for git)
- Stochastic / AI still engine
