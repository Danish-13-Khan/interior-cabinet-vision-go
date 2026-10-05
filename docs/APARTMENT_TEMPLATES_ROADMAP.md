# Apartment templates roadmap (Studio, 1 BHK, 2 BHK, 3 BHK)

**Status:** Proposed, 2026-10-05. §7 Q1, Q5 and Q6 answered the same day. No code yet; pick a phase to start.
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
  `drawer-slide-push` (open question Q2).
- Front-gap resolver: there is no handle, and the door gains a set-back for
  the latch buffer (value from Ilyas, Q3). 3D, production and the legacy cut
  list all read it through the one resolver.
- 3D: no handle mesh. The inspector shows "Push to open".
- Hardware schedule: one latch per door leaf, and per drawer when push slides
  are not used.

### 3.4 Sliding shutters

```ts
type DoorStyle = "none" | "single" | "double" | "bi-fold" | "sliding";   // NEW
// parameters: slidingLeafCount (2 | 3), slidingOverlapMm (default 40),
//             slidingTrackId ("track-top-hung" | "track-bottom-roll")
```

- Leaf width = `(W + overlapMm × (n − 1)) / n`.
- Carcass depth gains the track allowance (Q4). Leaves sit on alternating
  planes in 3D.
- Cut list: n shutters. Hardware schedule: one track set plus rollers per leaf.
- This applies to wardrobes (`almirah`) only in v1. The inspector hides it for
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

- Add the `FrontSystem` push kind, hardware items, the resolver gap, 3D with
  no handle, the inspector option, the cut list and the hardware schedule.
- Needs Ilyas's answers to Q2–Q3 first.

**Exit gate:**
- One push-to-open kitchen run gives:
  - correct door sizes in 3D, production and the legacy cut list (one
    resolver)
  - one latch per leaf in the hardware schedule
  - no handle in 3D or in the elevations
- Switching handled → push → gola round-trips cleanly.

### Phase 3 — Sliding wardrobe shutters (§3.4)

- `DoorStyle "sliding"`, leaf maths, track allowance, 3D leaves on two planes,
  cut list, hardware schedule. Wardrobes only.
- Can ship after Phase 4. Until it lands, the Studio and 3 BHK use a hinged
  wardrobe, and the matrix row stays open.

**Exit gate:**
- A 2400 wardrobe with 2 and with 3 leaves gives the correct leaf widths
  (formula test).
- The track appears in the hardware schedule.
- Leaves do not intersect in 3D.

### Phase 4 — Studio and 1 BHK authored

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

### Phase 7 — Showcase tour (optional)

- A **Tour** button that steps through the rooms' bookmarks with smooth camera
  moves.
- Optional day → evening mood toggle during the tour.
- Useful for sales demos and the marketing hero video.

**Exit gate:**
- The tour runs through every room of the 3 BHK without a frame hitch longer
  than 100 ms.

### Phase 8 — Whole-apartment 3D view (deferred, D4)

- Compile every room at once: a dollhouse view with the ceilings cut away.
- Needs a light budget strategy (bake or cull inactive-room lights) and
  instancing. Assess after Phase 6.

## 7. Open questions

1. ~~**Market and sizes.**~~ **Answered:** Indian carpet areas, as in D6.
2. **Push-to-open drawers** (for Ilyas): push-open runners (Blum
   Tip-On / Hettich Push to Open Silent), or handleless drawers with a gola?
3. **Push latch set-back and gap** (for Ilyas): door gap and latch depth for
   the brand the factory buys.
4. **Sliding wardrobes** (for Ilyas):
   - top-hung or bottom-rolling track?
   - extra carcass depth for the track
   - overlap per leaf
5. ~~**Pooja / balcony / utility.**~~ **Answered:** balcony and utility room
   only, with no pooja unit (see §5).
6. ~~**Brand finishes.**~~ **Answered:** generic finishes through finish roles
   (D9). Finish packs for real brands are a later, separate piece of work.

## 8. Suggested order

1. Phase 0 and Phase 1 (foundation; no product-visible change).
2. Phase 4 (Studio and 1 BHK). This shows value early using only existing
   features: gola, handles, door styles, lighting, decor.
3. Phase 2 (push-to-open), once Ilyas answers Q2–Q3.
4. Phase 5 (2 BHK and 3 BHK).
5. Phase 6 (entry points).
6. Phase 3 (sliding) whenever Q4 is answered.
7. Phase 7 and Phase 8 later.
