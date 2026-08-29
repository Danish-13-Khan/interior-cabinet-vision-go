# Interior Design Tool — Full Gap Roadmap (2D → 3D → Render → Export)

**Status:** Planning only — do not implement until this roadmap is approved.  
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
- Selection in 3D updates the same inspector (optional later polish).

### 2.5 Render
- Camera framing + lighting recipes.
- Draft vs Client Preview clearly different.
- Trusted still path for package (StillJob) without rewriting project truth.

### 2.6 Export
- Millwork schedule CSV/PDF from live mm.
- Client package: stills + PDF summary + project provenance.
- Layout warnings before export.

---

## 3. Scorecard — where we are after Floorplanner A–G

| Mode | Strength today | Why it still feels behind |
| --- | --- | --- |
| **Project** | Strong V2 home, save/open, schema v2 | Templates / multi-room starters thin |
| **Build** | Freeform room/wall, openings, dims, surfaces, topology | No room-split-by-wall; no node drag; weak multi-room chrome |
| **Design** | Catalog place/snap/run, millwork inspector | Thin runs/fillers/corners on freeform; small catalogs |
| **3D** | Live compile, dollhouse, walkthrough | Nav / selection / material richness polish |
| **Render** | Hybrid stills + package camera decks + tier honesty gates | Polish deliverable suite |
| **Export** | JSON + millwork CSV/PDF + client package | Not a polished deliverable suite yet |

```text
Project   ████████░░
Build     ███████░░░   ← largest “interiors tool” feel gap
Design    ██████░░░░   ← millwork differentiator still thin
3D        ███████░░░
Render    █████░░░░░
Export    ██████░░░░
```

**Floorplanner A–G closed the capability checklist.**  
**This roadmap closes the “feels like an interiors product” gap.**

---

## 4. Missing features (full inventory)

### H — Build authoring feel (do first)

| ID | Missing feature | Why it matters |
| --- | --- | --- |
| H1 | **Room-split Draw Wall** — wall across closed room → two rooms + regen floors/ceilings | Core “draw wall under floor” magic |

**H1 status:** Implemented — Draw Wall bisects a closed face into two rooms with a shared wall, regenerates floor/ceiling zones, remaps objects/lights/cameras by containment, and keeps partitions non-splitting. Minimal room switcher + rename landed so both faces are reachable in 2D/3D.
| H2 | **Drag nodes / move walls** — endpoint + wall translate with snap | Plan editing feels like CAD, not commit-only |

**H2 status:** Implemented — Select-tool node handles + wall-body drag, snap, opening clamp, coincident join, undoable commands, E2E.

| H3 | **Multi-room chrome** — room list, active switch, rename, delete, merge | Topology useless without navigation |

**H3 status:** Implemented — Build room list supports active switching, rename, safe delete, and adjacent room merge. Merge removes the shared boundary and transfers room-owned content into the kept face. Intentional MVP limits: hole-bearing room merges deferred; delete/merge use `window.confirm` (no custom dialog yet).
| H4 | **Draw / edit feedback** — live draft dims, snap guides, hover handles | Perceived quality of every Build tool |

**H4 status:** Implemented — Draw Room/Wall and Select-tool node/wall edits show live mm dimensions, axis/snap guides, node snap targets, and hover affordances before committing changes.
| H5 | **Room / wall selection inspector** — preview, thickness, height, materials | Right panel reads as design tool |

**H5 status:** Implemented — the right inspector now previews the active room and selected wall, with undoable room sizing plus wall thickness, height, and material editing. Intentional MVP limit: E2E covers material clear + undo; thickness/height edit round-trips remain light.

### I — Design / millwork depth (differentiator)

| ID | Missing feature | Why it matters |
| --- | --- | --- |
| I1 | Freeform-aware cabinet runs (extend, gap, align) | Shop salesperson credibility |

