import type { CabinetConfig, CabinetDimensions } from "./cabinetDimensions";
import { clampCabinetConfig, supportsDoors, supportsDrawers, supportsEndPanels, supportsShelves } from "./cabinetDimensions";
import {
  BACK_PANEL_RULES,
  DEFAULT_BUILD_RULES,
  resolveCabinetMaterialSpec,
  type CabinetBuildRules,
  type GrainDirection,
} from "./materialSystem";

export type PartCategory =
  | "Side"
  | "TopBottom"
  | "Back"
  | "Shelf"
  | "Divider"
  | "Door"
  | "DrawerBox"
  | "DrawerFront"
  | "EndPanel"
  | "ToeKick"
  | "Stretcher";

export type CabinetPart = {
  id: string;
  label: string;
  category: PartCategory;
  quantity: number;
  lengthMm: number;
  widthMm: number;
  thicknessMm: number;
  grain: GrainDirection;
  materialLabel: string;
  finishLabel: string;
  edgeBandingLabel: string;
  notes?: string;
};

export type CabinetConstruction = {
  buildRules: CabinetBuildRules;
  parts: CabinetPart[];
};

function createPart(
  id: string,
  label: string,
  category: PartCategory,
  quantity: number,
  lengthMm: number,
  widthMm: number,
  thicknessMm: number,
  grain: GrainDirection,
  materialLabel: string,
  finishLabel: string,
  edgeBandingLabel: string,
  notes?: string,
): CabinetPart {
  return {
    id,
    label,
    category,
    quantity,
    lengthMm: Math.max(0, Math.round(lengthMm)),
    widthMm: Math.max(0, Math.round(widthMm)),
    thicknessMm: Math.max(1, Math.round(thicknessMm)),
    grain,
    materialLabel,
    finishLabel,
    edgeBandingLabel,
    notes,
  };
}

function getInnerMeasurements(dimensions: CabinetDimensions) {
  const innerWidth = dimensions.width - dimensions.boardThickness * 2;
  const innerHeight = dimensions.height - dimensions.boardThickness * 2;
  const innerDepth = dimensions.depth - dimensions.backPanelThickness;

  return {
    innerWidth,
    innerHeight,
    innerDepth,
  };
}

