import {
  supportsDoors,
  supportsDrawers,
  supportsShelves,
} from "../cabinetDimensions";
import { collectAssemblyBoundaries } from "../cabinetAssembly";
import { getResolvedDividerCount } from "../cabinetComposition";
import {
  DOOR_GAP,
  getDoorMountLabel,
  getDrawerBoxStyleNote,
  getShelfMountNote,
} from "../cabinetConstructionSpec";
import { createPart, doorFrontSize } from "./helpers";
import type { ConstructionContext } from "./context";
import { layoutCabinetElevationFace } from "../openingLayout";

export function appendInteriorParts(ctx: ConstructionContext): void {
  const {
    safeConfig,
    buildRules,
    constructionSpec,
    materialSpec,
    dimensions,
    innerHeight,
    innerDepth,
    shelfDepth,
    faceOpeningWidth,
    faceOpeningHeight,
    parts,
  } = ctx;

  const face = layoutCabinetElevationFace(safeConfig);
  const shelfOpenings = face.openings.filter(
    (opening) =>
      supportsShelves(safeConfig.type) &&
      (opening.contentType === "door" || opening.contentType === "open-shelf") &&
      opening.shelfCount > 0,
  );
  for (const opening of shelfOpenings) {
    const suffix = shelfOpenings.length === 1 ? "" : `-${opening.id}`;
    parts.push(
      createPart(
        `shelf${suffix}`,
        opening.shelvesAdjustable ? "Adjustable Shelf" : "Fixed Shelf",
        "Shelf",
        opening.shelfCount,
        opening.widthMm,
        shelfDepth,
        buildRules.shelfThicknessMm,
        materialSpec.shelfMaterial.grainDirection,
        materialSpec.shelfMaterial.boardMaterialId.toUpperCase(),
        materialSpec.shelfMaterial.finishId,
        materialSpec.shelfMaterial.edgeBandingId,
        opening.shelvesAdjustable
          ? getShelfMountNote("adjustable-pins")
          : getShelfMountNote("fixed-dado"),
      ),
    );
  }

  const boundaries = collectAssemblyBoundaries(face.openings);
  for (let index = 0; index < boundaries.length; index += 1) {
    const boundary = boundaries[index]!;
    const vertical = boundary.axis === "vertical";
    parts.push(
      createPart(
        `${vertical ? "divider" : "partition"}-${index + 1}`,
        vertical ? "Vertical Divider" : "Fixed Partition",
        vertical ? "Divider" : "Shelf",
        1,
        boundary.endMm - boundary.startMm,
        shelfDepth,
        buildRules.carcassThicknessMm,
        buildRules.grainDirection,
        materialSpec.carcassMaterial.boardMaterialId.toUpperCase(),
        materialSpec.carcassMaterial.finishId,
        materialSpec.carcassMaterial.edgeBandingId,
        constructionSpec.caseJoinery === "dado"
          ? "Housed assembly partition"
          : "Screwed assembly partition",
      ),
    );
  }

  const boundaryDividerCount = boundaries.filter(
    (boundary) => boundary.axis === "vertical",
  ).length;
  const additionalDividerCount = Math.max(
    0,
    getResolvedDividerCount(safeConfig) - boundaryDividerCount,
  );
  if (additionalDividerCount > 0) {
    parts.push(
      createPart(
        "divider",
        safeConfig.type === "corner" ? "Corner Divider" : "Vertical Divider",
        "Divider",
        additionalDividerCount,
        innerHeight - safeConfig.toeKickHeight,
        Math.max(120, dimensions.depth * 0.45),
        buildRules.carcassThicknessMm,
        buildRules.grainDirection,
        materialSpec.carcassMaterial.boardMaterialId.toUpperCase(),
        materialSpec.carcassMaterial.finishId,
        materialSpec.carcassMaterial.edgeBandingId,
        "Fixed assembly divider",
      ),
    );
  }

  const doorOpenings = face.openings.filter(
    (opening) => supportsDoors(safeConfig.type) && opening.contentType === "door",
  );
  for (const opening of doorOpenings) {
    const doorQty = opening.doorStyle === "single" ? 1 : 2;
    const singleFullOpening = face.openings.length === 1;
    const size = singleFullOpening
      ? doorFrontSize(
          constructionSpec.doorMount,
          safeConfig.dimensions.width,
          safeConfig.dimensions.height,
          safeConfig.toeKickHeight,
          doorQty,
          faceOpeningWidth,
          faceOpeningHeight,
        )
      : {
          width:
            (opening.widthMm -
              DOOR_GAP[constructionSpec.doorMount].sideMm * 2 -
              DOOR_GAP[constructionSpec.doorMount].centerMm * (doorQty - 1)) /
            doorQty,
          height:
            opening.heightMm - DOOR_GAP[constructionSpec.doorMount].bottomMm,
        };
    const suffix = doorOpenings.length === 1 ? "" : `-${opening.id}`;
    parts.push(
      createPart(
        `door${suffix}`,
        opening.label,
        "Door",
        doorQty,
        size.height,
        size.width,
        buildRules.carcassThicknessMm,
        materialSpec.doorMaterial.grainDirection,
        materialSpec.doorMaterial.boardMaterialId.toUpperCase(),
        materialSpec.doorMaterial.finishId,
        materialSpec.doorMaterial.edgeBandingId,
        `${getDoorMountLabel(constructionSpec.doorMount)} mount`,
      ),
    );
  }

  const drawerOpenings = face.openings.filter(
    (opening) => supportsDrawers(safeConfig.type) && opening.contentType === "drawer-stack",
  );
  for (const opening of drawerOpenings) {
    const drawerCount = Math.max(1, opening.drawerCount);
    const gaps = DOOR_GAP[constructionSpec.doorMount];
    const frontWidth = opening.widthMm - gaps.sideMm * 2;
    const availableFrontHeight =
      opening.heightMm - gaps.bottomMm - (drawerCount - 1) * gaps.centerMm;
    const drawerFrontHeight = availableFrontHeight / drawerCount;
    const drawerInnerWidth = Math.max(120, opening.widthMm - 26);
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

    const suffix = drawerOpenings.length === 1 ? "" : `-${opening.id}`;
    const customFronts = opening.drawerRatios?.length === drawerCount;
    const frontParts = customFronts
      ? opening.drawerRatios!.map((ratio, index) =>
          createPart(
            `drawer-front${suffix}-${index + 1}`,
            `${opening.label} Front ${index + 1}`,
            "DrawerFront",
            1,
            availableFrontHeight * ratio,
            frontWidth,
            buildRules.carcassThicknessMm,
            materialSpec.doorMaterial.grainDirection,
            materialSpec.doorMaterial.boardMaterialId.toUpperCase(),
            materialSpec.doorMaterial.finishId,
            materialSpec.doorMaterial.edgeBandingId,
            `${getDoorMountLabel(constructionSpec.doorMount)} custom front`,
          ),
        )
      : [
          createPart(
            `drawer-front${suffix}`,
            `${opening.label} Front`,
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
        ];
    parts.push(
      ...frontParts,
      createPart(
        `drawer-side${suffix}`,
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
        `drawer-front-back${suffix}`,
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
        `drawer-bottom${suffix}`,
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
