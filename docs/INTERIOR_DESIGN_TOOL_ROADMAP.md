# Interior Design Tool — Full Gap Roadmap (2D → 3D → Render → Export)

**Status:** Phases H–L feature work is implemented in the product. Treat release as **feature-complete with verification debt**, not “everything merged and green on `main`,” until the working tree is committed and the full browser suite is reliably green.
**Audience:** After `FLOORPLANNER_SIMPLE_PLAN_ROADMAP` A–G (chrome + topology + tools).
**Product rule:** Stay millwork-first. Look and feel like a **professional interior design tool**, not a Floorplanner clone or a stills marketplace.

**Fixed product agenda (unchanged):**

```text
Menu / Project
  → 2D Build (rooms, walls, openings, surfaces)
  → 2D Design (cabinets, furniture, materials)
  → 3D Review (same project, live compile)
  → Render (cameras / client stills)
  → Export (schedule, images, presentation package)
```

Related: [FLOORPLANNER_SIMPLE_PLAN_ROADMAP.md](./FLOORPLANNER_SIMPLE_PLAN_ROADMAP.md) · [PRODUCT_DECISIONS.md](./PRODUCT_DECISIONS.md) · [PHASE_0_MVP_DEFINITION.md](./PHASE_0_MVP_DEFINITION.md)

---

## 1. What “looks like an interior design tool” means

A designer opens the app and can complete this story without fighting the UI:

```text
1. Start or import a plan
2. Draw / edit the room shell until it matches the site
3. Place doors and windows on walls
4. Zone floors and finishes
5. Place millwork that snaps, runs, and validates
6. Switch to 3D and walk the concept with the client
7. Capture honest client stills
8. Export schedule + presentation package
```

**Parity target is the job above — not feature-count vs Floorplanner.**

| Surface | Must feel like | Must not become |
| --- | --- | --- |
| **2D Build** | Floorplanner-like plan authoring | Form-only room editor |
| **2D Design** | Millwork / interiors layout CAD | Furniture marketplace |
| **3D** | Instant review of the same plan | Separate modeling app |
| **Render** | Client presentation stills | Synaps / photoreal chase as core |
| **Export** | Workshop + client deliverables | Full MES / RE export suite |

---

## 2. Ideal journey (target experience)

### 2.1 Project
- New blank, starter templates (wardrobe wall, L-room, 2-room flat), recent files, underlay import.
- One `InteriorProject` file; save / open / autosave obvious.

### 2.2 Build (2D) — structure
- Draw Room (rectangle + polygon).
- Draw Wall **across a room** → room splits, floors update.
- Drag wall endpoints / nodes; move walls; join / split / delete.
- Multi-room: switch active room, rename, merge, delete without orphan graph.
- Place doors / windows from a small real catalog; drag along wall; live dims.
- Draw floor zones + materials; partitions / columns.
- Underlay calibrate; inner/outer dims; display units.

### 2.3 Design (2D) — interiors
- Curated cabinets + furniture + materials.
- Snap to freeform walls; place / move / rotate / resize / duplicate.
- Cabinet **runs**, fillers, corner units on real walls.
- Inspector: size, materials, door style; validation warnings visible.
- Layers / selection clarity so the plan reads as design, not debug.

### 2.4 3D Review
- One click 2D↔3D; dollhouse default; optional walkthrough.
- Materials and openings look intentional; nav is obvious.
- Selection in 3D updates the same inspector.

### 2.5 Render
- Camera framing + lighting recipes.
- Draft vs Client Preview clearly different.
- Trusted still path for package (StillJob) without rewriting project truth.

### 2.6 Export
- Millwork schedule CSV/PDF from live mm.
- Client package: stills + PDF summary + project provenance.
- Layout warnings before export.

---

## 3. Scorecard — after H–L

Honest read: **feature code landed; release-green only after suite + commit.**

| Mode | Strength today | Remaining gap |
| --- | --- | --- |
| **Project** | V2 home, save/open, schema v2, blank / wardrobe / L-room / 2-room-flat starters | Import-plan underlay polish only |
| **Build** | Room-split, node/wall drag, multi-room chrome, draft feedback, room/wall inspector | Hole-bearing merges deferred; delete/merge use `window.confirm` |
| **Design** | Freeform runs, fillers/corners, validation, curated catalog, material swatches | I4 SKU meshes still use bookcase stand-in |
| **3D** | Onboarding, mesh+label selection, soft draft preview | Keep full browser suite green (K1 flakiness under load) |
| **Render** | Hybrid stills + package cameras + honesty gates (`phase2:proof`) | Suite-level Generate Still timing |
| **Export** | Schedule PDF/CSV, one-click client package, pre-export checklist | Keep exit-journey + K1 green on `main` |

```text
Project   █████████░
Build     █████████░
Design    ████████░░
3D        ████████░░
Render    █████████░
Export    ████████░░
```

