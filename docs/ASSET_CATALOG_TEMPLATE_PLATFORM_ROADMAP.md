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

Lifecycle and product visibility are separate:

| Lifecycle | Meaning |
| --- | --- |
| `active` | Valid and supported |
| `deprecated` | Resolves old projects but cannot be newly placed |
| `blocked` | Fails validation or violates a product boundary |

An active item also has independent visibility flags:

```json
{
  "lifecycle": "active",
  "visibility": {
    "objectBrowser": true,
    "templateEligible": true
  }
}
```

The first release should expose approximately 30–35 items. Other valid assets stay active with both visibility flags false until they receive category, dimension, placement, material, and visual QA.

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
    overrides.ts
    materialMappings.ts
  templates/
    templateManifest.ts
    builders.ts

public/catalog/
  builtin-catalog.v1.json

scripts/catalog/
  inspect-glb.mjs
  generate-kenney-manifest.mjs
  verify-catalog.mjs
```

Generated metadata and human decisions remain separate:

- `builtin-catalog.v1.json` contains discovered files, bounds, primitives, original material names, previews, approved overrides, and stable relationships.
- `overrides.ts` contains display names, categories, real-world dimensions, placement, semantic slots, tags, and visibility.

There is one write path:

```text
GLB and preview files
        ↓ inspect
discovered metadata in memory
        +
overrides.ts (human source of truth)
        ↓ deterministic merge and validation
builtin-catalog.v1.json (generated artifact)
```

Humans edit `overrides.ts`; they do not hand-edit `builtin-catalog.v1.json`. CI regenerates the manifest in a temporary location and fails when it differs from the committed artifact. Regenerating discovered metadata must never overwrite human curation.

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
  images: {
    thumbnailId: string;
    galleryIds?: string[];
  };
  materialSlots: Record<string, MaterialSlotPolicy>;
  lifecycle: "active" | "deprecated" | "blocked";
  visibility: {
    objectBrowser: boolean;
    templateEligible: boolean;
  };
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
  allowedMaterialTags?: string[];
  defaultMaterialId?: string;
  editable: boolean;
};
```

### 6.4 Material definition

