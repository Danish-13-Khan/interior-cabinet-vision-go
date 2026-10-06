# Apartment templates roadmap (Studio, 1 BHK, 2 BHK, 3 BHK)

**Status:** Complete. All phases (0–7 and 8.0–8.5) are built, reviewed and
merged to `main` (PRs #52–#56, 2026-10-06), and the strict performance gates
pass on a production build (§10). Remaining: one manual check (a two-room
imported plan in the app) and Ilyas confirming the factory defaults (D10).
**Goal:** Four ready-made apartments the user can open with one click. Between
them they show every capability we sell: cabinet types, front systems
(handles, gola, push-to-open, sliding), door styles, finishes, wall
decoration, lighting fixtures and moods, and hosted appliances.
**Scope:** A multi-room template builder, per-room content composers, two
missing front systems (push-to-open, sliding shutters), the four authored
apartments, and their entry points (project home, marketing site, register).
**Relationship to other docs:** Uses the host and attachment pattern from
[`WALL_DECOR_LIGHTING_ROADMAP.md`](WALL_DECOR_LIGHTING_ROADMAP.md). Builds the
push-to-open front system on the front-gap resolver and `FrontSystem` from
[`PLAN_IMPORT_AND_MODULAR_GAPS_ROADMAP.md`](PLAN_IMPORT_AND_MODULAR_GAPS_ROADMAP.md)
(Phases 4–7). Template cards follow
[`UI_CALM_LIGHT_ROADMAP.md`](UI_CALM_LIGHT_ROADMAP.md).

---

## 1. Evidence (verified in code, 2026-10-05)

- **Catalog templates hold one room only.** `ProjectTemplate`
  (`domain/catalog/types.ts:113-122`) has a single `room: {widthMm, depthMm,
  heightMm}`. `instantiateProjectTemplate`
  (`domain/catalog/instantiateProjectTemplate.ts:55-166`) builds one
  rectangular shell with one fixed door and window. Kitchen, L-kitchen and
  bathroom then get special-case finalisers keyed on the template id.
- **The data model already supports several rooms.** `InteriorProject.rooms[]`
  plus `activeRoomId`, a node/loop wall graph (schema v2), and room operations:
  `createWallSegment` (auto-split), `splitRoomByWall`, `drawRoomFromPoints`,
  `renameInteriorRoom` and `mergeInteriorRooms`. The `"2-room-flat"` starter
  (`domain/livingRoom/plannerStarters.ts:81-99`) already builds a two-room flat
  by splitting a rectangle. That is the pattern we will scale up.
- **Plan import also produces multi-room projects.** `applyFloorplanToInterior`
  (`domain/floorplanExtract/applyToInterior.ts:39`) is a second way in: we
  could feed it a synthetic extraction result.
- **3D shows only the active room.** `compileLivingRoomScene`
  (`domain/livingRoom/sceneCompiler.ts:110-127`) keeps objects, lights and
  cameras where `roomId === activeRoomId`. You change rooms with
  `BuildRoomSwitcher`. There is no whole-apartment 3D view.
- **Push-to-open does not exist.** A search for `push.?to.?open|tip.?on` finds
  nothing. `FrontSystem` is `handled | gola`
  (`domain/frontSystem/golaProfiles.ts`). Handle hardware is
  `handle-bar | handle-knob | handle-cup | gola-l | gola-c | gola-wall`
  (`domain/hardwareSystem/catalog.ts:60-80`).
- **Sliding shutters do not exist.** `DoorStyle = none | single | double |
  bi-fold` (`domain/cabinetOpeningStructure/types.ts`). "Sliding" exists only
  as a room door (`opening:door-sliding`).
- **Showcase features that already exist and that we will reuse:**
  - Door styles `slab | shaker | glass` and sourcing `bought | in-house`
  - Gola L / C / wall profiles
  - 9 light fixture kinds (`LIGHT_FIXTURE_KIND_IDS`, `lightFixtureRegistry.ts:4-14`)
  - Recipes `daylight | warm-evening | neutral-studio` and moods `day | evening`
  - 9 wall decoration presets (`WALL_DECORATION_PRESETS`, `wallDecorations.ts:29`)
  - Styles `warm-contemporary | nordic-light | moody-walnut`
  - Hosted `sink-bowl | cooktop` (`hostedAppliances/commands.ts:59`)
  - Kitchen run helpers (`catalog/kitchenTemplateShared.ts`)
- **The register page drops the chosen template.**
  `marketing/pages/Register.tsx:45-83` reads `?template=` and shows it, but
  nothing passes it on to project creation.
- **Catalog item cap.** `livingRoom/v1Scope.ts` (`assertV1CatalogScope`)
  limits the `living:` catalog to 50 items, and about 42 are used. New items
  for the templates (shoe cabinet, crockery unit, study desk, pooja unit) will
  hit the cap, so either raise it or reuse existing items with different
  parameters.

## 2. Decisions

| # | Decision | Why |
| --- | --- | --- |
| D1 | Templates are **typed TS specs** (`ApartmentTemplateSpec`) run by a single builder. They are **not** catalog JSON. | The catalog JSON format can hold only one room, and room composers need code: wall lookup, runs, hosting. Specs stay data-shaped so they can move to JSON later. |
| D2 | Room layouts are **guillotine splits** of a rectangle: each split is one straight wall from edge to edge of an existing room. | This is how `"2-room-flat"` already works with `createWallSegment`, and it gives clean shared walls. If Phase 0 shows that T-junction splits are unreliable, fall back to a synthetic `ExtractionResult` through `applyFloorplanToInterior`. |
| D3 | **Deterministic ids** (`apt-2bhk:room:kitchen`, `apt-2bhk:obj:kitchen-base-1`, …). | Stable thumbnails, stable tests, and later template upgrades can be compared. |
| D4 | v1 keeps **active-room rendering**. Each room gets a **showcase camera bookmark**, and the template opens in its "hero" room. | A whole-apartment 3D view is a separate rendering project (light budget, performance). Deferred to Phase 8. |
| D5 | **Every capability appears in at least one template** (matrix in §4). The checklist is enforced by a coverage test in Phase 5. | This is what makes the templates a showcase rather than four random flats. |
| D6 | Sizes are typical Indian **carpet areas**: Studio ≈ 32 m², 1 BHK ≈ 50 m², 2 BHK ≈ 80 m², 3 BHK ≈ 115 m². Wall height 2850 mm and wall thickness 115 / 230 mm (internal / external). | Matches the market we are demoing to. Can be tuned in Phase 4 without changing contracts. |
| D7 | Push-to-open and sliding shutters are **real production features** (cut list, hardware schedule, gaps), not visual tricks. | Factory accuracy comes before visuals ([[factory-qa-ilyas]] rule). A template that shows a front the factory cannot cut is a liability. |
| D8 | Templates are **versioned** (`template:apartment:2bhk:v1`) and record `extensions.apartmentTemplateId` on the project. | Same pattern as `catalogTemplateId`. Lets analytics and later migrations recognise a template project. |
| D9 | Templates use **generic finishes through finish roles**, never brand SKUs. Each spec maps roles (`carcass`, `front-primary`, `front-accent`, `worktop`, `wall-panel`, `floor`) to generic `FinishId`s and surface finishes. A later **finish pack** remaps roles to a real brand's codes. | The manufacturer catalogue holds placeholder brands only (`mfr:studio-laminates`, `mfr:atelier-woods`). Real Indian brands (Merino, Greenlam, Century and others) differ per factory and change often. With roles, one template works for every customer, and a factory can apply its own pack in one step. |
| D10 | Factory hardware values (latch gap, hinge type, sliding track, overlap, track allowance) are **settings with industry defaults**, not blockers. Each default lives in one module, can be overridden per cabinet, and is marked **"unconfirmed default"** in the hardware schedule and production export until a factory confirms it. | These are standard hardware facts; only the brand and stock a factory buys is local knowledge. Building with flagged defaults keeps phases moving, and the flag stops an unconfirmed guess from silently reaching a real order. |

## 3. Contracts (lock before implementation)

### 3.1 `ApartmentTemplateSpec`: new `domain/apartmentTemplates/types.ts`

```ts
type ApartmentTemplateId =
  | "template:apartment:studio:v1" | "template:apartment:1bhk:v1"
  | "template:apartment:2bhk:v1"   | "template:apartment:3bhk:v1";

interface ApartmentTemplateSpec {
  id: ApartmentTemplateId;
  name: string;                     // "2 BHK · Modern family"
  description: string;
  styleId: LivingRoomStyleId;
  lightingRecipeId: LivingRoomLightingRecipeId;
  mood: LightingMood;
  shell: { widthMm: number; depthMm: number; heightMm: number;
           externalWallMm: number; internalWallMm: number };
  splits: ApartmentSplit[];         // applied in order (guillotine)
  rooms: ApartmentRoomSpec[];       // matched to split cells by `cell`
  openings: ApartmentOpeningSpec[]; // doors / windows / open arches
  heroRoomKey: string;              // active room on open
  finishRoles: Record<FinishRole, string>; // D9: role → generic finish / material id
}

type FinishRole = "carcass" | "front-primary" | "front-accent"
                | "worktop" | "wall-panel" | "floor";

interface ApartmentSplit { key: string; inCell: string; axis: "x" | "z";
                           atMm: number; cells: [string, string] }

interface ApartmentRoomSpec {
  key: string; cell: string; name: string; roomType: RoomType;
  floorMaterialId?: string; ceilingMaterialId?: string;
  compose: RoomComposition;         // composers ask for finish roles, not ids         // §3.2
  camera?: { eyeMm: Vec3; targetMm: Vec3 };
}

interface ApartmentOpeningSpec {
  kind: OpeningKind;                // door | window | opening
  between: [string, string] | { room: string; side: WallSide }; // shared or external
  offsetMm: number; widthMm: number; heightMm?: number; sillHeightMm?: number;
  catalogItemId?: string;           // e.g. opening:door-sliding
}
```

`offsetMm` is measured from the wall piece's fixed end (lower x for east–west
walls, lower z for north–south walls), whatever direction the stored wall runs.
Openings must also clear half the thickness of the walls that meet each end of
the piece (57.5 mm at a 115 mm partition, 115 mm at an external corner).

