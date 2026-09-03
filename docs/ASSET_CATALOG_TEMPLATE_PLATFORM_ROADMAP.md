# Asset Catalog and Template Platform Roadmap

**Status:** `NEXT` execution guide  
**Date:** 2026-09-03  
**Scope:** Built-in object inventory, semantic materials, starter templates, and a future CDN-backed catalog  
**Product owner:** Cabinet proposal workspace / Interiors  

This document turns the current Kenney furniture pack and existing material system into a scalable product platform. It is intentionally narrower than the full Product Book.

The governing documents remain:

- [Cabinet Studio Product and Development Book](./CABINET_STUDIO_PRODUCT_BOOK.md)
- [Backend, SaaS and Commercial Platform Book](./BACKEND_SAAS_COMMERCIAL_PLATFORM_BOOK.md)
- [Living-room curated asset conventions](./ASSET_CONVENTIONS.md)

If this roadmap conflicts with those documents, the Product Book and Backend Book win.

---

## 1. The simple product decision

The product needs two reusable libraries:

1. **Object inventory** — sofas, beds, tables, appliances, bathroom fixtures, lights, and decor.
2. **Finish inventory** — fabric, wood, metal, glass, ceramic, paint, stone, laminate, tile, and rug finishes.

Starter templates reference these libraries by stable IDs. Templates do not copy models or materials.

```text
Object inventory + Finish inventory
                 ↓
          Starter templates
                 ↓
        Editable project document
                 ↓
      2D plan + 3D + proposal
```

The same architecture must work in two delivery modes:

- **Now:** assets are bundled under `public/models` and resolved locally.
- **Later:** metadata comes from an API and model/thumbnail files come from a CDN.

Project files must not care which delivery mode is active.

---

## 2. Current repository baseline

### 2.1 Kenney pack

The repository currently contains:

- 140 valid GLB files.
- 413 renderable primitives.
- UVs and normals on every primitive.
- 112 multi-material GLBs.
- 560 isometric preview PNGs.
- 140 side preview PNGs.
- The Kenney CC0 license, source README, and model list.
- Approximately 5.6 MB for the complete copied package.

Current location:

```text
public/models/kenney-furniture/
  License_Kenney.txt
  MODEL_LIST.txt
  README_CC0_SOURCE.md
  preview.png
  models_glb/
  renders_isometric/
  renders_side/
```

The directory is present but is not yet registered in the application catalog.

### 2.2 Existing application foundations

The application already has:

- A versioned `InteriorProject` document.
- Stable catalog item IDs.
- A local model asset manifest.
- A GLB loader with centering, floor alignment, and target-dimension scaling.
- Procedural fallback geometry.
- Project material entities.
- Material slots on objects and openings.
- PBR material creation.
- Texture registries and procedural fallbacks.
- Local GLB import with optional sidecar textures.
- Curated catalog and template foundations.

### 2.3 Known integration gap

The current curated GLBs encode semantic meaning in mesh names such as `upholstery` and `frame`. The Kenney files primarily encode meaning in original material names such as:

```text
wood
woodDark
carpet
carpetWhite
metal
metalLight
metalDark
glass
_defaultMat
```

The renderer currently resolves material slots from a rendered child mesh name. The Kenney adapter must first inspect the original GLB material name and then fall back to mesh-name matching.

---

## 3. Scope boundaries

### 3.1 Use Kenney models for

- Sofas, chairs, stools, and benches.
- Tables, desks, and side tables.
- Beds and decorative bedroom furniture.
- Bookcases and presentation-only storage.
- Refrigerators, stoves, sinks, hoods, and small appliances.
- Toilets, showers, baths, mirrors, and basins.
- Televisions, computers, speakers, and accessories.
- Lamps, plants, rugs, books, and decor.
- Washers, dryers, and utility objects.

### 3.2 Do not use Kenney models as truth for

- Room walls or floors.
- Doors and windows that cut openings in walls.
- Production cabinet geometry.
- Cabinet dimensions, construction, costing, cutlists, or machine intent.

Kenney wall, floor, doorway, and wall-window models remain hidden. Kenney kitchen cabinets may be used only as clearly labeled presentation props; they cannot become production cabinets.

### 3.3 Initial exclusions