```ts
type CatalogMaterial = {
  id: string;                       // material:core:fabric-oatmeal:v1
  version: number;
  name: string;
  kind: MaterialKind;
  tags: string[];
  swatchColor: string;
  baseColor: string;
  roughness: number;
  metalness: number;
  opacity: number;
  uvScaleMm: number;
  textureAssetIds?: {
    baseColor?: string;
    normal?: string;
    roughness?: string;
    ao?: string;
  };
  lifecycle: "active" | "deprecated" | "blocked";
  visibleInPicker: boolean;
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
  images: {
    thumbnailId: string;
  };
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

Catalog-backed objects add `catalogItemVersion` as a first-class optional field in the next project schema version. This is core identity, not arbitrary extension metadata.

### 6.6 Stable ID convention

Every independently addressable catalog resource receives a stable ID. A filename is not an ID.

| Resource | Example ID |
| --- | --- |
| Catalog item | `kenney:lounge-sofa` |
| Model binary | `model:kenney:lounge-sofa:v1` |
| Thumbnail | `image:kenney:lounge-sofa:iso-ne:v1` |
| Side preview | `image:kenney:lounge-sofa:side:v1` |
| Reusable material | `material:core:fabric-oatmeal:v1` |
| Texture map | `texture:core:fabric-oatmeal:base-color:v1` |
| Template | `template:core:living-room:v1` |

Rules:

- IDs are lowercase, URL-safe, and never renamed after publication.
- Display names may change without changing IDs.
- Changing file location does not change an ID.
- Replacing visual content creates a new immutable version.
- Deprecated IDs remain resolvable for supported saved projects.
- Content hashes verify bytes; they do not replace human-readable stable IDs.

### 6.7 Provider-neutral JSON manifest

The built-in provider and future remote provider expose the same validated JSON shape. Values such as hashes below are illustrative; generated catalog artifacts must contain the real SHA-256 and byte size for every file.

```json
{
  "schemaVersion": 1,
  "catalogVersion": "2026.09.1",
  "generatedAt": "2026-09-03T00:00:00Z",
  "licenses": [
    {
      "id": "cc0-1.0",
      "name": "Creative Commons CC0 1.0",
      "sourceUrl": "https://kenney.nl/assets/furniture-kit",
      "attributionRequired": false,
      "licenseFileObjectKey": "models/kenney-furniture/License_Kenney.txt"
    }
  ],
  "files": [
    {
      "id": "model:kenney:lounge-sofa:v1",
      "kind": "model",
      "objectKey": "models/kenney-furniture/models_glb/loungeSofa.glb",
      "mimeType": "model/gltf-binary",
      "byteSize": 9644,
      "contentHash": "sha256:generated-during-build"
    },
    {
      "id": "image:kenney:lounge-sofa:iso-ne:v1",
      "kind": "image",
      "role": "thumbnail",
      "objectKey": "models/kenney-furniture/renders_isometric/loungeSofa_NE.png",
      "mimeType": "image/png",
      "byteSize": 12345,
      "contentHash": "sha256:generated-during-build"
    },
    {
      "id": "image:kenney:lounge-sofa:side:v1",
      "kind": "image",
      "role": "preview",
      "objectKey": "models/kenney-furniture/renders_side/loungeSofa.png",
      "mimeType": "image/png",
      "byteSize": 6789,
      "contentHash": "sha256:generated-during-build"
    },
    {
      "id": "image:template:living-room:v1",
      "kind": "image",
      "role": "template-thumbnail",
      "objectKey": "catalog/templates/living-room-v1.webp",
      "mimeType": "image/webp",
      "byteSize": 45678,
      "contentHash": "sha256:generated-during-build"
    },
    {
      "id": "texture:core:fabric-oatmeal:base-color:v1",
      "kind": "texture",
      "role": "baseColor",
      "colorSpace": "srgb",
      "objectKey": "textures/fabric/oatmeal-color.webp",
      "mimeType": "image/webp",
      "byteSize": 34567,
      "contentHash": "sha256:generated-during-build"
    }
  ],
  "materials": [
    {
      "id": "material:core:fabric-oatmeal:v1",
      "version": 1,
      "name": "Oatmeal Weave",
      "kind": "fabric",
      "tags": ["woven", "neutral", "upholstery"],
      "swatchColor": "#d2c3ae",
      "baseColor": "#d2c3ae",
      "roughness": 0.97,
      "metalness": 0,
      "opacity": 1,
      "uvScaleMm": 450,
      "textureAssetIds": {
        "baseColor": "texture:core:fabric-oatmeal:base-color:v1"
      },
      "lifecycle": "active",
      "visibleInPicker": true
    },
    {
      "id": "material:core:wood-natural-oak:v1",
      "version": 1,
      "name": "Natural Oak",
      "kind": "wood",
      "tags": ["natural", "light", "frame"],
      "swatchColor": "#a98262",
      "baseColor": "#a98262",
      "roughness": 0.64,
      "metalness": 0,
      "opacity": 1,
      "uvScaleMm": 900,
      "lifecycle": "active",
      "visibleInPicker": true
    }
  ],
  "items": [
    {
      "id": "kenney:lounge-sofa",
      "version": 1,
      "name": "Lounge Sofa",
      "category": "seating",
      "subcategory": "sofas",
      "modelAssetId": "model:kenney:lounge-sofa:v1",
      "images": {
        "thumbnailId": "image:kenney:lounge-sofa:iso-ne:v1",
        "galleryIds": ["image:kenney:lounge-sofa:side:v1"]
      },
      "placement": "floor",
      "dimensionsMm": {
        "width": 2100,
        "height": 850,
        "depth": 900
      },
      "materialSlots": {
        "upholstery": {
          "sourceMaterialNames": ["carpet"],
          "allowedMaterialKinds": ["fabric", "leather"],
          "defaultMaterialId": "material:core:fabric-oatmeal:v1",
          "editable": true
        },
        "frame": {
          "sourceMaterialNames": ["wood"],
          "allowedMaterialKinds": ["wood", "metal"],
          "defaultMaterialId": "material:core:wood-natural-oak:v1",
          "editable": true
        }
      },
      "lifecycle": "active",
      "visibility": {
        "objectBrowser": true,
        "templateEligible": true
      },
      "source": {
        "pack": "kenney-furniture",
        "licenseId": "cc0-1.0"
      }
    }
  ],
  "templates": [
    {
      "id": "template:core:living-room:v1",
      "version": 1,
      "name": "Living Room",
      "category": "living-room",
      "description": "Furnished living room with an editable presentation layout.",
      "images": {
        "thumbnailId": "image:template:living-room:v1"
      },
      "room": {
        "widthMm": 5200,
        "depthMm": 4200,
        "heightMm": 2700
      },
      "objects": [
        {
          "templateObjectId": "living-room-sofa",
          "catalogItemId": "kenney:lounge-sofa",
          "catalogItemVersion": 1,
          "positionMm": {
            "x": 1200,
            "y": 0,
            "z": 900
          },
          "rotationY": 90,
          "materialOverrides": {
            "upholstery": "material:core:fabric-oatmeal:v1",
            "frame": "material:core:wood-natural-oak:v1"
          }
        }
      ]
    }
  ]
}
```

`objectKey` is deliberately relative. The local provider prefixes the application public root; the remote provider resolves it through the configured CDN or authorized delivery service.

### 6.8 Image identity and selection

Images are inventory resources, not filenames embedded throughout UI code.

- `thumbnailId` identifies the image used in the catalog grid.
- `galleryIds` identifies optional side or alternate-angle images.
- A template has its own `images.thumbnailId` representing the whole room, not one furniture item.
- The file registry resolves an image ID to its current local path or CDN delivery URL.
- The UI uses the image ID and never constructs filenames such as `_NE.png` itself.

For the Kenney pack, the initial rule is:

```text
Default catalog thumbnail → *_NE.png
Optional detail preview   → side render
Other isometric angles    → hidden until a gallery needs them
```

An item may override `_NE` by explicitly choosing another image ID when another angle communicates the object better. The generator may discover candidate images by filename, but the generated manifest records the final relationship explicitly. Unlinked NW/SE/SW images may stay in the package without file records until a gallery uses them.

Catalog or template-visible items must resolve a thumbnail. Hidden items do not need thumbnail records. Every declared gallery image must resolve. Renaming or relocating an image later changes only the file record, not templates or catalog items.

Template room thumbnails use the same image-ID convention, live under `public/catalog/templates/`, and are generated by a deterministic application render/capture workflow. Optimizing a PNG to WebP creates the next immutable image version; the logical role remains the same.

### 6.9 Exact object-to-texture relationship

A texture should not point directly at a 3D object. The relationship is intentionally layered:

```text
Project object instance
  → catalog item/version
    → semantic material slot
      → chosen material ID
        → texture asset IDs
          → local path or CDN URL at runtime