export function createCabinetConstruction(config: CabinetConfig): CabinetConstruction {
  const safeConfig = clampCabinetConfig(config);
  const buildRules: CabinetBuildRules = {
    ...DEFAULT_BUILD_RULES,
    ...(safeConfig.buildRules ?? {}),
  };
  const materialSpec = resolveCabinetMaterialSpec(buildRules);
  const { dimensions } = safeConfig;
  const { innerWidth, innerHeight, innerDepth } = getInnerMeasurements(dimensions);
  const backRule = BACK_PANEL_RULES[buildRules.backPanelType];
  const rebateMm = buildRules.backPanelType === "grooved" ? backRule.rebateMm : 0;
  const backWidth = buildRules.backPanelType === "none" ? 0 : innerWidth + rebateMm;
  const backHeight = buildRules.backPanelType === "none"
    ? 0
    : innerHeight - (safeConfig.toeKickHeight > 0 ? safeConfig.toeKickHeight : 0) + rebateMm;
  const usableShelfDepth = innerDepth - 30;
  const parts: CabinetPart[] = [];

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
      safeConfig.type === "sink" ? "Sink cabinet front rail" : undefined,
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

  if (supportsShelves(safeConfig.type) && safeConfig.shelfCount > 0) {
    parts.push(
      createPart(
        "shelf",
        "Adjustable Shelf",
        "Shelf",
        safeConfig.shelfCount,
        innerWidth,
        usableShelfDepth,
        buildRules.shelfThicknessMm,
        materialSpec.shelfMaterial.grainDirection,
        materialSpec.shelfMaterial.boardMaterialId.toUpperCase(),
        materialSpec.shelfMaterial.finishId,
        materialSpec.shelfMaterial.edgeBandingId,
      ),
    );
  }

  if (safeConfig.type === "corner") {
    parts.push(
      createPart(
        "corner-divider",
        "Corner Divider",
        "Divider",
        1,
        innerHeight - safeConfig.toeKickHeight,
        dimensions.depth * 0.45,
        buildRules.carcassThicknessMm,
        buildRules.grainDirection,
        materialSpec.carcassMaterial.boardMaterialId.toUpperCase(),
        materialSpec.carcassMaterial.finishId,
        materialSpec.carcassMaterial.edgeBandingId,
      ),
    );
  }

  if (supportsDoors(safeConfig.type) && safeConfig.hasDoors) {
    const doorQty = safeConfig.dimensions.width < 600 ? 1 : 2;
    const doorWidth = doorQty === 1
      ? safeConfig.dimensions.width - 4
      : (safeConfig.dimensions.width - 12) / 2;
    const doorHeight = safeConfig.dimensions.height - safeConfig.toeKickHeight - 8;
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
      ),
    );
  }

  if (supportsDrawers(safeConfig.type) && (safeConfig.drawerCount ?? 0) > 0) {
    const drawerCount = safeConfig.drawerCount ?? 0;
    const drawerFrontHeight = (safeConfig.dimensions.height - safeConfig.toeKickHeight - 8 - (drawerCount - 1) * 4) / drawerCount;
    const drawerInnerWidth = innerWidth - 26;
    const drawerDepth = Math.max(250, innerDepth - 20);

    parts.push(
      createPart(
        "drawer-front",
        "Drawer Front",
        "DrawerFront",
        drawerCount,
        drawerFrontHeight,
        safeConfig.dimensions.width - 8,
        buildRules.carcassThicknessMm,
        materialSpec.doorMaterial.grainDirection,
        materialSpec.doorMaterial.boardMaterialId.toUpperCase(),
        materialSpec.doorMaterial.finishId,
        materialSpec.doorMaterial.edgeBandingId,
      ),
      createPart(
        "drawer-side",
        "Drawer Side",
        "DrawerBox",
        drawerCount * 2,
        drawerDepth,
        140,
        buildRules.drawerBoxThicknessMm,
        materialSpec.drawerBoxMaterial.grainDirection,
        materialSpec.drawerBoxMaterial.boardMaterialId.toUpperCase(),
        materialSpec.drawerBoxMaterial.finishId,
        materialSpec.drawerBoxMaterial.edgeBandingId,
      ),
      createPart(
        "drawer-front-back",
        "Drawer Front/Back",
        "DrawerBox",
        drawerCount * 2,
        drawerInnerWidth,
        140,
        buildRules.drawerBoxThicknessMm,
        materialSpec.drawerBoxMaterial.grainDirection,
        materialSpec.drawerBoxMaterial.boardMaterialId.toUpperCase(),
        materialSpec.drawerBoxMaterial.finishId,
        materialSpec.drawerBoxMaterial.edgeBandingId,
      ),
      createPart(
        "drawer-bottom",
        "Drawer Bottom",
        "DrawerBox",
        drawerCount,
        drawerInnerWidth,
        drawerDepth,
        Math.min(6, buildRules.drawerBoxThicknessMm),
        "crosswise",
        materialSpec.drawerBoxMaterial.boardMaterialId.toUpperCase(),
        materialSpec.drawerBoxMaterial.finishId,
        "none",
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

  return {
    buildRules,
    parts,
  };
}

export function defaultConstruction(outerDims: CabinetDimensions): CabinetConstruction {
  return createCabinetConstruction({
    type: "base",
    dimensions: outerDims,
    shelfCount: 1,
    hasDoors: true,
    drawerCount: 0,
    toeKickHeight: 100,
    toeKickInset: 60,
    leftEndPanel: false,
    rightEndPanel: false,
  });
}

export function getConstructionFlatParts(construction: CabinetConstruction) {
  return construction.parts.map((part) => ({
    label: part.label,
    key: part.id,
    qty: part.quantity,
    lengthMm: part.lengthMm,
    widthMm: part.widthMm,
    thicknessMm: part.thicknessMm,
    grain: part.grain,
    category: part.category,
    material: part.materialLabel,
    finish: part.finishLabel,
    edgeBanding: part.edgeBandingLabel,
    notes: part.notes,
  }));
}