`buildApartmentTemplate(spec): InteriorProject` is pure, deterministic and
ends with `validateInteriorProject`.

### 3.2 Room composers: `domain/apartmentTemplates/composers/*`

A composer is a pure function `(project, roomId, options) → project`. Walls are
addressed by **side** (`north | south | east | west`) relative to the room, so
specs never refer to wall ids.

| Composer | Options (summary) | Reuses |
| --- | --- | --- |
| `composeKitchen` | layout `straight / L / parallel`, wall sides, front system, door style, finish, wall cabinets on/off, tall pantry, hosted sink/hob positions, under-cabinet + profile lights | `seedCabinet`, `mountWallCabinets`, `arrangeCabinetRun`, `placeApplianceInCabinet`, `attachLightToObject` |
| `composeBedroom` | bed size, wardrobe side + width + front system (`hinged / sliding / push`), headboard wall decor, side tables, pendants / downlights | `living:wardrobe-wall`, `living:corner-wardrobe`, `addWallDecoration` |
| `composeLiving` | TV wall side, TV unit, feature wall preset, display niche, sofa set, cove / track / panel lights | `living:tv-unit`, `living:display-niche`, `living:feature-wall-fluted` |
| `composeBathroom` | vanity, mirror + rope light, WC, shower | catalog bathroom items, `finalizeBathroomTemplate` logic |
| `composeFoyer` / `composeUtility` / `composeStudy` | shoe cabinet, utility tall unit, study desk + open shelf | base / tall / open-shelf families |