```

Example:

```text
object `project-object-42`
  → `kenney:lounge-sofa` v1
  → slot `upholstery`
  → `material:core:fabric-oatmeal:v1`
  → `texture:core:fabric-oatmeal:base-color:v1`
  → resolved URL
```

This lets one texture be reused safely while each object controls its own slot assignment.

When an object is created from a template or catalog item, the application snapshots every selected catalog material into the project's existing `materials` collection. Object slots continue pointing to project material entity IDs, preserving the current project architecture and offline durability.

The saved project stores the first-class catalog version, object-level choices, and material snapshots:

```json
{
  "objects": [
    {
      "id": "project-object-42",
      "catalogItemId": "kenney:lounge-sofa",
      "catalogItemVersion": 1,
      "materialSlots": {
        "upholstery": "project-material-upholstery-42",
        "frame": "project-material-frame-42"
      }
    }
  ],
  "materials": [
    {
      "id": "project-material-upholstery-42",
      "name": "Oatmeal Weave",
      "kind": "fabric",
      "color": "#d2c3ae",
      "roughness": 0.97,
      "metalness": 0,
      "opacity": 1,
      "extensions": {
        "catalogMaterialId": "material:core:fabric-oatmeal:v1",
        "catalogMaterialVersion": 1
      }
    },
    {
      "id": "project-material-frame-42",
      "name": "Natural Oak",
      "kind": "wood",
      "color": "#a98262",
      "roughness": 0.64,
      "metalness": 0,
      "opacity": 1,
      "extensions": {
        "catalogMaterialId": "material:core:wood-natural-oak:v1",
        "catalogMaterialVersion": 1
      }
    }
  ]
}
```

Project `materialSlots` values are always project-local material entity IDs. Catalog identity appears only as lineage on the material snapshot. Changing `project-object-42.materialSlots.upholstery` changes only that sofa instance. It does not mutate the catalog material definition and does not change other sofas.

Selecting a different catalog swatch resolves or creates its project-local snapshot and repoints only the selected object slots. Directly editing color, roughness, opacity, or texture properties uses clone-on-write: if the current project material entity is referenced by more than one slot, clone it to a fresh project material ID before editing; if it has one reference, it may be edited in place.

Resolution precedence is:

1. Project object material-slot assignment, including a template choice copied into the project.
2. Pinned catalog-item-version slot default for a fresh placement or Reset Finish.
3. Original embedded GLB material when the pinned item has no default.
4. Neutral safe renderer fallback when neither catalog nor GLB material is usable.

**Reset Finish** restores the pinned catalog-item-version default. Original Kenney appearance is a fallback, not the normal reset destination. A future explicit “Original model appearance” choice may be added with a typed assignment mode; it must not be represented by a magic material ID.

An intrinsic asset-specific surface can be locked:

```json
{
  "screen": {
    "sourceMaterialNames": ["glass"],
    "allowedMaterialKinds": ["glass"],
    "allowedMaterialTags": ["dark-glass"],
    "defaultMaterialId": "material:kenney:television-screen:v1",
    "editable": false
  }
}
```

Locked slots are hidden from the picker but may appear read-only in the inspector. Templates cannot override them. A locked slot may specify a fixed catalog material; without one, it keeps the original GLB material. This is appropriate for television screens, plant foliage, printed artwork, control labels, or any surface that should not appear in the normal finish picker.

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

- A fresh placement uses the pinned catalog-item-version default.
- A template copies its concrete finish choices and material snapshots into the project.
- **Reset Finish** restores the pinned catalog default.
- Keep the original Kenney material appearance only when no catalog default exists.
- Expose only useful semantic slots in the inspector.
- Lock intrinsic details that should not be edited.
- Apply a safe fallback if an assigned catalog material is unavailable.

The models should not be converted into all-white geometry.

Initial locked slots are television screens, mirror surfaces, plant foliage, refrigerator control/glass details, artwork, and appliance labels. Mirror frames, shower glass, shower hardware, appliance bodies, upholstery, furniture frames, legs, and tops remain editable where the asset supports them. Shower glass offers compatible clear and frosted finishes.

### 7.4 Compatibility matrix

| Semantic slot | Allowed `MaterialKind` | Allowed tags when refinement is needed |
| --- | --- | --- |
| `upholstery` | fabric, custom | `upholstery`, `leather` |
| `bedding` | fabric | `bedding` |
| `frame` | wood, metal, paint | — |
| `legs` | wood, metal | — |
| `top` | wood, stone, laminate, glass | — |
| `carcass` | wood, laminate, paint | — |
| `fronts` | wood, laminate, paint | — |
| `hardware` | metal | `hardware` |
| `applianceBody` | metal, custom | `appliance`, `enamel` |
| `screen` | glass | `dark-glass`, `screen` |
| `mirror` | glass | `mirror-glass` |
| `showerGlass` | glass | `clear-glass`, `frosted-glass` |
| `ceramic` | custom | `ceramic` |
| `rugSurface` | fabric, custom | `rug` |
| `foliage` | custom | `foliage` |
| `planter` | custom, stone, metal | `ceramic`, `planter` |

The UI first filters by `allowedMaterialKinds`. When `allowedMaterialTags` is present, a candidate must also contain at least one allowed tag. A user should not be offered fabric for a refrigerator or stone for a sofa cushion.

Material `kind` continues using only the repository's broad `MaterialKind` values: `wood`, `fabric`, `metal`, `glass`, `paint`, `stone`, `laminate`, and `custom`. More specific distinctions use kebab-case tags such as `dark-glass`, `mirror-glass`, `clear-glass`, `frosted-glass`, `ceramic`, `leather`, `rug`, and `foliage`. This avoids expanding the core type for every visual variant while still allowing precise picker filters.

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
  listItems(query?: CatalogQuery): Promise<CatalogPage>;
  getItem(id: string, version?: number): Promise<CatalogItem | null>;
  resolveFile(fileId: string): Promise<ResolvedAsset>;
}
```

