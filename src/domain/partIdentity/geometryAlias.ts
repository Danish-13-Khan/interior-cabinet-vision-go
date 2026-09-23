/**
 * Geometry mesh names (cabinetGeometry) are not construction keys.
 * Candidates are tried in order against the live cut list.
 * Drawer-box parts and assembly-divider meshes stay unmapped on purpose.
 */
const STATIC_GEOMETRY: Record<string, string[]> = {
  "left-side-panel": ["left-side"],
  "right-side-panel": ["right-side"],
  "top-panel": ["top"],
  "front-rail": ["top"],
  "bottom-panel": ["bottom"],
  "back-panel": ["back"],
  "back-panel-left": ["back"],
  "back-panel-right": ["back"],
  "toe-kick": ["toe-kick"],
  "left-end-panel": ["left-end-panel"],
  "right-end-panel": ["right-end-panel"],
  "back-rail": ["back-rail"],
  door: ["door"],
  "left-door": ["door"],
  "right-door": ["door"],
};

export function geometryConstructionCandidates(geometryName: string): string[] {
  const fixed = STATIC_GEOMETRY[geometryName];
  if (fixed) return fixed;

  const doorLeaf = /^door-(.+)-(\d+)$/.exec(geometryName);
  if (doorLeaf) return [`door-${doorLeaf[1]}`, "door"];

  if (/^shelf-\d+$/.test(geometryName)) return ["shelf"];
  const shelfOpening = /^shelf-(.+)-(\d+)$/.exec(geometryName);
  if (shelfOpening) return [`shelf-${shelfOpening[1]}`, "shelf"];

  const drawerFront = /^drawer-front-(\d+)$/.exec(geometryName);
  if (drawerFront) return [`drawer-front-${drawerFront[1]}`, "drawer-front"];

  const drawerOpening = /^drawer-(.+)-(\d+)$/.exec(geometryName);
  if (drawerOpening) {
    return [
      `drawer-front-${drawerOpening[1]}-${drawerOpening[2]}`,
      `drawer-front-${drawerOpening[1]}`,
      "drawer-front",
    ];
  }
  return [];
}