**I1 status:** Implemented — cabinet runs persist wall-bound metadata and reflow on arbitrary wall vectors with start/center/end alignment, explicit gaps, and an extend-to-wall option.
| I2 | Fillers + corner units on irregular walls | Real layouts, not single boxes |

**I2 status:** Implemented — cabinet runs can auto-generate 40–150 mm fillers on freeform wall segments, and a corner wardrobe catalog item snaps to room wall junctions on irregular plans.
| I3 | Collision / overlap validation with clear UI | Trust before export |

**I3 status:** Implemented — freeform-aware overlap and clearance validation is actionable in Plan, Model, and Review, and blocks workshop exports until errors are resolved.

| I4 | Richer curated openings (6–12) + millwork SKUs | Catalog feels intentional, not stub |

**I4 status:** Implemented — eight curated opening families (four doors, four windows) carry distinct defaults and plan symbols; three SKU-labelled tall/base/wall modules are visible in Design, survive into schedules, and intentionally reuse the procedural bookcase mesh as an MVP height-band stand-in.
| I5 | Material browser polish (swatches, slots, apply-to-selection) | Interiors look finished in 2D/3D |

**I5 status:** Implemented — Materials rail uses kind-filtered swatches with active highlighting; object/opening inspectors share slot swatch rows; apply-to-selection paints shared slots across multi-select in one undo (skips objects missing the chosen slot); plan objects tint from face-first slots (e.g. fronts) so painted finishes read on-plan.

### J — 3D review polish

| ID | Missing feature | Why it matters |
| --- | --- | --- |
| J1 | Clearer dollhouse / orbit / walkthrough onboarding | Clients understand 3D instantly |
| J2 | 3D selection ↔ inspector parity for openings/objects | Continuous review, not screenshot-only |
| J3 | Soft lighting / material preview defaults | “Looks designed” without photoreal |

**J1 status:** Implemented — first-entry 3D guide explains the three client-facing navigation modes in plain language, previews each mode in-place, keeps a persistent mode/purpose readout, and can be reopened from the camera toolbar. Escape reliably returns walkthrough users to Dollhouse.

**J2 status:** Implemented — compiled objects and openings resolve to shared project selections in 3D; selection highlights follow between plan/model views, blank-canvas/architecture and cross-entity picks clear stale state, and the same object/opening inspector remains editable throughout review.

**J3 status:** Implemented — Model View defaults to Draft preview (not hero/photoreal), applies soft studio lighting and designed material tuning via dedicated preview resolvers, and keeps honesty badges on the PREVIEW tier even when Standard quality is selected for richer textures.

### K — Render & stills

| ID | Missing feature | Why it matters |
| --- | --- | --- |
| K1 | Complete **Phase 2 Hybrid Stills** under trust contract | Client delivery ceiling |

**K1 status:** Implemented — StillJob v2 handoff, hero still engine, Render Studio review (plate | still | diff), deterministic rerun gate, and accepted-still client package provenance. Proof: `npm run phase2:proof`.
| K2 | Camera bookmarks + named views for package | Repeatable client decks |

**K2 status:** Implemented — ordered package camera bookmarks with named views in Render Studio, persisted on `renderSettings.packageCameraBookmarks`, exported via `package-views.json` + manifest/PDF deck section.
| K3 | Keep honesty: Draft ≠ Client Preview ≠ Still | Product trust |

**K3 status:** Implemented — three-tier honesty catalog, context-aware Render Studio badge + settings legend, client package `presentationHonesty` manifest block, PDF tier notes. Proof: `npm run phase2:proof` (includes K3 unit + e2e).

### L — Export & presentation

| ID | Missing feature | Why it matters |
| --- | --- | --- |
| L1 | Harden Millwork Schedule v1 as default workshop output | Cabinet-aware claim |