- Public asset marketplace.
- Mandatory cloud connection.
- Runtime FBX/OBJ conversion.
- User-generated asset sharing.
- AI-generated furniture.
- Hundreds of exposed material choices.
- Loading all 140 GLBs when the application starts.

---

## 4. Inventory classification

The full pack is classified as follows:

| Product group | Count | Initial policy |
| --- | ---: | --- |
| Bathroom | 10 | Curate fixtures and mirrors |
| Beds and bedroom | 10 | Curate beds and bedside pieces |
| Seating | 20 | Curate sofas, chairs, stools, benches |
| Tables and desks | 14 | Curate by room type |
| Storage | 11 | Use as presentation furniture |
| Kitchen and appliances | 23 | Use appliances; hide cabinet-like models |
| Electronics | 10 | Curate TV and office equipment |
| Lighting | 7 | Curate floor, table, wall, and ceiling lights |
| Decor | 12 | Curate rugs, plants, books, and small decor |
| Utility | 4 | Curate washer, dryer, and bin objects |
| Architecture | 19 | Exclude in favor of parametric architecture |

Every inventory record has a lifecycle state:

| State | Meaning |
| --- | --- |
| `template` | Approved and used in at least one starter template |
| `catalog` | Approved for the object browser |
| `hidden` | Valid asset but not exposed yet |
| `deprecated` | Resolves old projects but cannot be newly placed |
| `blocked` | Fails validation or violates a product boundary |

The first release should expose approximately 30–35 items. The other valid assets remain `hidden` until they receive category, dimension, placement, material, and visual QA.

---

## 5. Target architecture

### 5.1 Core rule

Canonical projects store stable references, not delivery paths:

```text
GOOD
catalogItemId: "kenney:lounge-sofa"
assetVersion: 1

BAD
modelUrl: "https://cdn.example.com/files/loungeSofa-v7.glb?token=..."
```

The runtime resolves the stable ID to a local path or CDN URL.

### 5.2 Layers

```text
┌──────────────────────────────────────────────────────────┐
│ UI                                                       │
│ Template Gallery · Object Browser · Material Browser     │
└───────────────────────────┬──────────────────────────────┘
                            │ stable IDs
┌───────────────────────────▼──────────────────────────────┐
│ Catalog Domain                                            │
│ schemas · categories · search · compatibility · aliases  │
└───────────────────────────┬──────────────────────────────┘
                            │ provider contract
┌───────────────────────────▼──────────────────────────────┐
│ Catalog Provider                                          │
│ BuiltInCatalogProvider now · RemoteCatalogProvider later  │
└───────────────────────────┬──────────────────────────────┘
                            │ resolved delivery URL
┌───────────────────────────▼──────────────────────────────┐
│ Asset Runtime                                             │
│ GLB load · cache · normalize · material adapter · dispose │
└──────────────────────────────────────────────────────────┘
```

### 5.3 Proposed source layout

The migration should be incremental. Existing exports may temporarily wrap the new domain so current code does not require a big-bang rewrite.

```text
src/domain/catalog/
  types.ts
  schema.ts
  catalogService.ts
  compatibility.ts
  aliases.ts
  providers/
    builtInCatalogProvider.ts
    remoteCatalogProvider.ts       # implemented later
  kenney/
    generatedManifest.ts
    overrides.ts
    materialMappings.ts
  templates/
    templateManifest.ts
    builders.ts

scripts/catalog/
  inspect-glb.mjs
  generate-kenney-manifest.mjs
  verify-catalog.mjs
```

Generated metadata and human decisions remain separate:

- `generatedManifest.ts` contains discovered files, bounds, primitives, original material names, and preview paths.
- `overrides.ts` contains display names, categories, real-world dimensions, placement, semantic slots, tags, and visibility.

Regenerating discovered metadata must never overwrite human curation.

---

## 6. Data contracts

The examples below define direction, not final syntax. Final types should reuse existing repository types where possible.

### 6.1 Catalog item

```ts
type CatalogItem = {
  id: string;                       // kenney:lounge-sofa
  version: number;                  // immutable visual version
  name: string;
  category: string;                 // seating
  subcategory: string;              // sofas
  tags: string[];
  placement: "floor" | "wall" | "ceiling" | "surface";
  dimensionsMm: {
    width: number;
    height: number;
    depth: number;
  };
  modelAssetId: string;
  thumbnailAssetId: string;
  materialSlots: Record<string, MaterialSlotPolicy>;
  lifecycle: "template" | "catalog" | "hidden" | "deprecated" | "blocked";
  source: {
    pack: "kenney-furniture";
    licenseId: "cc0-1.0";
  };
};
```