Composers place content only. They never create walls, which keeps them usable
later from "Add content to this room" in the editor.

### 3.3 Push-to-open front system

This extends `FrontSystem` from the modular gaps roadmap §4.3:

```ts
type FrontSystem =
  | { kind: "handled" }
  | { kind: "gola"; profiles: GolaProfiles }
  | { kind: "push"; mechanism: "push-latch" | "tip-on" };   // NEW
```

- Object parameter: `frontSystem: "push"`, `pushMechanism`.
- Hardware items `push-latch` and `tip-on-door`. Drawers swap to
  `drawer-slide-push` (Q2 default, shipped).
- Front-gap resolver: no handle; doors keep the **normal gaps**. The latch
  set-back is a depth offset and does not change cut sizes, so the 3 mm
  buffer sits behind `APPLY_PUSH_LATCH_BUFFER` (off) until a factory asks for
  it (Q3). 3D, production and the legacy cut list read the one resolver.
- Hinges: push door leaves schedule `hinge-spring-free` (no closing spring),
  the standard rule for mechanical push openers.
- 3D: no handle mesh. The inspector shows "Push to open".
- Hardware schedule: one latch per door leaf, and per drawer when push slides
  are not used.

### 3.4 Sliding shutters (built with settings, D10)

```ts
type DoorStyle = "none" | "single" | "double" | "bi-fold" | "sliding";   // NEW

// domain/frontSystem/slidingDefaults.ts — one module, like pushDefaults.ts
type SlidingTrackKind = "bottom-roll" | "top-hung";
const SLIDING_DEFAULTS = {
  trackKind: "bottom-roll",     // common in Indian modular wardrobes
  overlapMm: 40,                // ≈ vertical profile width; typical 30–50
  trackAllowanceMm: 90,         // double track; typical 75–100
  heightDeductionMm: 40,        // track + roller clearance off the opening height
  maxLeafWidthMm: 1000,         // picks the leaf count
  confirmed: false,             // D10: flagged until a factory confirms
};
// Per-cabinet overrides (object parameters): slidingLeafCount (2 | 3),
// slidingOverlapMm, slidingTrackKind, slidingTrackAllowanceMm.
```

- **Leaf count:** `clamp(ceil(W / maxLeafWidthMm), 2, 3)` unless overridden.
- **Leaf width:** `(W + overlapMm × (n − 1)) / n`. **Leaf height:** opening
  height − `heightDeductionMm`.
- **Depth:** the cabinet's overall depth stays the same, so the plan footprint
  does not move. The carcass (internal) depth is `depth − trackAllowanceMm`;
  the track sits in front of it.
- **One resolver:** `resolveFrontGaps` gains a sliding branch, so 3D, the
  elevations, production and the legacy cut list read the same leaves (same
  rule as gola and push).
- **3D:** leaves on alternating planes, `trackAllowanceMm / 2` apart; no
  hinges.
- **Elevations:** overlapping leaves drawn as such; no hinge marks.
- **Hardware schedule:** one track set per wardrobe (length = W) and one
  roller set per leaf; **zero hinges**; one pull per leaf. Every sliding line
  carries the "unconfirmed default" flag while `confirmed` is false.
- **Exclusive with gola and push:** choosing sliding normalises the front
  system to handled; the inspector disables gola / push for sliding wardrobes.
- **Scope:** wardrobes (`almirah`) only in v1. The inspector hides it for
  other types.

## 4. Showcase matrix (what each template shows)

**✓** = shown in that template. Every row must have at least one ✓ (D5).

| Capability | Studio | 1 BHK | 2 BHK | 3 BHK |
| --- | :-: | :-: | :-: | :-: |
| **Style** | nordic-light | warm-contemporary | moody-walnut | warm-contemporary (premium finishes) |
| **Mood / recipe** | day · daylight | day · daylight | evening · warm-evening | evening · warm-evening |
| Kitchen layout | straight (kitchenette) | L | parallel | L + island-free breakfast counter |
| Gola L + C | ✓ | | | ✓ |
| Gola wall profile | | | | ✓ |
| Bar handle | | ✓ | | ✓ (bedrooms) |
| Knob / cup handle | | ✓ knob | ✓ cup (kids room) | |
| **Push-to-open** (new) | | | ✓ kitchen + master wardrobe | ✓ |
| **Sliding wardrobe** (new) | ✓ | | | ✓ master |
| Hinged wardrobe | | ✓ | ✓ kids | ✓ guest |
| Corner wardrobe | | | | ✓ |
| Door style slab / shaker / glass | slab | shaker | slab + glass wall units | shaker + glass crockery |
| In-house vs bought doors | in-house | bought | in-house | mixed |
| Finishes | white-matte, oak | laminate, wood-oak | grey, walnut, acrylic gloss | white-gloss, walnut, suede, linen |
| Hosted sink + hob | ✓ | ✓ | ✓ | ✓ |
| Tall pantry | | ✓ | ✓ | ✓ |
| TV unit + display niche | TV unit | TV unit | TV + niche | TV + niche |
| Study / open shelf | | | ✓ | ✓ |
| Foyer shoe cabinet | | | | ✓ |
| Wall decor `slat` (fluted) | ✓ | | | ✓ |
| `full` / `vertical` / `horizontal` | | vertical | full | horizontal |
| `wainscot` / `moulding` | | wainscot | | moulding |
| `profile` / `custom` / `mirror` | mirror (bath) | | custom, mirror | profile, mirror |
| Light `cove` | ✓ | | ✓ | ✓ |
| `rope` (behind mirror / headboard) | ✓ | | ✓ | ✓ |
| `profile` | ✓ | | | ✓ |
| `under-cabinet` | ✓ | ✓ | ✓ | ✓ |
| `ceiling-downlight` / `cob` | downlight | downlight | cob | cob |
| `panel` | | ✓ | | |
| `track` | | ✓ | | ✓ |
| `pendant` | | ✓ (bedside) | ✓ (dining) | ✓ |