**Floorplanner A–G closed the capability checklist.**
**H–L closed most of the “feels like an interiors product” gap.**
**§7 authoring→schedule→client-package path is covered by `tests/e2e/roadmap-exit-journey.spec.ts`.**

---

## 4. Phase inventory (H–L)

### H — Build authoring feel · **DONE (MVP limits noted)**

| ID | Feature | Status |
| --- | --- | --- |
| H1 | Room-split Draw Wall | Done |
| H2 | Drag nodes / move walls | Done |
| H3 | Multi-room chrome (switch, rename, delete, merge) | Done — hole merges deferred; confirm dialogs |
| H4 | Draw / edit feedback | Done |
| H5 | Room / wall selection inspector | Done — swatch materials; thickness/height E2E light |

### I — Design / millwork depth · **DONE (MVP limits noted)**

| ID | Feature | Status |
| --- | --- | --- |
| I1 | Freeform cabinet runs | Done |
| I2 | Fillers + corner units | Done |
| I3 | Collision / overlap validation UI | Done |
| I4 | Richer openings + millwork SKUs | Done — three SKUs reuse bookcase mesh stand-in |
| I5 | Material browser polish | Done |

### J — 3D review polish · **DONE (keep pick path verified)**

| ID | Feature | Status |
| --- | --- | --- |
| J1 | Dollhouse / orbit / walkthrough onboarding | Done |
| J2 | 3D selection ↔ inspector parity | Done — mesh pick + selected/hover labels; cutaway keeps selected opening + host wall |
| J3 | Soft lighting / material preview defaults | Done |

### K — Render & stills · **DONE**

| ID | Feature | Status |
| --- | --- | --- |
| K1 | Phase 2 Hybrid Stills under trust contract | Done — `npm run phase2:proof`; watch suite flakiness |
| K2 | Camera bookmarks + named views for package | Done |
| K3 | Draft ≠ Client Preview ≠ Still honesty | Done |

### L — Export & presentation · **DONE**

| ID | Feature | Status |
| --- | --- | --- |
| L1 | Millwork Schedule v1 as default workshop output | Done |
| L2 | One-click client package | Done |
| L3 | Pre-export validation checklist | Done |

### Explicitly out of scope (keep deferred)

- Styleboards / Autostyler / AI moodboards
- Huge furniture marketplace
- AI floor-plan CV
- Multi-building / whole-house RE packages
- Synaps photoreal as the Build/Design goal
- Full CNC / MES / pricing engine

---

## 5. Remaining work (post H–L)

1. **Commit + land on `main`** when the local verification pass is accepted.
2. **Keep the full browser suite green** — especially K1 Generate Still and the §7 exit journey under sequential suite load.
3. **MVP polish (non-blocking)** — custom delete/merge dialogs; hole-bearing merges; I4 dedicated SKU meshes; thickness/height E2E depth.

---

## 6. Critical path (historical)

```text
DONE → Phase H (Build feel)
DONE → Phase I (Design millwork feel)
DONE → Phase J (3D polish)
DONE → Phase L (Export harden)
DONE → Phase K (Hybrid stills)
DONE → L-room + 2-room-flat starters
NOW  → Verify suite green, commit, optional MVP polish (§5)
```

---

## 7. Product threshold (real “interiors tool” exit)

All must be true in one session:

1. Import or draw a footprint
2. Split into ≥2 rooms with Draw Wall
3. Place doors/windows; rename rooms
4. Place a cabinet run that snaps on a freeform wall
5. Review in dollhouse / walkthrough
6. Export millwork schedule + client package

Authoring→3D→schedule→client package is automated via `roadmap-exit-journey.spec.ts`. Dedicated stills trust coverage remains in K1 / `phase2:proof`. Until both stay green on `main`: market as **cabinet-aware interior planner**, not Floorplanner / Synaps parity.

---

## 8. Decision checklist (approved; H–L shipped)

- [x] Confirm agenda stays **Project → Build → Design → 3D → Render → Export**
- [x] Approve **Phase H** as next work (H1 room-split first) — **shipped**
- [x] Confirm H2 node/wall drag is in H, not deferred — **shipped**
- [x] Confirm Phase I reuses Cabinets CAD run/filler concepts where safe — **shipped**
- [x] Confirm catalogs stay curated (no marketplace)
- [x] Confirm Phase K follows StillJob trust contract; no stills-first pivot
- [x] Confirm deferred list (AI, styleboards, marketplace, Synaps chase) stays cut
- [x] Approve this doc as the successor gap map after Floorplanner A–G

---

## 9. Suggested next sprint (re-review)

1. Run full Playwright suite + exit-journey spec; confirm K1 under suite load.
2. Commit the verification fixes to `main` when green.
3. Then optional MVP polish (dialogs, hole merges, SKU meshes).