### 6.2 Model asset

```ts
type ModelAsset = {
  id: string;                       // model:kenney:lounge-sofa:v1
  version: number;
  objectKey: string;                // not a full URL
  contentHash: string;
  byteSize: number;
  nativeBoundsM: {
    width: number;
    height: number;
    depth: number;
  };
  primitiveCount: number;
  triangleCount: number;
  originalMaterialNames: string[];
  warnings: string[];
};
```

### 6.3 Semantic material slot

```ts
type MaterialSlotPolicy = {
  sourceMaterialNames: string[];
  allowedMaterialKinds: MaterialKind[];
  defaultMaterialId?: string;
  editable: boolean;
};
```

### 6.4 Material definition

```ts
type CatalogMaterial = {
  id: string;                       // material:fabric:oatmeal:v1
  version: number;
  name: string;
  kind: MaterialKind;
  swatchColor: string;
  pbr: {
    baseColor: string;
    roughness: number;
    metalness: number;
    opacity: number;
    uvScaleMm: number;
  };
  textureAssetIds?: {
    color?: string;
    normal?: string;
    roughness?: string;
    ao?: string;
  };
  lifecycle: "catalog" | "hidden" | "deprecated";
};
```

### 6.5 Template definition

```ts
type ProjectTemplate = {
  id: string;                       // template:kitchen:straight:v1
  version: number;
  name: string;
  category: "kitchen" | "living-room" | "bedroom" | "bathroom" | "empty";
  description: string;
  thumbnailAssetId: string;
  room: {
    widthMm: number;
    depthMm: number;
    heightMm: number;
  };
  objects: Array<{
    catalogItemId: string;
    catalogItemVersion?: number;
    positionMm: { x: number; y: number; z: number };
    rotationY: number;
    materialOverrides?: Record<string, string>;
  }>;
};
```

When a user chooses a template, the application creates fresh project entity IDs. The project keeps catalog identity and asset version information for reproducibility.

---

## 7. Material architecture

### 7.1 Three different concepts

Do not mix these concepts:

1. **Raw GLB material name** — technical source label such as `carpet` or `wood`.
2. **Semantic slot** — product meaning such as `upholstery`, `frame`, `top`, or `hardware`.
3. **Chosen finish** — user-facing material such as Oatmeal Weave or Natural Oak.

```text
Kenney `carpet`
        ↓ per-asset mapping
Semantic `upholstery`
        ↓ compatibility filter
Oatmeal / Olive / Grey fabric
```

### 7.2 Why mapping is per asset

Raw names are not universally meaningful:

- `carpetWhite` on a bed may represent bedding.
- `carpetWhite` on a toilet represents ceramic.
- `wood` on a sofa may represent legs.
- `wood` on a bookcase represents the carcass.
- `glass` on a table represents the top.
- `glass` on a television represents the screen.

Therefore, a global replacement such as `carpetWhite → fabric` would be incorrect. Each curated asset receives a small reviewed mapping.

### 7.3 Default behavior

- Keep the original Kenney material appearance when no override exists.
- Expose only useful semantic slots in the inspector.
- Let the user reset a changed slot to the original appearance.
- Lock intrinsic details that should not be edited.
- Apply a safe fallback if an assigned catalog material is unavailable.

The models should not be converted into all-white geometry.

### 7.4 Compatibility matrix

| Semantic slot | Allowed material kinds |
| --- | --- |
| `upholstery` | fabric, leather |
| `bedding` | fabric |
| `frame` | wood, metal, paint |
| `legs` | wood, metal |
| `top` | wood, stone, laminate, glass |
| `carcass` | wood, laminate, paint |
| `fronts` | wood, laminate, paint |
| `hardware` | metal |
| `applianceBody` | metal, enamel |
| `screen` | dark glass |
| `mirror` | mirror glass |
| `showerGlass` | clear glass, frosted glass |
| `ceramic` | ceramic |
| `rugSurface` | rug, fabric |
| `foliage` | foliage material |
| `planter` | ceramic, stone, metal |

The UI must filter materials by these allowed kinds. A user should not be offered fabric for a refrigerator or stone for a sofa cushion.