The built-in provider may load the complete small manifest internally. A remote provider may paginate `listItems` without changing UI consumers. Typed convenience helpers such as `resolveModel`, `resolveImage`, and `resolveTexture` may wrap `resolveFile`, but all file kinds share one integrity and delivery path.

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

### 8.4 Remote manifest response

The remote provider returns the exact manifest schema defined in §6.7; it does not use a smaller, incompatible item shape. Public catalogs may return a cached full manifest. Large or private catalogs may return validated pages from `listItems`, while individual item and file records preserve the same schemas.

The API returns ephemeral public or signed delivery URLs only from `resolveFile`. These URLs are outside the persisted manifest. Immutable `objectKey` values may stay identical between local public storage and a public CDN with only the provider base changing; private organization storage may use opaque object keys.

### 8.5 CDN and cache rules

- Versioned model files are immutable.
- Replacing geometry creates a new asset version.
- Every delivered file has a content hash and byte size.
- SHA-256 is the required hash algorithm and values use the `sha256:` prefix.
- Public built-ins may use long-lived cache headers.
- Private organization assets use authorized, short-lived URLs.
- Metadata uses ETag/version revalidation.
- Thumbnails load before GLBs.
- GLBs load only when placed, previewed, or required by an opened template.
- Network failure falls back to a cached asset or procedural placeholder.
- Cached failures are retryable and visible; they do not damage project state.
- Hashes verify integrity and may participate in cache identity; immutable asset versions remain the primary cache-busting contract.

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

