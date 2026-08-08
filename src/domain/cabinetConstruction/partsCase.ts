import { createPart } from "./helpers";
import type { ConstructionContext } from "./context";

export function appendCaseParts(ctx: ConstructionContext): void {
  const {
    safeConfig,
    buildRules,
    materialSpec,
    dimensions,
    innerWidth,
    caseNote,
    faceFrameEnabled,
    stile,
    rail,
    backRule,
    backWidth,
    backHeight,
    parts,
  } = ctx;

  parts.push(
    createPart(
      "left-side",
      "Left Side Panel",
      "Side",
      1,
      dimensions.height,
      dimensions.depth,
      buildRules.carcassThicknessMm,
      buildRules.grainDirection === "none" ? "lengthwise" : buildRules.grainDirection,
      materialSpec.carcassMaterial.boardMaterialId.toUpperCase(),
      materialSpec.carcassMaterial.finishId,
      materialSpec.carcassMaterial.edgeBandingId,
      caseNote,
    ),
    createPart(
      "right-side",
      "Right Side Panel",
      "Side",
      1,
      dimensions.height,
      dimensions.depth,
      buildRules.carcassThicknessMm,
      buildRules.grainDirection === "none" ? "lengthwise" : buildRules.grainDirection,
      materialSpec.carcassMaterial.boardMaterialId.toUpperCase(),
      materialSpec.carcassMaterial.finishId,
      materialSpec.carcassMaterial.edgeBandingId,
      caseNote,
    ),
    createPart(
      "top",
      safeConfig.type === "sink" ? "Front Rail" : "Top Panel",
      "TopBottom",
      1,
      innerWidth,
      safeConfig.type === "sink" ? Math.min(dimensions.depth * 0.16, 90) : dimensions.depth,
      buildRules.carcassThicknessMm,
      buildRules.grainDirection,
      materialSpec.carcassMaterial.boardMaterialId.toUpperCase(),
      materialSpec.carcassMaterial.finishId,
      materialSpec.carcassMaterial.edgeBandingId,
      safeConfig.type === "sink" ? `Sink cabinet front rail · ${caseNote}` : caseNote,
    ),
    createPart(
      "bottom",
      "Bottom Panel",
      "TopBottom",
      1,
      innerWidth,
      dimensions.depth,
      buildRules.carcassThicknessMm,
      buildRules.grainDirection,
      materialSpec.carcassMaterial.boardMaterialId.toUpperCase(),
      materialSpec.carcassMaterial.finishId,
      materialSpec.carcassMaterial.edgeBandingId,
      caseNote,
    ),
  );

  if (safeConfig.type === "sink") {
    parts.push(
      createPart(
        "back-rail",
        "Back Rail",
        "Stretcher",
        1,
        innerWidth,
        Math.min(dimensions.depth * 0.16, 90),
        buildRules.carcassThicknessMm,
        buildRules.grainDirection,
        materialSpec.carcassMaterial.boardMaterialId.toUpperCase(),
        materialSpec.carcassMaterial.finishId,
        materialSpec.carcassMaterial.edgeBandingId,
        caseNote,
      ),
    );
  }

  if (faceFrameEnabled) {
    const frameHeight = dimensions.height - (safeConfig.toeKickHeight > 0 ? safeConfig.toeKickHeight : 0);
    parts.push(
      createPart(
        "ff-stile-left",
        "Face Frame Left Stile",
        "FaceFrame",
        1,
        frameHeight,
        stile,
        buildRules.carcassThicknessMm,
        "lengthwise",
        materialSpec.doorMaterial.boardMaterialId.toUpperCase(),
        materialSpec.doorMaterial.finishId,
        materialSpec.doorMaterial.edgeBandingId,
        "Face-frame stile",
      ),
      createPart(
        "ff-stile-right",
        "Face Frame Right Stile",
        "FaceFrame",
        1,
        frameHeight,
        stile,
        buildRules.carcassThicknessMm,
        "lengthwise",
        materialSpec.doorMaterial.boardMaterialId.toUpperCase(),
        materialSpec.doorMaterial.finishId,
        materialSpec.doorMaterial.edgeBandingId,
        "Face-frame stile",
      ),
      createPart(
        "ff-rail-top",
        "Face Frame Top Rail",
        "FaceFrame",
        1,
        Math.max(100, dimensions.width - stile * 2),
        rail,
        buildRules.carcassThicknessMm,
        "crosswise",
        materialSpec.doorMaterial.boardMaterialId.toUpperCase(),
        materialSpec.doorMaterial.finishId,
        materialSpec.doorMaterial.edgeBandingId,
        "Face-frame rail",
      ),
      createPart(
        "ff-rail-bottom",
        "Face Frame Bottom Rail",
        "FaceFrame",
        1,
        Math.max(100, dimensions.width - stile * 2),
        rail,
        buildRules.carcassThicknessMm,
        "crosswise",
        materialSpec.doorMaterial.boardMaterialId.toUpperCase(),
        materialSpec.doorMaterial.finishId,
        materialSpec.doorMaterial.edgeBandingId,
        "Face-frame rail",
      ),
    );
  }

  if (buildRules.backPanelType !== "none") {
    parts.push(
      createPart(
        "back",
        "Back Panel",
        "Back",
        1,
        backHeight,
        backWidth,
        buildRules.backPanelThicknessMm,
        materialSpec.backMaterial.grainDirection,
        materialSpec.backMaterial.boardMaterialId.toUpperCase(),
        materialSpec.backMaterial.finishId,
        materialSpec.backMaterial.edgeBandingId,
        backRule.description,
      ),
    );
}

}