### 7.5 Initial finish library

The current small library remains a good seed. It should become data-driven rather than expanding through scattered constants.

Initial release target:

- 4 paints.
- 4 woods/laminates.
- 4 fabrics.
- 3 metals.
- 2 stones.
- 2 glasses.
- 2 ceramics.
- 3 floor/tile/rug finishes.

This is enough for attractive templates without overwhelming users. New finishes become catalog records; no renderer code should be required.

---

## 8. Catalog provider boundary and future CDN

### 8.1 Provider interface

The UI and project domain use a provider-neutral service:

```ts
interface CatalogProvider {
  getManifest(): Promise<CatalogManifest>;
  getItem(id: string, version?: number): Promise<CatalogItem | null>;
  resolveModel(assetId: string, version?: number): Promise<ResolvedAsset>;
  resolveThumbnail(assetId: string, version?: number): Promise<ResolvedAsset>;
}
```

### 8.2 Built-in provider now

`BuiltInCatalogProvider` resolves object keys against the application public root:

```text
model:kenney:lounge-sofa:v1
  → /models/kenney-furniture/models_glb/loungeSofa.glb
```

This provider works offline and requires no account or network.

### 8.3 Remote provider later

`RemoteCatalogProvider` receives metadata from an API and resolves delivery URLs at runtime:

```text
stable asset/version ID
        ↓
catalog API authorization
        ↓
short-lived CDN URL or public CDN object URL
        ↓
runtime cache
```

The project continues to store only the stable asset/version ID. Expiring CDN URLs, tokens, local filesystem paths, and provider credentials never enter project JSON.

### 8.4 Example remote manifest response

```json
{
  "schemaVersion": 1,
  "catalogVersion": "2026.09.1",
  "generatedAt": "2026-09-03T00:00:00Z",
  "items": [
    {
      "id": "kenney:lounge-sofa",
      "version": 1,
      "modelAssetId": "model:kenney:lounge-sofa:v1",
      "thumbnailAssetId": "thumb:kenney:lounge-sofa:ne:v1"
    }
  ]
}
```

The API may return resolved URLs separately. The manifest itself should prefer immutable object keys and hashes.

### 8.5 CDN and cache rules

- Versioned model files are immutable.
- Replacing geometry creates a new asset version.
- Every delivered file has a content hash and byte size.
- Public built-ins may use long-lived cache headers.
- Private organization assets use authorized, short-lived URLs.
- Metadata uses ETag/version revalidation.
- Thumbnails load before GLBs.
- GLBs load only when placed, previewed, or required by an opened template.
- Network failure falls back to a cached asset or procedural placeholder.
- Cached failures are retryable and visible; they do not damage project state.

### 8.6 Offline behavior

- Built-in starter templates must remain usable offline.
- A remote-only asset displays a clear unavailable state when uncached.
- Saving a project never waits for a CDN request.
- A project can open even when a visual asset is missing.
- Missing visuals must not create production data or alter dimensions.

---

## 9. Performance and growth design

### 9.1 Do not load the whole catalog

At startup, load only lightweight catalog metadata. Load assets progressively:

1. Category names and item metadata.
2. Visible thumbnails.
3. Selected item preview.
4. GLBs used in the current project or chosen template.

### 9.2 Runtime controls

- Limit concurrent model downloads.
- Deduplicate requests for the same asset/version.
- Cache parsed GLTF scenes and clone for instances.
- Dispose replaced geometries, materials, and textures safely.
- Preload only assets used by the selected template.
- Use thumbnail virtualization when the catalog becomes large.
- Paginate or incrementally load remote search results.
- Keep search over normalized names, categories, and tags.

### 9.3 Delivery optimization

The Kenney pack is already small. Optimization should be evidence-led:

- Preserve semantic material separation.
- Record triangle count and bounds.
- Add Meshopt/Draco only after compatibility and latency measurement.
- Add KTX2 for large texture libraries when real textures arrive.
- Prefer 256 px WebP thumbnails for the catalog grid.
- Keep larger preview renders optional.
- Never silently change physical dimensions during optimization.

### 9.4 Growth path

| Scale | Delivery approach |
| --- | --- |
| 30–140 built-ins | Bundled manifest and local public files |
| Hundreds of public items | CDN files with cached versioned manifest |
| Organization assets | API metadata, private object storage, signed URLs |
| Large shared catalog | Server-side search/filtering and paginated metadata |