### 10.4 Initial Kenney selections

These are the starting visual assets, subject to final dimension and composition QA:

| Use | Kenney filenames |
| --- | --- |
| Living Room | `loungeSofa`, `loungeChair`, `tableCoffee`, `televisionModern`, `cabinetTelevision`, `rugRectangle`, `lampRoundFloor`, `pottedPlant` |
| Bedroom | `bedDouble`, `cabinetBedDrawerTable`, `lampRoundTable`, `rugRectangle`, optional `pillow` |
| Straight/L Kitchen appliances | `kitchenFridge`, `kitchenStoveElectric`, `kitchenSink`, `hoodModern`, `kitchenMicrowave`, `kitchenCoffeeMachine` |
| Bathroom | `toilet`, `bathroomSink`, `bathroomMirror`, `shower`, optional `bathtub` |
| Office/browser expansion | `desk`, `chairDesk`, `computerScreen`, `computerKeyboard`, `computerMouse`, `laptop` |

Existing `living:*` catalog items and the new `kenney:*` items run side by side initially. Do not alias or replace existing items until visual, placement, material, and save/reopen QA proves the replacement. Templates explicitly choose the preferred item by stable ID.

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
- **Reset Finish**, restoring the pinned catalog-item-version default.
- Read-only labels for locked intrinsic slots when useful.
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
- An image, model, material, or texture ID points to the wrong resource kind.
- A file's content hash or byte size differs from its manifest record.
- A GLB has no renderable primitive.
- Dimensions are zero or invalid.
- A source material mapping matches nothing.
- A material references a missing texture ID.
- A base-color texture has the wrong color-space declaration.
- A template references a blocked, unknown, or non-template-eligible item.
- A template attempts to override a locked material slot.
- A default material violates slot compatibility.
- A browser-visible or template-eligible item has no resolvable thumbnail.
- A declared gallery image does not resolve.
- A required license record is missing.

