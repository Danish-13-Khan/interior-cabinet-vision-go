import type { CabinetConfig, CabinetDimensions } from "./cabinetDimensions";
import { clampCabinetConfig, supportsDoors, supportsDrawers, supportsEndPanels, supportsShelves } from "./cabinetDimensions";
import {
  getResolvedDividerCount,
  getResolvedDoorCount,
  getResolvedFillers,
  resolveCabinetComposition,
} from "./cabinetComposition";
import {
  BACK_PANEL_RULES,
  DEFAULT_BUILD_RULES,
  resolveCabinetMaterialSpec,
  type CabinetBuildRules,
  type GrainDirection,
} from "./materialSystem";
import {
  DOOR_GAP,
  SHELF_PIN_SETBACK_MM,
  describeConstructionSpec,
  getCaseJoineryNote,
  getDoorMountLabel,
  getDrawerBoxStyleNote,
  getShelfMountNote,
  normalizeConstructionSpec,
  type CabinetConstructionSpec,
  type DoorMount,
} from "./cabinetConstructionSpec";

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
  | "Stretcher"
  | "FaceFrame";

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
  constructionSpec: CabinetConstructionSpec;
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

function doorFrontSize(
  mount: DoorMount,
  cabinetWidth: number,
  cabinetHeight: number,
  toeKickHeight: number,
  doorQty: number,
  faceInsetWidthMm: number,
  faceInsetHeightMm: number,
) {
  const gaps = DOOR_GAP[mount];
  if (mount === "inset") {
    const width =
      doorQty === 1
        ? faceInsetWidthMm - gaps.sideMm * 2
        : (faceInsetWidthMm - gaps.sideMm * 2 - gaps.centerMm * (doorQty - 1)) / doorQty;
    const height = faceInsetHeightMm - gaps.bottomMm;
    return { width, height };
  }

  const width =
    doorQty === 1
      ? cabinetWidth - gaps.sideMm * 2
      : (cabinetWidth - gaps.sideMm * 2 - gaps.centerMm * (doorQty - 1)) / doorQty;
  const height = cabinetHeight - toeKickHeight - gaps.bottomMm;
  return { width, height };
}

export function createCabinetConstruction(config: CabinetConfig): CabinetConstruction {
  const safeConfig = clampCabinetConfig(config);
  const buildRules: CabinetBuildRules = {
    ...DEFAULT_BUILD_RULES,
    ...(safeConfig.buildRules ?? {}),
  };
  const constructionSpec = normalizeConstructionSpec(
    safeConfig.type,
    safeConfig.construction,
    { shelvesAdjustable: resolveCabinetComposition(safeConfig).shelves.adjustable },
  );
  const materialSpec = resolveCabinetMaterialSpec(buildRules);
  const { dimensions } = safeConfig;
  const { innerWidth, innerHeight, innerDepth } = getInnerMeasurements(dimensions);
  const backRule = BACK_PANEL_RULES[buildRules.backPanelType];
  const rebateMm = buildRules.backPanelType === "grooved" ? backRule.rebateMm : 0;
  const backWidth = buildRules.backPanelType === "none" ? 0 : innerWidth + rebateMm;
  const backHeight = buildRules.backPanelType === "none"
    ? 0
    : innerHeight - (safeConfig.toeKickHeight > 0 ? safeConfig.toeKickHeight : 0) + rebateMm;
  const caseNote = getCaseJoineryNote(constructionSpec.caseJoinery);
  const shelfAdjustable = constructionSpec.shelfMount === "adjustable-pins";
  const shelfDepth = shelfAdjustable
    ? Math.max(80, innerDepth - SHELF_PIN_SETBACK_MM)
    : Math.max(80, innerDepth - (constructionSpec.shelfMount === "fixed-dado" ? 4 : 10));
  const faceFrameEnabled = constructionSpec.carcassStyle === "face-frame";
  const stile = constructionSpec.faceFrame.stileWidthMm;
  const rail = constructionSpec.faceFrame.railWidthMm;
  const faceOpeningWidth = faceFrameEnabled
    ? Math.max(120, dimensions.width - stile * 2)
    : innerWidth;
  const faceOpeningHeight = faceFrameEnabled
    ? Math.max(
        120,
        dimensions.height - rail * 2 - (safeConfig.toeKickHeight > 0 ? safeConfig.toeKickHeight : 0),
      )
    : Math.max(120, dimensions.height - safeConfig.toeKickHeight - dimensions.boardThickness * 2);
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

  return {
    buildRules,
    constructionSpec,
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

export function getConstructionSummary(construction: CabinetConstruction): string {
  return describeConstructionSpec(construction.constructionSpec);
}