## 5. Layouts (starting dimensions, tuned in Phase 4)

**Studio, ≈ 6000 × 5400 (32 m²).** Split along z at 1800:
- Back strip:
  - **Bath** 2100 × 1800
  - **Entry + kitchenette** 3900 × 1800, joined to the main room by an open
    arch (`opening`)
- Front: **Living + sleep** 6000 × 3600 with the sliding wardrobe, a TV unit
  on the fluted wall, and a daybed.

**1 BHK, ≈ 7500 × 6700 (50 m²).** Split along x at 4200:
- Left column: **Kitchen** 4200 × 2700 (L-kitchen, north) over **Living**
  4200 × 4000, joined by an arch.
- Right column 3300 wide: **Utility** 1200 × 2700 beside the kitchen (door
  from the kitchen) and **Bath** 2100 × 2700 (door from the bedroom), over
  the **Bedroom** 3300 × 4000.

**2 BHK, ≈ 10200 × 7800 (80 m²).**
- Living + dining 5400 × 4300 (hero room); kitchen 3300 × 3500 (parallel)
- Short passage 2100 × 1900 off the living room, with the common bath
  2100 × 1600 and the kids bedroom (4800 × 2800) off it
- Master suite: master bedroom 4800 × 3200 (off the living room, never
  smaller than kids), master bath 2400 × 1800 and walk-in 2400 × 1800

**3 BHK, ≈ 12600 × 9200 (115 m²).** The 2 BHK set plus:
- Foyer 1500 × 3500 with the entry door, opening straight into the living
  room (5400 × 4500); kitchen 2700 × 3500 with the utility 1200 × 3500 off it
- Passage 7200 × 1300 off the living room: study (1800 × 3500, door from the
  foyer), guest 3600 × 3500 with its own bath 1800 × 1900, common bath
  1800 × 1600, kids 2700 × 4400 and master 3000 × 4400 all open off it
- Master bath 1500 × 2400 and walk-in 1500 × 2000
- Balcony 5400 × 1200 (off the living room)
- No pooja unit (Q5)

The balcony is a room typed `custom` with an external-style floor, joined to
the living room by a sliding door (`opening:door-sliding`). The utility room
is typed `utility` and holds the washing machine bay and a tall unit.

The exact split order for each template is written in the spec in Phase 4 and
Phase 5. Room sizes above are wall-centreline cells as authored in the
specs; the clear (carpet) size is smaller by half of each bounding wall.

## 6. Phases

### Phase 0 — Contract and shell builder (no UI)

**Status:** Done.

- `domain/apartmentTemplates/types.ts` (§3.1) and `buildApartmentShell(spec)`:
  outer rectangle → guillotine splits → rename and type rooms → openings on
  shared or external walls (wall found by the room pair or room side).
- Re-express `"2-room-flat"` as a spec and check it gives the same topology.
- Spike D2: split a 3 BHK-shaped rectangle with 8+ cuts, including T-junctions.
  If the graph breaks, switch to the `applyFloorplanToInterior` route.

**Exit gate:**
- All four template shells validate with zero repairs.
- Every room has a closed loop, and every interior door lands on the wall that
  both rooms share.
- Ids are deterministic: two builds give byte-identical JSON.

### Phase 1 — Room composers

**Status:** Done.

- `composeKitchen`, `composeBedroom`, `composeLiving`, `composeBathroom`,
  `composeFoyer`, `composeUtility`, `composeStudy` (§3.2), addressing walls by
  side.
- Generalise the kitchen helpers. They assume the catalog template's single
  shell (`alongWallMm`, wall-id lookups), so they need a `(roomId, side)`
  signature.
- Decide the catalog cap (§1): raise `assertV1CatalogScope`, or reuse items
  through parameters.

**Exit gate:**
- Each composer, run on a bare room of the matching type, gives a valid project.
- No object overlaps a door swing or a window (a check reused from placement
  rules).
- Lights attach to their hosts and survive a reflow.

### Phase 2 — Push-to-open front system (§3.3)

**Status:** Done, with D10 defaults: push-open runners for drawers, normal
gaps (buffer off), spring-free hinges. Push hardware lines now carry the
"unconfirmed default" flag (added with Phase 3).

- Add the `FrontSystem` push kind, hardware items, the resolver gap, 3D with
  no handle, the inspector option, the cut list and the hardware schedule.

**Exit gate:**
- One push-to-open kitchen run gives:
  - correct door sizes in 3D, production and the legacy cut list (one
    resolver)
  - one latch per leaf in the hardware schedule
  - no handle in 3D or in the elevations
- Switching handled → push → gola round-trips cleanly.

### Phase 3 — Sliding wardrobe shutters (§3.4)

**Status:** Done and merged (PR #53/#54) with the §3.4 defaults
(`confirmed: false`); Ilyas confirms the numbers later. Sliding almirahs allow
900–2400 mm width. Studio and the 3 BHK master use sliding shutters.

1. `slidingDefaults.ts` and the `"sliding"` door style; parameter read/write
   like `pushParametersPatch`.
2. Sliding branch in `resolveFrontGaps` (leaf count, widths, height, planes).
3. 3D leaves on two planes; carcass depth reduced by the track allowance.
4. Elevations: overlapping leaves, no hinge marks.
5. Hardware: track set + roller sets, zero hinges, pulls; the "unconfirmed
   default" flag in the hardware schedule and production export (and apply
   it to the push lines from Phase 2).
6. Inspector: **Door style → Sliding** for wardrobes; leaf count, overlap and
   track kind fields; gola / push disabled while sliding.