The provider boundary allows this growth without changing template or project schemas.

---

## 10. Template product roadmap

### 10.1 First project-home experience

```text
Start a New Project

[ Start Empty ]

Popular Templates
[ Straight Kitchen ] [ L Kitchen ] [ Living Room ]
[ Bedroom          ] [ Bathroom  ] [ Empty Room  ]

Recent Projects
```

### 10.2 First six templates

#### A. Empty room

- Parametric room shell.
- One door and one window option.
- Neutral wall, ceiling, and floor materials.
- No decorative GLB required.

#### B. Straight kitchen

- Smart production cabinet run.
- Fillers and derived countertop.
- Kenney refrigerator, stove, sink, and hood as visual appliances.
- Saved review camera.
- Proposal-ready default lighting.

#### C. L-shaped kitchen

- Smart base, wall, tall, and corner cabinets.
- Derived L countertop.
- Kenney refrigerator, stove, sink, hood, and small appliance.
- Layout validation examples without blocking the initial template.

#### D. Living room

- Sofa.
- Lounge chair.
- Coffee table.
- TV and presentation storage.
- Rug, floor lamp, and plant.
- Saved client camera.

#### E. Bedroom

- Double bed.
- Two bedside tables.
- Wardrobe or presentation storage.
- Table/floor lamp.
- Rug and optional decor.
- Saved client camera.

#### F. Bathroom

- Toilet.
- Vanity/basin.
- Mirror.
- Shower or bath.
- Parametric door and window.
- Ceramic, glass, metal, and tile defaults.

### 10.3 Template rules

- Templates instantiate fresh project IDs.
- Template definitions contain no GLB URLs.
- Every referenced catalog ID must pass validation.
- Every template opens without network access for the initial release.
- Missing decorative assets use a safe placeholder.
- Missing production cabinets block proposal release rather than becoming props.
- Template thumbnails are deterministic and versioned.
- Template updates create a new version; existing projects do not mutate.

---

## 11. Catalog user experience

### 11.1 Object browser

Initial navigation:

```text
All
Seating
Tables
Beds
Storage
Kitchen appliances
Bathroom
Office and electronics
Lighting
Decor
Utility
```

Each card shows:

- Isometric thumbnail.
- Friendly name.
- Width × depth.
- Placement type when relevant.
- A small indicator when finishes are editable.

### 11.2 Object inspector

After placement:

- Width, depth, and height.
- Rotation and placement.
- Semantic finish slots only.
- Compatible swatches only.
- Reset to original material.
- Replace with another item in the same subcategory later.

### 11.3 Loading and failure states

- Thumbnail skeleton while loading.
- Lightweight placement ghost before GLB readiness.
- Procedural bounding-box fallback if GLB fails.
- Clear retry action.
- No modal error for one failed decorative item.
- Blocking language only when production truth is affected.

---

## 12. Compatibility and migration

### 12.1 Stable aliases

Current starter-pack IDs must continue resolving:

```text
pack:wardrobe-1
pack:dresser-1
pack:kitchen-cabinet-1
pack:sofa-1
```

They may resolve to replacement asset versions or remain deprecated compatibility records. Old project files must not break because the underlying file moved.

### 12.2 Asset deletion

An asset referenced by any supported project version cannot simply disappear.

Allowed actions:

- Deprecate it for new placement.
- Keep the referenced version available.
- Add an explicit alias to a compatible replacement.
- Show a visible missing-asset warning if recovery is impossible.

### 12.3 Legacy folder removal gate

Delete `src/fbx_with_texture` only after:

1. The four packaged starter IDs resolve through the new catalog.
2. Save/reopen tests cover those IDs.
3. No source reference remains.
4. Unit and browser tests pass.
5. A production build passes.
6. Git confirms removal is recoverable in history.

---

## 13. Validation and security

### 13.1 Build-time catalog validation

Fail verification when:

- An ID is duplicated.
- A referenced GLB or thumbnail is missing.
- A GLB has no renderable primitive.
- Dimensions are zero or invalid.
- A source material mapping matches nothing.
- A template references a hidden, blocked, or unknown item.
- A default material violates slot compatibility.
- A required license record is missing.

Warn when:

- An asset has an unusual origin or scale.
- A model has no editable material slots.
- A thumbnail is oversized.
- The triangle or file-size budget is exceeded.

