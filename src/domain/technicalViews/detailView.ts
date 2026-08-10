import {
  getFootprintDimensions,
  type CabinetProject,
} from "../cabinetDimensions";
import {
  createCabinetConstruction,
  getConstructionFlatParts,
  getConstructionSummary,
} from "../cabinetConstruction";
import type { RoomConfig } from "../roomModel";
import {
  cabinetSectionCutGraphics,
  detailCalloutBubble,
  detailZoomFrame,
  resolveSectionCutPlane,
} from "../sectionCut";
import { embedResolvedPrintChrome } from "../printLayout";
import { cabinetElevationGraphics } from "./cabinetSvg";
import { SCALE } from "./constants";
import {
  computeSheetFrame,
  sheetBackground,
  wrapTechnicalSvg,
} from "./sheetFrame";
import { line, rect, text } from "./svgPrimitives";
import type { TechnicalViewOptions, TechnicalViewResult } from "./types";
import { resolveDisplay } from "./viewLayers";
import { layoutCabinetElevationFace } from "../openingLayout";
import {
  summarizeCabinetAssembly,
  validateCabinetAssembly,
} from "../cabinetAssembly";
import { resolveCabinetMaterialSpec } from "../materialSystem";
import { describeHardwareSpec, normalizeCabinetHardware } from "../hardwareSystem";

const DETAIL_SCALE = 2.2;

/**
 * Zoomed interior construction / elevation detail sheet (DET-1).
 */
