import { LIVING_ROOM_MATERIAL_IDS } from "./materials";

/** CC0 Poly Haven scans. `tileMm` is the captured physical repeat. */
export const SCANNED_MATERIAL_SETS = [
  {
    materialId: LIVING_ROOM_MATERIAL_IDS.naturalOak,
    polyhaven: "red_oak_veneer",
    tileMm: 1000,
    color: "tex:oak-color",
    normal: "tex:oak-normal",
    roughness: "tex:oak-rough",
  },
  {
    materialId: LIVING_ROOM_MATERIAL_IDS.walnut,
    polyhaven: "black_walnut_veneer_02",
    tileMm: 1000,
    color: "tex:walnut-color",
    normal: "tex:walnut-normal",
    roughness: "tex:walnut-rough",
  },
  {
    materialId: LIVING_ROOM_MATERIAL_IDS.oatmealFabric,
    polyhaven: "hessian_230",
    tileMm: 269,
    color: "tex:fabric-oatmeal-color",
    normal: "tex:fabric-oatmeal-normal",
    roughness: "tex:fabric-oatmeal-rough",
  },
  {
    materialId: LIVING_ROOM_MATERIAL_IDS.oliveFabric,
    polyhaven: "polar_fleece",
    tileMm: 273,
    color: "tex:fabric-olive-color",
    normal: "tex:fabric-olive-normal",
    roughness: "tex:fabric-olive-rough",
  },
  {
    materialId: LIVING_ROOM_MATERIAL_IDS.warmStone,
    polyhaven: "marble_01",
    tileMm: 1500,
    color: "tex:stone-warm-color",
    normal: "tex:stone-warm-normal",
    roughness: "tex:stone-warm-rough",
  },
  {
    materialId: LIVING_ROOM_MATERIAL_IDS.wallPaint,
    polyhaven: "beige_wall_001",
    tileMm: 3000,
    color: "tex:paint-wall-color",
    normal: "tex:paint-wall-normal",
    roughness: "tex:paint-wall-rough",
  },
  {
    materialId: LIVING_ROOM_MATERIAL_IDS.whiteLaminate,
    polyhaven: "leather_white",
    tileMm: 300,
    color: "tex:laminate-white-color",
    normal: "tex:laminate-white-normal",
    roughness: "tex:laminate-white-rough",
  },
  {
    materialId: LIVING_ROOM_MATERIAL_IDS.greyLaminate,
    polyhaven: "grey_plaster",
    tileMm: 1000,
    color: "tex:laminate-grey-color",
    normal: "tex:laminate-grey-normal",
    roughness: "tex:laminate-grey-rough",
  },
] as const;