### 13.2 Remote validation later

- Treat remote manifests as untrusted input.
- Validate schemas before use.
- Allow only approved URL schemes and origins.
- Verify expected byte size and content hash.
- Enforce model and texture limits.
- Never render catalog labels as raw HTML.
- Do not persist signed URLs or credentials.
- Keep organization authorization on every private asset resolution.

The cloud upload pipeline remains:

```text
intent → upload → quarantine → scan → inspect
       → normalize/optimize → thumbnail → ready
```

---

## 14. Test strategy

### 14.1 Unit tests

- Manifest schema validation.
- Unique IDs and valid paths.
- Category and lifecycle rules.
- Raw material name → semantic slot mapping.
- Slot → allowed material compatibility.
- Stable alias resolution.
- Template references and fresh-ID instantiation.
- Local and remote provider contract parity.

### 14.2 Asset verification

- Parse all 140 GLBs.
- Confirm glTF 2.0 headers.
- Confirm renderable primitives, UVs, normals, and bounds.
- Record original material names.
- Verify thumbnail availability.
- Verify license metadata.

### 14.3 Browser journeys

1. Browse a category and place an object.
2. Change one semantic material slot without affecting other slots.
3. Save and reopen with the same catalog ID, version, and materials.
4. Open each starter template in 2D and 3D.
5. Open a project while one decorative asset is unavailable.
6. Verify production cabinets never resolve to Kenney props.
7. Verify deprecated starter IDs still open.

### 14.4 Performance checks

- Catalog metadata load time.
- Thumbnail grid responsiveness.
- First GLB placement time.
- Warm repeated placement time.
- Template 2D-to-3D readiness.
- GPU memory after repeated add/delete cycles.

Existing product budgets remain authoritative, including a warm 2D-to-interactive-3D target below two seconds for the golden project.

---

## 15. Delivery roadmap

### Phase 0 — Decisions and baseline (`DONE` when this document is accepted)

Work:

- Lock the built-in vs remote provider boundary.
- Lock the semantic material model.
- Lock the cabinet and architecture exclusions.
- Record the current 140-file validation baseline.

Exit:

- Team agrees that stable IDs, not URLs, are project truth.
- Team agrees that the first visible catalog is curated, not all 140 items.

### Phase 1 — Generated inventory foundation (`NEXT`)

Work:

1. Add catalog domain schemas.
2. Add `BuiltInCatalogProvider`.
3. Build GLB inspection and manifest-generation scripts.
4. Generate file, bounds, primitive, material-name, and preview metadata.
5. Add human override records.
6. Add manifest validation tests.

Exit:

- All 140 assets exist in one validated manifest.
- No hand-written import statement is required per GLB.
- IDs and versions are stable.
- All items default to `hidden` unless explicitly approved.

### Phase 2 — Semantic material adapter

Work:

1. Resolve original GLB material names before mesh-name fallback.
2. Preserve original materials when no override exists.
3. Add per-asset material mappings.
4. Add compatibility filtering.
5. Add reset-to-original behavior.
6. Cover representative multi-material assets in tests.

Representative proof set:

- Sofa: carpet + wood.
- Bed: bedding + wood + metal.
- Glass table: glass + metal.
- Mirror: mirror/glass + frame.
- Shower: glass + metal + ceramic/base.
- Refrigerator: body + handles + glass/detail.

Exit:

- Changing upholstery does not change sofa legs.
- Changing a tabletop does not change its frame.
- Incompatible material kinds are not offered.
- Original Kenney appearance remains available.

### Phase 3 — First curated object catalog

Work:

- Approve approximately 30–35 items.
- Assign friendly names, categories, tags, dimensions, and placement.
- Use one NE isometric preview per item.
- Build category navigation and object cards.
- Lazy-load visible thumbnails and selected GLBs.
- Add search over name, category, and tags.

Exit:

- Living room, bedroom, kitchen appliance, bathroom, office, lighting, and decor categories are usable.
- Every visible card places the correct model at a realistic size.
- No architectural or production-cabinet prop appears as a normal catalog choice.

### Phase 4 — Material library experience

Work:

- Convert current presets into catalog-driven material definitions.
- Add swatch previews.
- Filter by semantic slot compatibility.
- Add material defaults by template and category.
- Add texture-backed finishes incrementally.
- Cache and dispose texture resources safely.

