import {
  supportsDoors,
  supportsDrawers,
  supportsShelves,
} from "../cabinetDimensions";
import {
  getResolvedDividerCount,
  getResolvedDoorCount,
} from "../cabinetComposition";
import {
  DOOR_GAP,
  getDoorMountLabel,
  getDrawerBoxStyleNote,
  getShelfMountNote,
} from "../cabinetConstructionSpec";
import { createPart, doorFrontSize } from "./helpers";
import type { ConstructionContext } from "./context";

export function appendInteriorParts(ctx: ConstructionContext): void {
  const {
    safeConfig,
    buildRules,
    constructionSpec,
    materialSpec,
    dimensions,
    innerWidth,
    innerHeight,
    innerDepth,
    shelfAdjustable,
    shelfDepth,
    faceOpeningWidth,
    faceOpeningHeight,
    parts,
  } = ctx;

  if (supportsShelves(safeConfig.type) && safeConfig.shelfCount > 0) {
    parts.push(
      createPart(
        "shelf",
        shelfAdjustable ? "Adjustable Shelf" : "Fixed Shelf",
        "Shelf",
        safeConfig.shelfCount,
        innerWidth,
        shelfDepth,
        buildRules.shelfThicknessMm,
        materialSpec.shelfMaterial.grainDirection,
        materialSpec.shelfMaterial.boardMaterialId.toUpperCase(),
        materialSpec.shelfMaterial.finishId,
        materialSpec.shelfMaterial.edgeBandingId,
        getShelfMountNote(constructionSpec.shelfMount),
      ),
    );
  }

  const dividerCount = getResolvedDividerCount(safeConfig);
  if (dividerCount > 0) {
    parts.push(
      createPart(
        "divider",
        safeConfig.type === "corner" ? "Corner Divider" : "Vertical Divider",
        "Divider",
        dividerCount,
        innerHeight - safeConfig.toeKickHeight,
        Math.max(120, dimensions.depth * 0.45),
        buildRules.carcassThicknessMm,
        buildRules.grainDirection,
        materialSpec.carcassMaterial.boardMaterialId.toUpperCase(),
        materialSpec.carcassMaterial.finishId,
        materialSpec.carcassMaterial.edgeBandingId,
        constructionSpec.caseJoinery === "dado"
          ? "Housed divider · dado into top/bottom"
          : "Screwed vertical divider",
      ),
    );
  }

  if (supportsDoors(safeConfig.type) && safeConfig.hasDoors) {
    const doorQty = Math.max(1, getResolvedDoorCount(safeConfig));
    const { width: doorWidth, height: doorHeight } = doorFrontSize(
      constructionSpec.doorMount,
      safeConfig.dimensions.width,
      safeConfig.dimensions.height,
      safeConfig.toeKickHeight,
      doorQty,
      faceOpeningWidth,
      faceOpeningHeight,
    );
    parts.push(
      createPart(
        "door",
        "Door",
        "Door",
        doorQty,
        doorHeight,
        doorWidth,
        buildRules.carcassThicknessMm,
        materialSpec.doorMaterial.grainDirection,
        materialSpec.doorMaterial.boardMaterialId.toUpperCase(),
        materialSpec.doorMaterial.finishId,
        materialSpec.doorMaterial.edgeBandingId,
        `${getDoorMountLabel(constructionSpec.doorMount)} mount`,
      ),
    );
  }

  if (supportsDrawers(safeConfig.type) && (safeConfig.drawerCount ?? 0) > 0) {
    const drawerCount = safeConfig.drawerCount ?? 0;
    const gaps = DOOR_GAP[constructionSpec.doorMount];
    const frontWidth =
      constructionSpec.doorMount === "inset"
        ? faceOpeningWidth - gaps.sideMm * 2
        : safeConfig.dimensions.width - gaps.sideMm * 2;
    const availableFrontHeight =
      (constructionSpec.doorMount === "inset" ? faceOpeningHeight : safeConfig.dimensions.height - safeConfig.toeKickHeight) -
      gaps.bottomMm -
      (drawerCount - 1) * gaps.centerMm;
    const drawerFrontHeight = availableFrontHeight / drawerCount;
    const drawerInnerWidth = innerWidth - 26;
    const drawerDepth = Math.max(250, innerDepth - 20);
    const boxSideHeight =
      constructionSpec.drawerBoxStyle === "dovetail" ? 150 : 140;
    const bottomThickness =
      constructionSpec.drawerBoxStyle === "dado-bottom"
        ? Math.min(6, buildRules.drawerBoxThicknessMm)
        : Math.min(6, buildRules.drawerBoxThicknessMm);
    const bottomNote =
      constructionSpec.drawerBoxStyle === "dado-bottom"
        ? "Bottom housed in side grooves"
        : getDrawerBoxStyleNote(constructionSpec.drawerBoxStyle);
    const boxNote = getDrawerBoxStyleNote(constructionSpec.drawerBoxStyle);

    parts.push(
      createPart(
        "drawer-front",
        "Drawer Front",
        "DrawerFront",
        drawerCount,
        drawerFrontHeight,
        frontWidth,
        buildRules.carcassThicknessMm,
        materialSpec.doorMaterial.grainDirection,
        materialSpec.doorMaterial.boardMaterialId.toUpperCase(),
        materialSpec.doorMaterial.finishId,
        materialSpec.doorMaterial.edgeBandingId,
        `${getDoorMountLabel(constructionSpec.doorMount)} front`,
      ),
      createPart(
        "drawer-side",
        "Drawer Side",
        "DrawerBox",
        drawerCount * 2,
        drawerDepth,
        boxSideHeight,
        buildRules.drawerBoxThicknessMm,
        materialSpec.drawerBoxMaterial.grainDirection,
        materialSpec.drawerBoxMaterial.boardMaterialId.toUpperCase(),
        materialSpec.drawerBoxMaterial.finishId,
        materialSpec.drawerBoxMaterial.edgeBandingId,
        boxNote,
      ),
      createPart(
        "drawer-front-back",
        "Drawer Front/Back",
        "DrawerBox",
        drawerCount * 2,
        drawerInnerWidth,
        boxSideHeight,
        buildRules.drawerBoxThicknessMm,
        materialSpec.drawerBoxMaterial.grainDirection,
        materialSpec.drawerBoxMaterial.boardMaterialId.toUpperCase(),
        materialSpec.drawerBoxMaterial.finishId,
        materialSpec.drawerBoxMaterial.edgeBandingId,
        boxNote,
      ),
      createPart(
        "drawer-bottom",
        "Drawer Bottom",
        "DrawerBox",
        drawerCount,
        drawerInnerWidth + (constructionSpec.drawerBoxStyle === "dado-bottom" ? 12 : 0),
        drawerDepth + (constructionSpec.drawerBoxStyle === "dado-bottom" ? 12 : 0),
        bottomThickness,
        "crosswise",
        materialSpec.drawerBoxMaterial.boardMaterialId.toUpperCase(),
        materialSpec.drawerBoxMaterial.finishId,
        "none",
        bottomNote,
      ),
    );
}

}