**L1 status:** Implemented — Schedule CSV/PDF is the primary workshop output on the plan titlebar and Review panel; `exportMillworkSchedulePdf` is wired; cutlist and production packet moved under a **Production** disclosure.
| L2 | One-click client package (PDF + stills + schedule) | End of the agenda |

**L2 status:** Implemented — `assembleClientPresentationFiles` bundles millwork schedule PDF/CSV; Review panel **Export client package** writes one folder via a single save dialog; accepted stills lift to workspace state so Review and Render Studio share the same package.
| L3 | Pre-export validation checklist in Review | No silent broken layouts |

**L3 status:** Implemented — Review shows an explicit Pass/Fail/Review checklist (layout clear, millwork placed, package deck, accepted stills, advisories). Blocking fails gate both Review and Render Studio package exports; issue rows remain selectable.

### Explicitly out of scope (keep deferred)

- Styleboards / Autostyler / AI moodboards  
- Huge furniture marketplace  
- AI floor-plan CV  
- Multi-building / whole-house RE packages  
- Synaps photoreal as the Build/Design goal  
- Full CNC / MES / pricing engine  

---

## 5. Phased roadmap (approve before coding)

Effort is relative (S / M / L / XL). Ship behind V2. Keep Menu → 2D → 3D → Render → Export.

### Phase H — Build feel (room-split + edit + multi-room) · XL · **NEXT**

**Goal:** Drawing and editing the plan feels like an interiors floor planner.

| Slice | Work | Size |
| --- | --- | --- |
| H1 | Face-split: Draw Wall across closed room → two rooms, shared wall, floors regen, undoable | L |
| H2 | Move node / drag wall endpoint; wall translate with topology repair | L |

**H2 status:** Implemented — Select tool exposes node handles and wall-body drag with grid/node snap, opening clamp after length change, coincident join on drop, undoable `moveNode` / `moveWall` commands, and live wall preview while dragging.

| H3 | Room switcher + rename + delete (+ merge MVP) | M |

**H3 status:** Implemented — active switch, rename, delete, and shared-wall merge MVP are all undoable through the Build panel. Hole-bearing merges deferred; delete/merge still use browser `confirm` dialogs.
| H4 | Live draft dimensions + snap guides while drawing | M |

**H4 status:** Implemented — live unit-aware draft dimensions, snap guides/targets, and wall/node hover feedback cover Draw and Select edits.
| H5 | Selection inspector for room / wall (thickness, height, material) | S–M |

**H5 status:** Implemented — Build inspector provides room/wall previews and construction/finish editing for the active selection. E2E covers material clear + undo; thickness/height round-trips still light (non-blocking).

**Exit:** Designer draws a 2-room flat by splitting one room with a wall, renames rooms, drags a corner, places doors, sees floors update in 2D and 3D.

**Blocked by:** Existing D0–D4 topology (already landed). No schema rewrite expected unless split needs new loop ops (prefer pure domain ops on v2 graph).

---

### Phase I — Design feel (millwork on freeform) · L · after H1 at least

**Goal:** Design mode feels like an interior / millwork layout tool on real plans.

- I1–I3: runs, fillers/corners, collision UI on freeform walls  
- I4–I5: curated catalog + material browser depth (stay under v1 catalog ceiling)

**I1 status:** Implemented — wall-bound cabinet runs preserve their physical order along any wall segment, support gap/alignment/extend controls, and automatically reflow after wall or endpoint edits. The ordering primitive is shared with the established Cabinets CAD run path.

**I2 status:** Implemented — auto fillers use the shared CAD sizing rule, stay synchronized through run edits/deletes/wall reflow, and corner wardrobes stay attached to their irregular-plan junctions.

**I3 status:** Implemented — validation is live across Design/Build/Review, distinguishes blocking collisions from advisory clearance checks, highlights/selects involved plan objects, and blocks workshop exports. The header’s **Export JSON** is intentionally a project backup download and remains ungated.