export function detailView(
  project: CabinetProject,
  _room: RoomConfig,
  options: TechnicalViewOptions = {},
): TechnicalViewResult {
  const plane = resolveSectionCutPlane(project, {
    activeCabinetId: options.activeCabinetId,
    selectedCabinetIds: options.selectedCabinetIds,
    cutPlaneXMm: options.cutPlaneXMm,
  });
  const cabinet =
    project.cabinets.find((item) => item.id === plane.cabinetId) ??
    project.cabinets[0] ??
    null;

  const spanMm = 3200;
  const crossMm = 2400;
  const frame = computeSheetFrame({
    spanMm,
    crossMm,
    mode: options.mode ?? "print",
    bottomLanes: 24,
    sideLanes: 20,
    includeNotesArea: options.mode === "print",
  });
  const { svgWidth, svgHeight, ox, oy } = frame;
  const elements: string[] = [];
  const display = resolveDisplay(options);

  elements.push(sheetBackground(svgWidth, svgHeight, true));
  elements.push(
    ...embedResolvedPrintChrome({
      sheetId: "detail",
      svgWidth,
      svgHeight,
      project,
      options: { ...options, mode: options.mode ?? "print" },
      noteView: "side",
    }),
  );

  elements.push(
    text(
      24,
      48,
      cabinet
        ? `${plane.detailRef} · ${cabinet.name} · ${plane.label}`
        : `${plane.detailRef} · No cabinet selected`,
      `class="twod-annotation" font-size="8" text-anchor="start"`,
    ),
  );

  if (!cabinet) {
    elements.push(
      text(
        ox,
        oy,
        "Select a cabinet to generate detail.",
        `class="twod-wall-label" font-size="9" text-anchor="middle"`,
      ),
    );
    return {
      width: svgWidth,
      height: svgHeight,
      originX: ox,
      originY: oy,
      scale: SCALE / DETAIL_SCALE,
      svg: wrapTechnicalSvg(frame, "detail", elements),
    };
  }

  const fp = getFootprintDimensions(
    cabinet.config.dimensions,
    cabinet.placement.rotation,
  );
  const localScale = SCALE / DETAIL_SCALE;
  const elevW = (fp.width / SCALE) * DETAIL_SCALE;
  const elevH = (cabinet.config.dimensions.height / SCALE) * DETAIL_SCALE;
  const elevX = 48;
  const elevY = 70;
  const secW = (fp.depth / SCALE) * DETAIL_SCALE;
  const secH = elevH;
  const secX = elevX + elevW + 48;
  const secY = elevY;
  const detailOptions: TechnicalViewOptions = {
    ...options,
    activeCabinetId: cabinet.id,
    selectedCabinetIds: [cabinet.id],
    showElevationDetails: true,
    showCabinetTags: display.showCabinetTags,
  };

  // Elevation detail (zoomed)
  elements.push(
    text(
      elevX,
      elevY - 8,
      "ELEVATION DETAIL",
      `class="twod-wall-label" font-size="7" text-anchor="start"`,
    ),
    ...detailZoomFrame(elevX, elevY, elevW, elevH, plane.detailRef),
    ...cabinetElevationGraphics(
      cabinet,
      elevX,
      elevY,
      elevW,
      elevH,
      detailOptions,
      "",
      fp.width,
      0,
      localScale,
    ),
  );
  elements.push(
    text(
      secX,
      secY - 8,
      "SECTION DETAIL",
      `class="twod-wall-label" font-size="7" text-anchor="start"`,
    ),
    ...detailZoomFrame(secX, secY, secW, secH, `${plane.detailRef}S`),
    ...cabinetSectionCutGraphics(cabinet, secX, secY, localScale, {
      emphasize: true,
      showLabels: false,
    }),
  );

  elements.push(
    ...detailCalloutBubble(elevX + elevW * 0.7, elevY - 2, "1", plane.detailRef),
  );

  const construction = createCabinetConstruction(cabinet.config);
  const summary = getConstructionSummary(construction);
  const parts = getConstructionFlatParts(construction).slice(0, 8);
  const assembly = summarizeCabinetAssembly(cabinet.config);
  const assemblyIssues = validateCabinetAssembly(cabinet.config);
  const face = layoutCabinetElevationFace(cabinet.config);
  const materials = resolveCabinetMaterialSpec(cabinet.config.buildRules);
  let listY = elevY + elevH + 28;
  elements.push(
    text(
      elevX,
      listY,
      "INTERIOR CONSTRUCTION",
      `class="twod-wall-label" font-size="7" text-anchor="start"`,
    ),
  );
  listY += 12;
  elements.push(
    text(
      elevX,
      listY,
      summary,
      `class="twod-annotation" font-size="6.5" text-anchor="start"`,
    ),
  );
  listY += 14;
  elements.push(
    rect(elevX, listY - 10, 520, parts.length * 12 + 8, `class="twod-detail-schedule"`),
  );
  for (const part of parts) {
    elements.push(
      text(
        elevX + 6,
        listY,
        `${part.qty}× ${part.label}  ${Math.round(part.lengthMm)}×${Math.round(part.widthMm)}×${Math.round(part.thicknessMm)}`,
        `class="twod-schedule-td" font-size="6.5" text-anchor="start"`,
      ),
    );
    listY += 12;
  }

  const scheduleX = secX;
  let scheduleY = elevY + elevH + 28;
  elements.push(
    text(
      scheduleX,
      scheduleY,
      "ASSEMBLY SCHEDULE",
      `class="twod-wall-label" font-size="7" text-anchor="start"`,
    ),
  );
  scheduleY += 12;
  elements.push(
    text(
      scheduleX,
      scheduleY,
      `${assembly.openingCount} openings · ${assembly.doorCount} doors · ${assembly.drawerCount} drawers · ${assembly.shelfCount} shelves`,
      `class="twod-annotation" font-size="6.5" text-anchor="start"`,
    ),
  );
  scheduleY += 12;
  for (const [index, opening] of face.openings.entries()) {
    const content = opening.contentType.replace("-", " ").toUpperCase();
    elements.push(
      text(
        scheduleX,
        scheduleY,
        `OP-${index + 1}  ${opening.label}  ${content}  ${Math.round(opening.widthMm)}×${Math.round(opening.heightMm)}`,
        `class="twod-schedule-td" font-size="6.2" text-anchor="start"`,
      ),
    );
    scheduleY += 11;
  }
  scheduleY += 4;
  elements.push(
    text(
      scheduleX,
      scheduleY,
      `CARCASS ${materials.carcassMaterial.boardMaterialId.toUpperCase()} ${materials.carcassMaterial.thicknessMm}mm · DOOR ${materials.doorMaterial.boardMaterialId.toUpperCase()}`,
      `class="twod-annotation" font-size="6" text-anchor="start"`,
    ),
    text(
      scheduleX,
      scheduleY + 10,
      describeHardwareSpec(normalizeCabinetHardware(cabinet.config.type, cabinet.config.hardware)),
      `class="twod-annotation" font-size="6" text-anchor="start"`,
    ),
    text(
      scheduleX,
      scheduleY + 20,
      assemblyIssues.length === 0
        ? "BUILD CHECK: READY"
        : `BUILD CHECK: ${assemblyIssues.length} NOTICE${assemblyIssues.length === 1 ? "" : "S"}`,
      `class="twod-wall-label" font-size="6" text-anchor="start"`,
    ),
  );

  elements.push(
    line(elevX, listY + 8, elevX + 520, listY + 8, `class="twod-schedule-rule"`),
    text(
      elevX,
      listY + 20,
      `Ref ${plane.label} @ X=${Math.round(plane.xMm)} mm · Sheet A-501`,
      `class="twod-wall-label" font-size="6" text-anchor="start"`,
    ),
  );

  return {
    width: svgWidth,
    height: svgHeight,
    originX: ox,
    originY: oy,
    scale: localScale,
    svg: wrapTechnicalSvg(frame, "detail", elements),
  };
}
