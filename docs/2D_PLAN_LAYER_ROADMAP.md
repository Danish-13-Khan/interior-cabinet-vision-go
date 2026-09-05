# 2D Plan Layer Roadmap

**Document role:** Active roadmap for Interiors 2D plan authoring improvements  
**Product relationship:** Companion to [Cabinet Studio Product and Development Book](./CABINET_STUDIO_PRODUCT_BOOK.md) §15 (2D plan experience) and buyer workflow (measure → room → run → proposal)  
**Baseline date:** 2026-09-05  
**Status:** Approved direction for the next 2D improvement program  
**Constraint:** `STR-004` — do not claim category parity with Floorplanner, Planner 5D, or RoomSketcher  

---

## 0. How to use this doc

1. **Product Book** still governs cabinet geometry, Golden Cabinet Run, and release gates.
2. This roadmap governs **2D plan UX and authoring** only (Interiors V2 plan surface primarily).
3. Historical interiors work remains in [INTERIOR_DESIGN_TOOL_ROADMAP.md](./INTERIOR_DESIGN_TOOL_ROADMAP.md) (H–L largely shipped).
4. Status vocabulary matches the Product Book: `CURRENT` · `NEXT` · `LATER` · `EXCLUDED`.

---

## 1. North star

> A cabinet salesperson can enter a measured room fast, place a credible cabinet run, and trust the plan — without fighting zoom, dimensions, or underlays.

**Primary metric:** time from “new job” → “room + openings + first run on wall” under ~10 minutes for a straight kitchen-style golden path.

**Positioning:** millwork-first measured plan — not a consumer furniture playground.

---

## 2. What is already CURRENT (do not rebuild)

| Area | Notes |
| --- | --- |
| Room draw | Rectangle + polygon; topology walls; draw-wall split |
| Wall edit | Node drag, translate, split/join/delete, thickness/height |
| Multi-room | Switch / rename / delete / merge (hole-bearing merges blocked) |
| Openings | Catalog place; drag along wall; width/height/sill |
| Millwork on plan | Snap, runs, fillers, corners, validation |
| Units / grid | mm-native; 25/50/100 mm grid; readability dims |
| Starters | Blank, wardrobe wall, L-room, 2-room, import-plan underlay |
| Export | Topology SVG + PDF plan page in project packet |
| Dual UI | Interiors plan + Cabinets CAD elevations (intentional) |

Core geometry is strong. This program improves **feel, measure-in, cabinet-plan excellence, and presentation**.

---

## 3. Explicitly EXCLUDED

- Huge furniture marketplace / catalog expansion as a primary program  
- Multi-building real-estate planning  
- Claiming Floorplanner / Planner5D / RoomSketcher parity (`STR-004`)  
- Styleboards / decor social features  
- Perfect hole-topology CAD before salesperson workflow is smooth  
- AI floor-plan CV or DWG import **before** Phases 1–4  

---

## 4. Delivery sequence

### Phase 0 — Stabilize (`NEXT` / immediate)

Stop leaks before new interaction work.

| ID | Item | Exit criteria |
| --- | --- | --- |
| 2D-0.1 | Hole-bearing room merge: clear block or safe path (no dead-end) | Multi-room jobs don’t strand the user |
| 2D-0.2 | Replace `window.confirm` delete/merge with in-app dialogs | No browser confirms on plan ops |
| 2D-0.3 | Golden Kitchen plan regression (draw → openings → run → undo) | Automated or checklist gate stays green |
| 2D-0.4 | Plan label overlap at default/benchmark zoom (`CAB-046`) | Labels remain readable |

**Phase exit:** Golden Cabinet Run plan path is boringly reliable.

---

### Phase 1 — Plan feels like a tool (`NEXT` — start here after Phase 0)

Navigation and measure — the largest gap vs consumer planners for first-time users.

| ID | Item | Competitor gap closed |
| --- | --- | --- |
| 2D-1.1 | Pan + zoom on Interiors plan (scroll, pinch, space+drag) | Floorplanner / RoomSketcher / all |
| 2D-1.2 | Zoom-to-fit + zoom-to-selection | Daily navigation |
| 2D-1.3 | Measure tool (two-point length; optional running dim) | RoomSketcher tape |
| 2D-1.4 | Click wall/room dimension → type exact length (clear which side moves) | Floorplanner edit-dim |
| 2D-1.5 | Stronger snap guides (wall / center / neighbor cabinet) | Placement confidence |
| 2D-1.6 | Keyboard: Delete, duplicate, 90° rotate, Esc cancel | Pro muscle memory |

**Phase exit:** A user who has used Floorplanner once can navigate the plan without a tutorial.

**Likely touchpoints:** `LivingRoomPlanView`, plan stage toolbar, plan interaction hooks under `src/` interiors/living-room plan modules.

---

### Phase 2 — Measured room in (`NEXT` after Phase 1)