Warn when:

- An asset has an unusual origin or scale.
- A model has no editable material slots.
- A thumbnail is oversized.
- The triangle or file-size budget is exceeded.
- A material, texture, or image record is unreferenced.

Hidden/non-visible items require valid models but do not require thumbnails. Every declared reference is strict even when optional UI is not yet built.

The manifest generator writes real SHA-256 hashes and byte sizes for every file. The standalone verifier recomputes them without rewriting. A mismatch fails generation, CI, and production build verification; a mismatch encountered unexpectedly at runtime produces a diagnostic and safe placeholder instead of corrupting project state.

Breaking field or meaning changes increment `schemaVersion`. Optional additive fields may remain within the same schema version. Catalog content additions and immutable asset revisions increment `catalogVersion` without implying a schema change.

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
- Unique image IDs and correct thumbnail/gallery relationships.
- Model, image, material, and texture reference integrity.
- Category and lifecycle rules.
- Raw material name → semantic slot mapping.
- Slot → allowed material compatibility.
- Per-object material overrides do not mutate other instances.
- Template material choices are copied into project materials as durable snapshots.
- Project object slots reference only project-local material entity IDs; catalog material IDs appear only as lineage.
- Editing a shared project material performs clone-on-write and preserves every unselected object's finish.
- Reset Finish resolves the pinned catalog-item-version default.
- Locked-slot template overrides are rejected.
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
- Recompute SHA-256 and byte size for every registered file.

### 14.3 Browser journeys

1. Browse a category and place an object.
2. Change one semantic material slot without affecting other slots.
3. Edit a finish shared by two objects and verify only the selected object receives a cloned project material.
4. Save and reopen with the same catalog ID, version, and project-local materials.
5. Open each starter template in 2D and 3D.
6. Open a project while one decorative asset is unavailable.
7. Verify production cabinets never resolve to Kenney props.
8. Verify deprecated starter IDs still open.

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
4. Generate provider-neutral JSON containing file, hash, bounds, primitive, material-name, and preview metadata.
5. Add human override records.
6. Add manifest validation tests.

Exit:

- All 140 assets exist in one validated manifest.
- No hand-written import statement is required per GLB.
- Every model, thumbnail, preview, material, and texture relationship uses a stable ID.
- IDs and versions are stable.
- All discovered items default to `lifecycle: "active"` with both visibility flags false unless explicitly approved; invalid or excluded items are `blocked`.

### Phase 2 — Semantic material adapter

Work:

1. Resolve original GLB material names before mesh-name fallback.
2. Preserve original materials as fallback when no catalog default exists.
3. Add per-asset material mappings.
4. Add compatibility filtering.
5. Add Reset Finish behavior against the pinned catalog-item-version default.
6. Cover representative multi-material assets in tests.

Representative proof set:

- Sofa: carpet + wood.
- Bed: bedding + wood + metal.
- Glass table: glass + metal. `tableCoffeeGlass` is intentionally a material-mapping proof asset; the Living Room template uses the warmer opaque `tableCoffee` model.
- Mirror: mirror/glass + frame.
- Shower: glass + metal + ceramic/base.
- Refrigerator: body + handles + glass/detail.
- Television: locked screen + editable/fixed body behavior.
- Plant: locked foliage + editable planter behavior.

Exit:

- Changing upholstery does not change sofa legs.
- Changing a tabletop does not change its frame.
- Incompatible material kinds are not offered.
- Locked slots reject template and project-picker overrides.
- Original Kenney appearance remains a safe fallback.

### Phase 3 — Template-ready asset and finish slice

Work:

- Approve the approximately 30–35 objects needed by the first templates.
- Assign friendly names, categories, tags, dimensions, placement, visibility, and semantic slots.
- Use one reviewed isometric preview per item, defaulting to NE.
- Convert the existing material presets into catalog-driven definitions.
- Add ceramic, appliance metal, clear/frosted glass, and other finishes required by proof assets.
- Snapshot chosen catalog materials into project materials during placement/template instantiation.
- Keep the general object-browser expansion out of this phase.

