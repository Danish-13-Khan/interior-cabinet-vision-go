import { supportsShelves } from "../cabinetDimensions";
import { collectAssemblyBoundaries } from "../cabinetAssembly";
import { getResolvedDividerCount } from "../cabinetComposition";
import { getDoorMountLabel, getShelfMountNote } from "../cabinetConstructionSpec";
import { createPart } from "./helpers";
import type { ConstructionContext } from "./context";
import { resolveFrontGaps } from "./frontGaps";
import { appendDrawerParts } from "./partsDrawers";
import { layoutCabinetElevationFace } from "../openingLayout";

export function appendInteriorParts(ctx: ConstructionContext): void {
  const {
    safeConfig,
    buildRules,
    constructionSpec,
    materialSpec,
    dimensions,
    innerHeight,
    shelfDepth,
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

  const fronts = resolveFrontGaps(safeConfig).openings;
  const doorOpenings = fronts.filter((entry) => entry.kind === "door");
  const door = materialSpec.doorMaterial;
  for (const { opening, leaves } of doorOpenings) {
    const suffix = doorOpenings.length === 1 ? "" : `-${opening.id}`;
    parts.push(
      createPart(
        `door${suffix}`,
        opening.label,
        "Door",
        leaves.length,
        leaves[0]!.heightMm,
        leaves[0]!.widthMm,
        buildRules.carcassThicknessMm,
        door.grainDirection,
        door.boardMaterialId.toUpperCase(),
        door.finishId,
        door.edgeBandingId,
        `${getDoorMountLabel(constructionSpec.doorMount)} mount`,
      ),
    );
  }

  appendDrawerParts(ctx, fronts.filter((entry) => entry.kind === "drawer"));
}
