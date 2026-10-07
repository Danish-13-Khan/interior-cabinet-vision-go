# Living-room curated asset conventions

> **Canonical import requirements:** Product Book
> [Section 36A — 3D Asset Import and Personal Catalog](./CABINET_STUDIO_PRODUCT_BOOK.md#36a-3d-asset-import-and-personal-catalog).
> Cloud storage, processing, and organization ownership are defined in the
> [Backend, SaaS and Commercial Platform Book](./BACKEND_SAAS_COMMERCIAL_PLATFORM_BOOK.md#9-cloud-3d-asset-and-texture-service).

This pack powers soft-goods presentation in Render Studio / Model View.
Cabinets and millwork stay procedural for shop accuracy.

## Layout

```text
public/
  models/soft-goods/
    sofa-3-seat.glb
    lounge-chair.glb
    coffee-table.glb
    side-table.glb
    floor-lamp.glb
    indoor-plant.glb
  textures/
    wood/   oak-*.ktx2  walnut-*.ktx2
    fabric/ oatmeal-*.ktx2 olive-*.ktx2
    paint/  wall-*.ktx2
    stone/  warm-*.ktx2
    laminate/ white-*.ktx2 grey-*.ktx2
    metal/  charcoal-ao.png
  basis/    basis_transcoder.js  basis_transcoder.wasm
```

Source PNGs for the offline still engine live in `render-sources/materials/<materialId>/`.
The viewport loads the KTX2 files. Colour and roughness are ETC1S; normals are
UASTC with Zstandard. Fabric delivery is 512 px. Colour and roughness KTX2
files are detail maps multiplied by the material colour and roughness. Paint and stone sit near a linear mean of 0.64, fabric and laminate near 0.82, and wood near 0.32.
`generate-pack.mjs` still rebuilds the GLBs; it no longer writes texture PNGs.

## GLB rules

| Rule | Convention |
|---|---|
| Units | Metres inside GLB |
| Size | Matches catalog `nativeSizeMm` after normalize |
| Origin | Floor contact at `Y = 0`, centered in XZ |
| Up axis | +Y |
| Forward | +Z toward room interior |
| Mesh names | `{slot}_{part}` e.g. `upholstery_seat`, `legs_-0.88_-0.3` |
| Slots | Must match `modelManifest.materialGroups` tokens |
| Fallback | Procedural adapters always remain available |

### Slot map

| Asset | Slots |
|---|---|
| sofa-3-seat | `upholstery`, `legs` |
| lounge-chair | `upholstery`, `frame` |
| coffee-table | `top`, `frame` |
| side-table | `top`, `frame` |
| floor-lamp | `frame`, `shade` |
| indoor-plant | `foliage`, `planter` |

## Texture rules

- Paths are registry `assetKey` values only — never stored in InteriorProject JSON.
- Viewport maps are KTX2 under `public/textures/...`. Metal AO stays PNG.
- If a texture `available` flag is false or load fails, procedural canvas maps are used.
- Material colour is the tint. A colour map adds grain, weave or mottling around that tint.

## Product boundary

- Soft goods / decor: curated GLB-first when `available: true`.
- TV unit, bookcase, rug, mirror, cabinets: procedural / millwork path.