Exit:

- Every object required by the six templates is catalog-valid and template-eligible.
- Template assets place at realistic dimensions with intended default finishes.
- Project material snapshots survive save/reopen.
- No architectural or production-cabinet prop is template-eligible.

### Phase 4 — Living Room vertical slice

Work:

- Add the project-home template gallery foundation.
- Build the Living Room template first.
- Use `loungeSofa`, `loungeChair`, `tableCoffee`, `televisionModern`, `cabinetTelevision`, `rugRectangle`, `lampRoundFloor`, and `pottedPlant`.
- Generate its deterministic room thumbnail.
- Expose compatible swatches in the object inspector.
- Lazy-load thumbnails and only the GLBs used by the opened template.
- Cover create → 2D → 3D → change finish → save → reopen.

Exit:

- Living Room opens from the visible customer UI.
- It remains editable in 2D and 3D.
- Upholstery changes independently from frames/legs.
- Locked TV and plant surfaces remain protected.
- Save/reopen preserves catalog versions and material snapshots.

### Phase 5 — Remaining templates and curated browser

Work:

1. Build Empty Room.
2. Build Straight Kitchen.
3. Build L-Shaped Kitchen.
4. Build Bedroom.
5. Build Bathroom.
6. Generate and verify their template thumbnails.
7. Expose the approved 30–35 items in the category browser.
8. Add search over normalized name, category, and tags.
9. Lazy-load visible thumbnails and selected GLBs.

Exit:

- Every template opens from the visible customer UI.
- Every template is editable in 2D and 3D.
- Every referenced object and material is valid.
- Kitchen templates retain smart cabinet truth.
- Save/reopen preserves template-created projects.
- Every visible catalog card places the correct model at realistic size.
- Living room, bedroom, kitchen appliance, bathroom, office/electronics, lighting, and decor categories are usable.

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
3. Hand-curate eight representative assets.
4. Adapt material resolution to original GLB material names.
5. Prove independent material changes and locked-slot behavior across those eight assets.
6. Preserve current curated assets and call sites through compatibility exports.

After this slice is green, the first UI work is the Living Room template vertical slice. Do not begin with a general 140-item browser.

### First eight proof assets

```text
loungeSofa.glb
bedDouble.glb
tableCoffeeGlass.glb
bathroomMirror.glb
shower.glb
kitchenFridge.glb
televisionModern.glb
pottedPlant.glb
```

This set covers fabric, wood, metal, glass, ceramic-like surfaces, furniture, appliances, floor placement, wall-oriented presentation, and locked-slot behavior. `tableCoffeeGlass` proves independent glass/metal mapping; Phase 4 deliberately uses `tableCoffee` in the Living Room composition.

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
11. Public item images always use `images.thumbnailId` and optional `images.galleryIds`.
12. Human curation lives in `overrides.ts`; `builtin-catalog.v1.json` is generated and never hand-edited.
13. Reset Finish restores the pinned catalog-item-version default; original GLB material is fallback.
14. Templates cannot override locked material slots.
15. Lifecycle and UI visibility remain separate fields.
16. All models, images, and textures resolve through the generic `resolveFile` contract.
17. Built-in and remote manifests use the same schema.
18. SHA-256 and byte size are required for every registered file.
19. Template material choices are copied into the project's material collection as durable snapshots.
20. Template-first curation precedes the general object-browser expansion.
21. Project `materialSlots` always reference project-local material entity IDs; catalog material IDs are lineage only.
22. Direct finish-property edits use clone-on-write whenever the current project material is shared; catalog swatch selection repoints only the selected slots.
23. `tableCoffeeGlass` is the glass/metal proof asset; the Living Room v1 template deliberately uses `tableCoffee`.
24. The Phase 2 proof set includes `televisionModern` and `pottedPlant` so locked screen and foliage slots are tested before template composition.

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
