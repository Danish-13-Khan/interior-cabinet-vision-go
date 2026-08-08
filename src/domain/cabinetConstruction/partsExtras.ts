import { supportsEndPanels } from "../cabinetDimensions";
import { getResolvedFillers } from "../cabinetComposition";
import { createPart } from "./helpers";
import type { ConstructionContext } from "./context";

export function appendExtraParts(ctx: ConstructionContext): void {
  const {
    safeConfig,
    buildRules,
    materialSpec,
    dimensions,
    innerWidth,
    parts,
  } = ctx;

  const fillers = getResolvedFillers(safeConfig);
  if (fillers.leftMm > 0) {
    parts.push(
      createPart(
        "filler-left",
        "Left Filler",
        "EndPanel",
        1,
        dimensions.height - safeConfig.toeKickHeight,
        fillers.leftMm,
        buildRules.carcassThicknessMm,
        buildRules.grainDirection,
        materialSpec.carcassMaterial.boardMaterialId.toUpperCase(),
        materialSpec.carcassMaterial.finishId,
        materialSpec.carcassMaterial.edgeBandingId,
        "Run filler strip",
      ),
    );
  }
  if (fillers.rightMm > 0) {
    parts.push(
      createPart(
        "filler-right",
        "Right Filler",
        "EndPanel",
        1,
        dimensions.height - safeConfig.toeKickHeight,
        fillers.rightMm,
        buildRules.carcassThicknessMm,
        buildRules.grainDirection,
        materialSpec.carcassMaterial.boardMaterialId.toUpperCase(),
        materialSpec.carcassMaterial.finishId,
        materialSpec.carcassMaterial.edgeBandingId,
        "Run filler strip",
      ),
    );
  }

  if (supportsEndPanels(safeConfig.type) && safeConfig.leftEndPanel) {
    parts.push(
      createPart(
        "left-end-panel",
        "Left End Panel",
        "EndPanel",
        1,
        dimensions.height,
        dimensions.depth,
        buildRules.carcassThicknessMm,
        materialSpec.carcassMaterial.grainDirection,
        materialSpec.carcassMaterial.boardMaterialId.toUpperCase(),
        materialSpec.carcassMaterial.finishId,
        materialSpec.carcassMaterial.edgeBandingId,
      ),
    );
  }

  if (supportsEndPanels(safeConfig.type) && safeConfig.rightEndPanel) {
    parts.push(
      createPart(
        "right-end-panel",
        "Right End Panel",
        "EndPanel",
        1,
        dimensions.height,
        dimensions.depth,
        buildRules.carcassThicknessMm,
        materialSpec.carcassMaterial.grainDirection,
        materialSpec.carcassMaterial.boardMaterialId.toUpperCase(),
        materialSpec.carcassMaterial.finishId,
        materialSpec.carcassMaterial.edgeBandingId,
      ),
    );
  }

  if (safeConfig.toeKickHeight > 0) {
    parts.push(
      createPart(
        "toe-kick",
        "Toe Kick",
        "ToeKick",
        1,
        innerWidth,
        safeConfig.toeKickHeight,
        buildRules.carcassThicknessMm,
        "crosswise",
        materialSpec.carcassMaterial.boardMaterialId.toUpperCase(),
        materialSpec.carcassMaterial.finishId,
        materialSpec.carcassMaterial.edgeBandingId,
      ),
    );
}

}