Exit:

- A user can recolor/retexture common objects without understanding raw GLB groups.
- Materials survive save/reopen.
- Missing texture maps have safe PBR fallbacks.

### Phase 5 — Six starter templates

Work:

1. Add the project-home template gallery.
2. Build Empty Room.
3. Build Straight Kitchen.
4. Build L-Shaped Kitchen.
5. Build Living Room.
6. Build Bedroom.
7. Build Bathroom.
8. Generate and verify template thumbnails.

Exit:

- Every template opens from the visible customer UI.
- Every template is editable in 2D and 3D.
- Every referenced object and material is valid.
- Kitchen templates retain smart cabinet truth.
- Save/reopen preserves template-created projects.

### Phase 6 — Legacy asset migration and cleanup

Work:

- Preserve aliases for four existing packaged starter IDs.
- Replace their runtime files with approved catalog assets.
- Update tests and documentation.
- Remove all remaining source references.
- Delete `src/fbx_with_texture` after the removal gate passes.

Exit:

- Old projects reopen.
- Build and browser suites pass.
- Repository loses the unused legacy asset weight.

### Phase 7 — Remote/CDN readiness

Work:

- Implement `RemoteCatalogProvider` behind configuration or a feature flag.
- Add remote manifest schema and provider contract tests.
- Add ETag/version caching.
- Add content-hash and byte-size verification.
- Add offline cache and unavailable-asset behavior.
- Keep built-in templates on the local provider initially.

Exit:

- The same project opens using local or CDN resolution without schema changes.
- No URL or token enters project JSON.
- Remote failure falls back safely.

This phase establishes delivery flexibility; it does not create user uploads or an organization catalog.

### Phase 8 — Organization asset service (`LATER`)

Work follows the Backend Book:

- Authenticated upload intent.
- Private object storage.
- Quarantine and scanning.
- Isolated GLB inspection.
- Optimization and thumbnail jobs.
- Organization ownership and authorization.
- Stable versioned asset records.
- Signed delivery URLs.
- Quotas, archive, retention, audit, and support diagnostics.

Exit is governed by Backend Book Platform 4 and cannot be claimed from local catalog work alone.

---

## 16. First build slice

Begin with infrastructure, not the template gallery.

The first implementation slice is:

1. Add provider-neutral catalog types.
2. Generate metadata for all 140 Kenney GLBs.
3. Hand-curate six representative assets.
4. Adapt material resolution to original GLB material names.
5. Prove independent material changes on those six assets.
6. Preserve current curated assets and call sites through compatibility exports.

Only after this slice is green should the team build the visible 30–35-item catalog and templates.

### First six proof assets

```text
loungeSofa.glb
bedDouble.glb
tableCoffeeGlass.glb
bathroomMirror.glb
shower.glb
kitchenFridge.glb
```

This set covers fabric, wood, metal, glass, ceramic-like surfaces, furniture, appliances, floor placement, and wall-oriented presentation.

---

## 17. Decision locks

These rules prevent the codebase from becoming unmanageable:

1. Do not write one React component per model.
2. Do not hand-import 140 files from application code.
3. Do not persist local paths or CDN URLs in projects.
4. Do not convert all models to white single-material objects.
5. Do not expose all 140 items before curation.
6. Do not use furniture props as production cabinet truth.
7. Do not use Kenney wall/door/window models instead of parametric architecture.
8. Do not delete referenced legacy assets before compatibility aliases exist.
9. Do not add a CDN dependency to the initial offline template experience.
10. Do not let remote catalog work block the local template release.

---

## 18. Definition of done for the template platform

The initial platform is complete when:

- The catalog is generated and schema-validated.
- At least 30 curated objects are visible by category.
- Semantic materials change only intended parts.
- Six templates open from the first page.
- Templates use stable object and material IDs.
- All initial templates work offline.
- Save/reopen preserves asset versions and overrides.
- Missing decorative assets fail safely.
- Production cabinets remain procedural and engineering-aware.
- Existing starter asset IDs remain compatible.
- The legacy 325 MB folder is safely removed.
- Unit, asset-integrity, build, and browser journey checks pass.
- A remote provider can be added without changing project or template identity.

At that point, adding another asset is primarily a content operation:

```text
add file → generate metadata → curate override → validate → publish
```

It should not require new renderer or project-domain code.