Matches the Product Book buyer: site measurement → room shell.

| ID | Item | Notes |
| --- | --- | --- |
| 2D-2.1 | Underlay polish — opacity, lock, scale calibrate, nudge | Import exists; make it trustworthy |
| 2D-2.2 | Calibrate wizard: “this line = X mm / ft-in” | Non-designer friendly |
| 2D-2.3 | Optional site-measure checklist (wall lengths, opening widths) | Sales call / site sheet |
| 2D-2.4 | Clearer opening symbols on plan (readable swing) | Aligns with `CAB-040` spirit |
| 2D-2.5 | Wall vs floor cabinet footprints clearly distinct (`CAB-041`) | Client + engineering read |

**Phase exit:** Photo/PDF underlay → calibrated → walls traced → openings → ready for run.

**Not in this phase:** AI auto-convert image → walls (see Phase 5).

---

### Phase 3 — Cabinet plan excellence (`NEXT` after Phase 2, or parallel with Phase 4)

Lean into the millwork moat (Product Book §15).

| ID | Item | Requirement alignment |
| --- | --- | --- |
| 2D-3.1 | Run preview ghost while placing first unit | Faster “build the run” |
| 2D-3.2 | Obvious one-click complete-wall run + fillers | Guided golden path |
| 2D-3.3 | Inline canvas dim edit for selected cabinet W/D | §15.3 — fewer inspector trips |
| 2D-3.4 | Overlap / fit warnings before drop | `CAB-044` |
| 2D-3.5 | Plan marks / labels toggle for proposal | `CAB-045` |
| 2D-3.6 | Active run highlighting in visual hierarchy | §15.2 |

**Phase exit:** Straight kitchen golden run feels guided, not CAD homework.

---

### Phase 4 — Present the plan (`LATER` / after Phase 3 start)

Steal RoomSketcher’s presentation wedge without their catalog.

| ID | Item | Notes |
| --- | --- | --- |
| 2D-4.1 | Export floor plan — clean PDF/PNG, scale bar, title, job name | Client leave-behind |
| 2D-4.2 | Print layout toggles: furniture / dims / marks | Sales vs eng views |
| 2D-4.3 | Optional company logo / letterhead on plan sheet | Pro feel |

**Phase exit:** One click → shareable measured plan suitable for a proposal attachment.

---

### Phase 5 — Import accelerators (`LATER` / research)

Only after Phases 1–4. Do not start AI here first.

| ID | Item | Risk |
| --- | --- | --- |
| 2D-5.1 | Better underlay (multi-page PDF page pick) | Low |
| 2D-5.2 | AI / CV: image → editable walls | High cost; still needs manual fix. Lab accelerator: [Gemini Floor-Plan Vision](./GEMINI_FLOORPLAN_VISION_ROADMAP.md) **Phase 6** (free hybrid CV, no paid APIs) |
| 2D-5.3 | DWG import | Enterprise; heavy |

**Rule:** Ship Phase 2 underlay polish before any AI floor-plan promise.

---

## 5. Suggested calendar

```text
Now     → Phase 0 stabilize
Next    → Phase 1 pan/zoom + measure + typed dims   ★ biggest UX jump
Then    → Phase 2 underlay + measure-in workflow
Then    → Phase 3 cabinet plan excellence
Then    → Phase 4 presentation export
Later   → Phase 5 AI / DWG only if customers demand it
```

Rough capacity: ~3–4 months focused 2D work for one strong owner; Phases 3 and 4 can partially parallelize with two owners.

---

## 6. Definition of done (program-level)

- New user completes room + door + window + base run without asking “how do I zoom?”
- Site photo / PDF underlay usable in real sales calls  
- Plan PDF attachable to proposals without embarrassment  
- Golden Cabinet Run plan path remains green every week  
- No marketing claim of Floorplanner / Planner5D / RoomSketcher parity  

---

## 7. Relationship to other docs

| Doc | Relationship |
| --- | --- |
| [CABINET_STUDIO_PRODUCT_BOOK.md](./CABINET_STUDIO_PRODUCT_BOOK.md) | Source of truth for STR rules, §15 plan requirements, P0 cabinet program |
| [INTERIOR_DESIGN_TOOL_ROADMAP.md](./INTERIOR_DESIGN_TOOL_ROADMAP.md) | Historical H–L interiors build; this doc is the **active** 2D follow-on |
| [FLOORPLANNER_D0_TOPOLOGY_ADR.md](./FLOORPLANNER_D0_TOPOLOGY_ADR.md) | Topology rules remain binding |
| [PRODUCT_DECISIONS.md](./PRODUCT_DECISIONS.md) | Interiors vs Cabinets chrome decisions stand |

---

## 8. Change log

| Date | Change |
| --- | --- |
| 2026-09-05 | Initial roadmap from competitive 2D audit + Product Book §15 alignment |