7. Composer: `BedroomComposeOptions.wardrobeDoors: "hinged" | "sliding"`;
   switch the Studio and the 3 BHK master to sliding, and make the coverage
   test's sliding row read the built project instead of the hinged stand-in.

**Exit gate:**
- Formula test: a 2400 wardrobe with 2 and with 3 leaves gives the correct
  leaf widths; leaf count picks 2 / 3 from width when not overridden.
- 3D, elevation, production and legacy cut list give the same leaf sizes
  (one resolver).
- Hardware schedule: track and rollers present, **no hinges**, and every
  sliding (and push) line flagged "unconfirmed default".
- Leaves do not intersect in 3D and stay inside the cabinet's overall depth
  on all four wall sides.
- Hinged → sliding → hinged round-trips cleanly; sliding never coexists with
  gola or push.
- Showcase coverage: the sliding row passes on the built Studio and 3 BHK.

### Phase 4 — Studio and 1 BHK authored

**Status:** Done.

- Write both specs with layout, composition, materials, lights, mood and one
  camera bookmark per room.
- Generate thumbnails (same pipeline as `scripts/catalog/generate-*-thumbnail.mjs`).
- Check lighting with the canvas pixel readout, not screenshots
  ([[judge-lighting-by-pixels]]).

**Exit gate:**
- Each opens from a dev entry point in under 2 s, in the hero room, with no
  validation repairs.
- Every room looks right from its bookmark.
- Production export of the whole project succeeds (cut list, hardware
  schedule).

### Phase 5 — 2 BHK and 3 BHK authored, plus coverage test

**Status:** Done (sliding row now checked against the built Studio and 3 BHK).

- Write both specs.
- Add `showcaseCoverage.test.ts`: it reads the four built projects and asserts
  every matrix row in §4 is present (front systems, door styles, fixture
  kinds, decor presets, hosted appliances).
- Check the light count per room, to stay inside the renderer's per-room light
  budget.

**Exit gate:**
- The coverage test passes.
- Every room renders within the frame budget on the reference laptop.
- Production export succeeds.

### Phase 6 — Entry points

**Status:** Done. Open follow-up: editor-wide unique room ids. (Real
apartment thumbnails: closed by the Phase 7 stills.)

- Project home: an **Apartment templates** section above the single-room
  cards (Calm-light card style, area in m² and room count on each card).
- Route this through `buildLivingRoomStarterDocument`, either as a new
  `apartmentTemplateId` argument or as a new `PlannerStarterTemplate` member.
- Marketing: add the four cards to `MARKETING_TEMPLATES`.
- Fix the **Register → create project** handoff so the chosen template opens
  after sign-up.
- Room switcher: show the room type icon and a **Showcase view** button that
  jumps to the room's bookmark.

**Exit gate:**
- Path to check: landing card → register → editor opens the same apartment in
  its hero room.
- Each template creates a new project. The template itself is never modified,
  and autosave writes a new draft.

### Phase 7 — Showcase tour

