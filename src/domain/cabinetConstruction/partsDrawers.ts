import { getDoorMountLabel, getDrawerBoxStyleNote } from "../cabinetConstructionSpec";
import { createPart } from "./helpers";
import type { ConstructionContext } from "./context";
import type { ResolvedOpeningFronts } from "./frontGaps";

export function appendDrawerParts(ctx: ConstructionContext, drawers: readonly ResolvedOpeningFronts[]): void {
  const { buildRules, constructionSpec, materialSpec, innerDepth, parts } = ctx;
  const door = materialSpec.doorMaterial;
  const box = materialSpec.drawerBoxMaterial;
  const mountLabel = getDoorMountLabel(constructionSpec.doorMount);
  const front = (id: string, label: string, quantity: number, heightMm: number, widthMm: number, note: string) =>
    createPart(id, label, "DrawerFront", quantity, heightMm, widthMm, buildRules.carcassThicknessMm,
      door.grainDirection, door.boardMaterialId.toUpperCase(), door.finishId, door.edgeBandingId, note);
  const boxPart = (id: string, label: string, quantity: number, lengthMm: number, widthMm: number, thicknessMm: number, note: string) =>
    createPart(id, label, "DrawerBox", quantity, lengthMm, widthMm, thicknessMm,
      box.grainDirection, box.boardMaterialId.toUpperCase(), box.finishId, box.edgeBandingId, note);

  for (const { opening, leaves } of drawers) {
    const drawerCount = leaves.length;
    const drawerInnerWidth = Math.max(120, opening.widthMm - 26);
    const drawerDepth = Math.max(250, innerDepth - 20);
    const boxSideHeight = constructionSpec.drawerBoxStyle === "dovetail" ? 150 : 140;
    const dadoBottom = constructionSpec.drawerBoxStyle === "dado-bottom";
    const bottomThickness = Math.min(6, buildRules.drawerBoxThicknessMm);
    const boxNote = getDrawerBoxStyleNote(constructionSpec.drawerBoxStyle);
    const bottomNote = dadoBottom ? "Bottom housed in side grooves" : boxNote;
    const suffix = drawers.length === 1 ? "" : `-${opening.id}`;
    const customFronts = opening.drawerRatios?.length === drawerCount;
    const frontParts = customFronts
      ? leaves.map((leaf, index) => front(`drawer-front${suffix}-${index + 1}`, `${opening.label} Front ${index + 1}`,
          1, leaf.heightMm, leaf.widthMm, `${mountLabel} custom front`))
      : [front(`drawer-front${suffix}`, `${opening.label} Front`, drawerCount, leaves[0]!.heightMm, leaves[0]!.widthMm, `${mountLabel} front`)];
    parts.push(
      ...frontParts,
      boxPart(`drawer-side${suffix}`, "Drawer Side", drawerCount * 2, drawerDepth, boxSideHeight, buildRules.drawerBoxThicknessMm, boxNote),
      boxPart(`drawer-front-back${suffix}`, "Drawer Front/Back", drawerCount * 2, drawerInnerWidth, boxSideHeight, buildRules.drawerBoxThicknessMm, boxNote),
      {
        ...boxPart(`drawer-bottom${suffix}`, "Drawer Bottom", drawerCount,
          drawerInnerWidth + (dadoBottom ? 12 : 0), drawerDepth + (dadoBottom ? 12 : 0), bottomThickness, bottomNote),
        grain: "crosswise",
        edgeBandingLabel: "none",
      },
    );
  }
}