**I4 status:** Implemented — eight curated opening families (four doors, four windows) carry distinct defaults and plan symbols; three SKU-labelled tall/base/wall modules are visible in Design, survive into schedules, and intentionally reuse the procedural bookcase mesh as an MVP height-band stand-in.

**I5 status:** Implemented — curated material browser with kind filters and swatches, slot-level finish editing, multi-select apply (skip missing slots), face-first 2D plan tint, and opening inspector material coverage.

**Exit:** Wardrobe run + fillers on an L-room wall; validation visible; schedule matches placed units.

**Reuse:** I1 shares the proven Cabinets CAD ordering primitive; I2–I3 should continue bridging its filler/corner and validation logic into Interiors V2 rather than reinventing it.

---

### Phase J — 3D review polish · M · can overlap late H / I

- J1–J3 only (onboarding, selection parity, preview defaults)  
- Do **not** reopen endless WebGL tuning (see PRODUCT_DECISIONS)

**Exit:** Client can understand the room in dollhouse/walkthrough without training.

---

### Phase K — Render stills ceiling · L · after trust contract

- Complete Hybrid Stills Pipeline (existing `PHASE_2_HYBRID_STILLS_PIPELINE.md`) — **done (K1)**
- Camera bookmarks for package (K2) — **done**
- Honesty gates across Draft / Client Preview / Hybrid Still tiers — **done (K3)**

**Exit:** Accepted stills land in client package; project remains editable truth. **Met via K1.**

---

### Phase L — Export / presentation finish · M · parallel with I/K

- Millwork Schedule v1 hardened as default — **done (L1)**
- One-click client package — **done (L2)**
- Pre-export validation checklist — **done (L3)**

**Exit:** Salesperson exports schedule + package from a real multi-room project in one session.

---

## 6. Critical path

```text
NOW → Phase H (Build feel)
        H1 room-split  ─┬─→ H2 node/wall drag
                        ├─→ H3 multi-room chrome
                        └─→ H4/H5 feedback + inspector
     → Phase I (Design millwork feel)   // start after H1 stable
     → Phase J (3D polish)              // overlap OK
     → Phase L (Export harden)          // parallel OK
     → Phase K (Hybrid stills)          // when authoring trust is high
```

**Do not start K (stills chase) before H1–H3.**  
Pretty pictures will not hide a plan editor that cannot split a room.

---

## 7. Product threshold (real “interiors tool” exit)

All must be true in one session:

1. Import or draw a footprint  
2. Split into ≥2 rooms with Draw Wall  
3. Place doors/windows; rename rooms  
4. Place a cabinet run that snaps on a freeform wall  
5. Review in dollhouse / walkthrough  
6. Export millwork schedule + client package  

Until then: do **not** market as full Floorplanner / Synaps parity — market as **cabinet-aware interior planner** approaching the threshold above.

---

## 8. Decision checklist (approve before coding)

- [ ] Confirm agenda stays **Project → Build → Design → 3D → Render → Export**  
- [ ] Approve **Phase H** as next work (H1 room-split first)  
- [ ] Confirm H2 node/wall drag is in H, not deferred  
- [ ] Confirm Phase I reuses Cabinets CAD run/filler concepts where safe  
- [ ] Confirm catalogs stay curated (no marketplace)  
- [x] Confirm Phase K follows StillJob trust contract; no stills-first pivot  
- [ ] Confirm deferred list (AI, styleboards, marketplace, Synaps chase) stays cut  
- [ ] Approve this doc as the successor gap map after Floorplanner A–G  

---

## 9. Suggested first sprint after approval

1. **H1 spike:** domain face-split on fixtures (two-room golden after split) + undo  
2. Wire Draw Wall commit path to call split when segment bisects active room  
3. Regen floors/ceilings (reuse D4 loop surfaces)  
4. E2E: split room → rename → door on shared wall → 3D compile  

Then H3 room switcher (cheap UX win) before or with H2 drag.