**Status:** Done and merged (PR #53/#54). Since 8.5 the tour opens on the
whole-apartment overview.

As built:
- `showcaseTour.ts` (stop order), `showcaseTourController.ts` (timers:
  1.5 s glide + 2.3 s hold per room), `showcaseTourInput.ts` (stop gestures)
  and `showcaseTourSession.ts` (one run) are pure and unit-tested;
  `useShowcaseTour` + `ShowcaseTourControls` wire them into Model View.
- Order: spec room order rotated to start at the hero room (3 BHK: living,
  kitchen, utility, study, balcony, passage, guest, kids, master, three baths,
  walk-in, foyer). Rooms the user added follow in project order; projects that
  are not apartments tour in project order from the active room.
- View-only: the toured room overrides the document's active room for
  rendering only, cameras move through `requestShowcaseCameraJump({ cameraId,
  glideMs })`, shown as authored (`project-camera` composition). Per-room
  scenes are memoized; the canvas never remounts. Ending (any reason) returns
  to the document's room, camera and the preset from before the tour.
- Stops on pointer press / wheel in the canvas (swallowed, so it does not also
  select or orbit), Escape, Stop button, a manual room switch, another view
  preset, or leaving 3D (unmount).
- Warm-up pre-roll (~1.7 s, behind a veil): each room is shown once and the
  tour waits for its GLBs (`glbLoadTracker`), so first-visit parsing and
  shader compiles never land mid-glide.
- Day/Evening in the tour pill is a local override; the toolbar's Evening
  button stays the saved one.
- Stills: `npm run stills:apartments` captures each template's first tour stop
  in Present, in Day mood, to `public/catalog/templates/apartment-<slug>-v1.webp`
  (800×600, ~2× the cards), used by the marketing and project-home cards. Each
  hero camera is a wide, high three-quarter corner view that doubles as the
  still. The script reads the pixels (mean luma, near-black/near-white share,
  channel means / cast) and fails when a still is out of range.
- Day mood under the warm-evening recipe lights the room with the daylight
  recipe (`lightingRecipeForMood`); before, Day still showed the evening rig,
  which gave the 2 BHK an orange cast.
- Measured (e2e `apartment-showcase-tour.spec.ts`, Apple M5 / Metal, full
  3 BHK): max frame 25 ms on a production build, 67 ms on the dev server;
  0 frames over 100 ms. Strict mode: `vite build && vite preview --port 4173`,
  then `TOUR_PERF_STRICT=1 TOUR_PERF_BASE=http://127.0.0.1:4173 npx playwright
  test tests/e2e/apartment-showcase-tour.spec.ts`. Undo/redo depths
  (`data-undo-depth` / `data-redo-depth` on `<html>`) and the save state are
  identical before and after.

- A **Tour** button that steps through the rooms' showcase cameras with smooth
  camera moves, in spec room order starting from the hero room.
- Rooms without a camera are skipped, never left on a stale camera.
- Driven by the ephemeral showcase signal (`showcaseJump.ts`), **never** by
  undoable render settings: a tour adds no undo steps.
- Any orbit, click in the canvas or Escape stops the tour.
- Optional day → evening mood toggle during the tour (view-only, not saved).
- Capture one still per template as the marketing card thumbnails (closes the
  Phase 6 thumbnail follow-up).

**Exit gate:**
- The tour runs through every room of the 3 BHK without a frame hitch longer
  than 100 ms.
- Undo history is unchanged after a full tour.
- Orbit or Escape stops it immediately.

### Phase 8 — Whole-apartment 3D view

**Status:** Built and merged: 8.0 in PR #55, 8.1–8.5 in PR #56. Gates
still to measure are listed in §10. Split into sub-phases
8.0–8.5; 8.0 fixes bugs the shipped templates already have and goes first,
in its own PR.

## 7. Open questions

1. ~~**Market and sizes.**~~ **Answered:** Indian carpet areas, as in D6.
2. **Push-to-open drawers.** **Default shipped (D10):** push-open runners.
   Ilyas confirms the brand.
3. **Push latch set-back and gap.** **Default shipped (D10):** normal gaps;
   set-back is depth only. Ilyas confirms whether his brand needs the 3 mm
   buffer (`APPLY_PUSH_LATCH_BUFFER`).
4. **Sliding wardrobes.** **Defaults in §3.4 (D10):** bottom-rolling double
   track, 40 mm overlap, 90 mm track allowance, 40 mm height deduction. Ilyas
   confirms the track his factory buys; then set `confirmed: true`.
7. **Hinge for push doors.** **Default shipped:** spring-free hinge. Ilyas
   names the brand.

None of these block a phase any more. Send them to Ilyas as one
"are these our numbers?" message.
5. ~~**Pooja / balcony / utility.**~~ **Answered:** balcony and utility room
   only, with no pooja unit (see §5).
6. ~~**Brand finishes.**~~ **Answered:** generic finishes through finish roles
   (D9). Finish packs for real brands are a later, separate piece of work.

## 8. Suggested order

Done and merged: Phases 0, 1, 4, 2, 5, 6, 3, 7, then 8.0–8.5.

Next: §10.

## 9. Phase 8 architecture — whole-apartment 3D

Written 2026-10-06 from a code audit. Goal: a view-only **Whole apartment**
mode that shows every room at once (ceilings off, high three-quarter
"dollhouse" view), as the opening shot of the tour and as the card image
that actually sells a 2 or 3 BHK. Editing stays per room (D4 holds for
editing).

### 9.1 Evidence

**One active room is assumed throughout the 3D pipeline.**
- `compileLivingRoomScene` (`livingRoom/sceneCompiler.ts:113-128`) keeps
  objects, lights and cameras of `activeRoomId` only.
- `compileLivingRoomArchitecture` (`sceneCompilerRoom.ts:114`) draws one
  room's floor, ceiling, walls and openings. Shared walls carry
  `roomId: null` and are returned for both rooms, so a naive union of
  per-room compiles draws every shared wall twice, with duplicate node ids.
- Cutaway sides (`modelReviewNodes.ts:10-21`), `roomSpan` fog / grid / orbit
  distance (`CompiledSceneRenderer.tsx:136`) and the grid and ContactShadows
  at the world origin (`CompiledSceneRenderer.tsx:160`,
  `ModelViewInteractionRig.tsx:92`) assume one room around the origin.
- Render Studio (`LivingRoomRenderStudio.tsx:90`), window key lights
  (`windowKeyLight.ts`, max 2) and the project shadow frustum
  (`RenderLightingRig.tsx:54-86`) are fitted to one room.

**"Rooms are centred on the origin" is assumed by the classic cabinet model.**
- `cabinetProjectFromInteriorProject` → `clampCabinetProject` /
  `normalizeMultiRoomProject` clamps placements to ±(w/2, d/2)
  (`cabinetDimensions/placement.ts:110`, `projectRooms/normalize.ts:10`).
- Run detection, run fillers and countertops use the same ±w/2 frame
  (`cabinetRuns/detect.ts:21`, `geometry.ts:46,99`, `fillers.ts:51`).
- 3D run countertops were fixed by shifting into the room frame
  (`cabinetSceneRunExtras.ts`). **Still unfixed, same bug class:**
  - `hostedAppliances/resolve.ts:6` (`worktopTopsByObjectId`, runs on every
    commit) — run grouping can be wrong in off-centre rooms;
  - run filler widths and countertop lengths in the **BOM / quote** for
    off-centre rooms;
  - technical drawings, run drafting, PDF technical pages and the schedule's
    x/z (`technicalViews/*`, `runDrafting/*`, `pdfExport/technicalPages.ts`,
    `projectReport/scheduleRows.ts`).
  - Cut-list part sizes are position-independent and are not affected.

**Recipe lights are wrong in apartments today.** `applyLivingRoomStyle`
tags all 15 recipe lights (5 enabled) with the hero room, at positions made
for a 6200 × 4600 room centred on the origin (`livingRoom/lighting.ts:152`).
In the 2 BHK the living room spans x −5100…300, z −400…3900, so lights such
as (0, 2250, −2100) sit outside it. Directional recipe lights have no target
and aim at the world origin (`SceneProjectLights.tsx:88`).

**Renderer budget.**
- `MODEL_VIEW_FIXTURE_SOURCE_BUDGET = 12` sources per room
  (`fixtureLightBudget.ts:13`) is enforced by tests only; there is no runtime
  guard and no light culling. A changed light count recompiles every
  material.
- A composed 3 BHK has about 25–30 fixtures, **35–45 shader sources** (3–4×
  the budget), 14 cameras and 100–150 objects.
- GLB children are never frustum-culled (`AssetBackedGlbContent.tsx:96`);
  each object clones its GLB scene; there is no instancing (procedural
  geometry is shared by `geometryKey`).
- Shadows: at most 2 directional casters on Standard, 1 on Draft; point,
  spot and fixtures never cast.

**What already exists.** The "dollhouse" view preset and panel
(`modelViewPresets.ts:40`) are single-room. `roomSceneCache.ts` compiles one
scene per room. The 2D plan already draws every wall and object in world
coordinates (`PlanArchitectureLayer.tsx`, `PlanObjectsLayer.tsx`).

### 9.2 Decisions

| # | Decision | Why |
| --- | --- | --- |
| P8-D1 | **Fix the frame at the source (8.0).** One helper, `roomFrame(project, roomId)` → `{ centre, widthMm, depthMm }`; `cabinetProjectFromInteriorProject` moves each room's cabinets into that room's centred frame, and every consumer that maps back to world adds the centre. Countertop-style patches per caller are removed. | One fix covers 3D, BOM, drawings and hosted appliances. Single-room projects are centred already, so their output is unchanged. |
| P8-D2 | **Recipe lights are room-relative.** Seed positions are offsets from the room centre (and scaled to the room size where they are spread), and directional lights target the room centre. | Fixes today's misplaced lights in every off-centre hero room, and is required before several rooms can be shown at once. |
| P8-D3 | **Whole apartment is a view mode, not a document change.** Like the tour: the document's active room, undo history and autosave are untouched; selection and gizmos are off; clicking a room enters it (the normal room switch). | Keeps editing per room (D4) and reuses the tour's view-only plumbing. |
| P8-D4 | **One apartment scene compiler**, `compileApartmentScene(project)`: per-room floors, each wall once (shared walls de-duplicated by wall id), openings once, all objects, **no ceilings**, union bounds, one overview camera set. Pure and deterministic. | A union of per-room scenes would duplicate shared walls and ids. |
| P8-D5 | **Overview lighting has a fixed light count.** Environment (HDRI) + one sun with a shadow fitted to the union bounds + hemisphere fill. Room fixtures are drawn as **emissive meshes only** (they look lit; they are not light sources). | 35–45 real sources would blow the budget and recompile shaders. A constant count keeps the overview fast and stable. Per-room fixture light stays in the room view. |
| P8-D6 | **Performance before polish.** Re-enable frustum culling for GLB children (with correct bounds), and instance repeated GLBs (same catalog item + material slots). Measure before and after. | 100–150 unculled, cloned GLBs is the likely bottleneck at apartment scale. |
| P8-D7 | **Walls stay full height; ceilings off.** A wall cut-height slider is an optional later step. | Full-height walls read as rooms from a high three-quarter view; cutting walls needs new geometry. |

### 9.3 Sub-phases

#### 8.0 — Room frame and recipe lights (own PR, first)

**Status:** Done (PR #55). Cabinets carry `readPlacement`, so switching to
Interiors never moves an unedited cabinet.

- `roomFrame` helper; classic adapter moves each room into its centred
  frame; remove the shift in `cabinetSceneRunExtras.ts`; map back to world
  where positions leave the classic model (countertops, fillers, drawings,
  schedule).
- `worktopTopsByObjectId` and the BOM (filler widths, countertop lengths)
  go through the same frame.
- Recipe lights room-relative; directional targets at the room centre.
- Grid and ContactShadows centred on the scene bounds, not the origin.

**Exit gate:**
- For every room of all four templates: countertops, fillers, hosted
  worktop heights, drawings and schedule x/z sit on their cabinets in world
  coordinates (one test per output).
- Every enabled recipe light lies inside its room.
- Single-room projects (starter, six catalog templates, golden run) give
  byte-identical scenes, cut lists and drawings to before.

#### 8.1 — Apartment scene compiler (no UI)

**Status:** Done. Shared walls and their openings are labelled `"interior"`,
outside walls face the whole-plan centre, so the 8.3 cutaway is safe.

- `compileApartmentScene(project)` per P8-D4, reusing `roomSceneCache`.

**Exit gate:**
- No duplicate node ids; each shared wall appears once; node count =
  sum of room scenes − duplicated shared walls − ceilings.
- Deterministic (two compiles are byte-identical JSON).
- The union bounds contain every room.

#### 8.2 — Overview lighting

**Status:** Done. One sun on the union bounds (shadow fitted to the whole
plan), HDRI and hemisphere fill unchanged, no window keys, no preset lights.
Fixtures come from the resolved room scenes and render glow-only
(`emissiveOnly`, `FixtureEmitter`), so they add no shader lights.

- Overview rig per P8-D5; fixtures render emissive only in this mode.

**Exit gate:**
- The overview's shader light count is the same for every project (one
  cache key across all four templates; fixtures count zero).
- Hosted fixtures sit where their host is now, not at their stored pose.
- Note: entering or leaving the overview *does* change the light count
  (the room view has that room's real fixture lights), so three.js
  recompiles materials once. That recompile is hidden behind a warm-up in
  8.3 and timed in 8.4. The overview stills exposure check moves to 8.3,
  where there is a view to capture.

#### 8.3 — Whole apartment view mode

**Status:** Done (PR #56). View-only (no undo step, no autosave), warm-up
veil, hover highlight and click-to-enter (clicking the current room writes
nothing), four corners plus top. Overview stills pass exposure (luma 182 /
181 / 123 / 156) with one stage colour (#9aa7b3) and one exposure (1.55);
the sun stays 0.58. A two-room starter plan (not a template) compiles,
picks rooms and tours correctly at the code level. Still to do by hand:
open a two-room imported plan in the app (§10).

- **Whole apartment** toggle in 3D for projects with two or more rooms.
- Camera presets: four high corners and top-down, framed on the union bounds.
- Hovering a room highlights it and shows its name; clicking enters it;
  Escape returns to the room view.
- View-only per P8-D3.
- Entering and leaving run a short warm-up behind a veil (like the tour), so
  the one material recompile from the light-count change never shows as a
  stall mid-orbit.

**Exit gate:**
- Undo depth unchanged after entering, orbiting and leaving (e2e, like the
  tour).
- Clicking a room makes it the active room and frames it.
- Works on all four templates and on a two-room imported plan.
- No frame stall over 100 ms after the warm-up, entering or leaving.
- Overview stills of all four templates pass the exposure check
  (`scripts/showcase-tour/still-exposure.mjs`); tune the sun's intensity
  (0.58 today) against it.

#### 8.4 — Performance

**Status:** Built (PR #56). GLB children are frustum-culled from recomputed
bounds (skinned meshes stay unculled); repeated GLBs are instanced **in the
overview only**, so the room view keeps per-model shadows and hover; batches
are keyed by ids so they no longer rebuild on every render. The overview
opens in **Draft** (answers §9.5 Q3) and restores the room view's quality on
leaving.
**Gate passed (2026-10-06).** Apple M5 (Metal), production build via
`vite preview`, 3 BHK, overview in Draft, strict run: overview orbit
**p95 18 ms**, longest frame 26 ms, cold entry 697 ms, warm entry 261 ms,
room-view orbit p95 9 ms. (Before Draft and the rebuild fix, on Standard:
p95 50 ms, longest 67 ms.)

- Frustum culling for GLB children; instancing of repeated GLBs.

**Exit gate (reference machine, overview default quality = Draft, production build):**
- 3 BHK overview: p95 frame time ≤ 33 ms while orbiting; first frame
  ≤ 4 s warm.
- Room view frame times no worse than before.

#### 8.5 — Tour and marketing

**Status:** Done (PR #56). The tour's first stop is "Whole apartment", then
the rooms in spec order from the hero room. Cards keep the daylight hero-room
still (`apartment-<slug>-v1.webp`) and add the overview as a second image
(`apartment-<slug>-plan-v1.webp`) that cross-fades in on hover / focus
(answers §9.5 Q2). Recipe point / spot / area lights in off-centre rooms now
dim with floor area, so small rooms are not overlit. All eight stills pass
exposure and are 26–78 KB. **Gate passed (2026-10-06):** strict 3 BHK tour on
a production build (Apple M5), overview stop included, no frame over 100 ms.

- The tour opens on the overview, then glides into the hero room.
- Card stills switch to the overview shot (or one overview + one room shot).

**Exit gate:**
- Full 3 BHK tour, including the overview, with no frame stall > 100 ms.
- Regenerated stills pass the exposure check; each is ≤ 120 KB.

### 9.4 Out of scope

- Editing in the overview (moving objects, drawing walls).
- Render Studio of the whole apartment (stays per room).
- Wall cut-height slider, room labels in 3D, multi-storey.
- Per-room fixture light in the overview (a fixed pool of light slots is a
  possible later step).

### 9.5 Questions (answered)

1. ~~Click to enter or highlight first?~~ Hover highlights and names the
   room; a click (not a drag) enters it.
2. ~~Card image?~~ Hero room as the card; the overview as a second image on
   hover / focus.
3. ~~Standard or Draft?~~ The overview defaults to Draft; Standard stays a
   choice inside the overview.

## 10. Completion

**Built, reviewed and merged (2026-10-06):** every phase. Four templates
(Studio, 1 BHK, 2 BHK, 3 BHK), push-to-open and sliding wardrobes, the
showcase coverage matrix (§4), entry points, the showcase tour, the room
frame fix, and the whole-apartment view with its tour stop and card images.

**Performance gates (passed 2026-10-06, Apple M5, production build):**

| Gate | Result |
| --- | --- |
| 8.4: overview orbit p95 ≤ 33 ms (Draft) | ✓ p95 18 ms, longest 26 ms; cold entry 697 ms, warm 261 ms; room view p95 9 ms |
| 8.5: full 3 BHK tour, overview included, no frame > 100 ms | ✓ strict run passed |
| 8.3: no stall entering / leaving the overview | ✓ (same overview run) |

**Still open:**

| Item | How | Gate |
| --- | --- | --- |
| Two-room imported plan | Import (or draw) a two-room plan, open 3D, enter **Whole apartment**, click each room. Already verified at code level on the "2-room-flat" starter (overview compiles, shared wall is interior, room pick and tour work). | 8.3 |

To re-run the performance gates: `npm run build`, then
`npx vite preview --host 127.0.0.1 --port 4173` in a second terminal, then
`TOUR_PERF_STRICT=1 TOUR_PERF_BASE=http://127.0.0.1:4173 npx playwright test tests/e2e/apartment-showcase-tour.spec.ts --project=chromium`
and
`OVERVIEW_PERF_STRICT=1 TOUR_PERF_BASE=http://127.0.0.1:4173 npx playwright test tests/e2e/apartment-overview.spec.ts --project=chromium`.

Performance runs only count against a production build: `npm run build`,
then `npx vite preview --host 127.0.0.1 --port 4173` in a second terminal.
Without `TOUR_PERF_BASE` Playwright uses the dev server, whose frames are not
representative (a dev-server tour run showed a 183 ms frame).

**Waiting on the factory (D10, §7):** sliding track kind and lengths
(per-metre vs fixed bars), overlap and track allowance, the 900–2400 mm
sliding width range, the 3 × 700 split for a 2100 mm hinged wardrobe,
whether quoted widths include end panels, the hinge brand for push doors and
the push latch buffer. Until Ilyas confirms, those lines stay marked
"unconfirmed default" in the schedule and exports.

**Follow-ups, outside this roadmap:** Render Studio ignores the day / evening
mood; editor-wide unique room ids; out-of-scope items in §9.4 (editing in
the overview, whole-apartment Render Studio, wall cut height, multi-storey).
