import {
  cabinetTypeLabels,
  getFootprintDimensions,
  millimetresToMetres,
  usesRotatedFootprint,
  type CabinetInstance,
  type CabinetProject,
} from "./cabinetDimensions";
import type { CabinetRun, CountertopSegment } from "./cabinetLibrary";
import type { SnapGuide } from "./placementSnap";
import {
  collectElevationHorizontalChain,
  collectElevationVerticalChain,
  collectPlanDepthChain,
  collectPlanDimensionChain,
  collectRunDimensionChain,
  filterDimensionChain,
  resolveSelectedCabinets,
} from "./placementSnap";
import type { RoomConfig } from "./roomModel";
import {
  clampDraftingDisplay,
  clampProjectDrafting,
  draftingVisibleInView,
  formatApplianceTag,
  formatCabinetTag,
  formatOpeningTag,
  renderCabinetTagSvg,
  renderLeaderSvg,
  renderNoteSvg,
  type DraftingDisplayPreferences,
  type ProjectDrafting,
} from "./draftingAnnotations";
import { clampJobMeta, formatJobSubtitle, formatJobTitle } from "./jobMeta";

export type TechnicalViewKind = "top" | "front" | "side";

export type TechnicalViewResult = {
  width: number;
  height: number;
  svg: string;
  originX: number;
  originY: number;
  scale: number;
};

export type TechnicalViewOptions = {
  selectedCabinetIds?: string[];
  activeCabinetId?: string | null;
  mode?: "interactive" | "print";
  showGrid?: boolean;
  showDimensionChains?: boolean;
  showWallLabels?: boolean;
  showElevationDetails?: boolean;
  showCabinetTags?: boolean;
  showOpeningTags?: boolean;
  showApplianceTags?: boolean;
  dimMinSegmentMm?: number;
  title?: string;
  projectName?: string;
  sheetMeta?: string;
  snapGuides?: SnapGuide[];
  ghostPlacement?: {
    cabinetId: string;
    x: number;
    y: number;
    z: number;
  } | null;
  runs?: CabinetRun[];
  drafting?: ProjectDrafting;
};

export const TECHNICAL_VIEW_SCALE = 4;
export const TECHNICAL_VIEW_MARGIN = 56;

const SCALE = TECHNICAL_VIEW_SCALE;
const MARGIN = TECHNICAL_VIEW_MARGIN;

function cabinetClassName(
  cabinetId: string,
  options: TechnicalViewOptions,
  extra = "",
) {
  const selectedIds = options.selectedCabinetIds ?? [];
  const isActive = options.activeCabinetId === cabinetId;
  const isSelected = selectedIds.includes(cabinetId);
  const parts = ["twod-cabinet", extra];
  if (isActive) parts.push("twod-active");
  if (isSelected) parts.push("twod-selected");
  return parts.filter(Boolean).join(" ");
}

function cabinetPaint(
  cabinetId: string,
  baseFill: string,
  options: TechnicalViewOptions,
) {
  if (options.mode === "print") {
    return {
      fill: baseFill,
      stroke: "#334155",
      strokeWidth: "1.5",
    };
  }

  const selectedIds = options.selectedCabinetIds ?? [];
  const isActive = options.activeCabinetId === cabinetId;
  const isSelected = selectedIds.includes(cabinetId);

  if (isActive) {
    return {
      fill: "#93c5fd",
      stroke: "#1d4ed8",
      strokeWidth: "2.4",
    };
  }

  if (isSelected) {
    return {
      fill: "#bfdbfe",
      stroke: "#2563eb",
      strokeWidth: "2",
    };
  }

  return {
    fill: baseFill,
    stroke: "#57534e",
    strokeWidth: "1.35",
  };
}

function cabinetRectAttrs(
  cabinetId: string,
  baseFill: string,
  options: TechnicalViewOptions,
  extraClass = "",
) {
  const paint = cabinetPaint(cabinetId, baseFill, options);
  return `fill="${paint.fill}" stroke="${paint.stroke}" stroke-width="${paint.strokeWidth}" rx="1" data-cabinet-id="${cabinetId}" class="${cabinetClassName(cabinetId, options, extraClass)}" style="cursor:grab"`;
}

function escapeXml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function shortLabel(value: string, max = 16) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function rect(
  x: number,
  y: number,
  width: number,
  height: number,
  attrs: string,
) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" ${attrs} />`;
}

function line(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  attrs: string,
) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${attrs} />`;
}

function text(
  x: number,
  y: number,
  value: string,
  attrs: string,
) {
  return `<text x="${x}" y="${y}" ${attrs}>${escapeXml(value)}</text>`;
}

function dimensionLabel(valueMm: number) {
  return `${Math.round(valueMm)}`;
}

function dimTick(x: number, y: number, horizontal: boolean) {
  if (horizontal) {
    return line(x, y - 3, x, y + 3, `class="twod-dim" stroke="#334155" stroke-width="1"`);
  }
  return line(x - 3, y, x + 3, y, `class="twod-dim" stroke="#334155" stroke-width="1"`);
}

function dimensionChainHorizontal(
  positionsMm: number[],
  labels: string[],
  ox: number,
  y: number,
) {
  const elements: string[] = [];
  if (positionsMm.length < 2) return elements;

  const x0 = ox + positionsMm[0] / SCALE;
  const x1 = ox + positionsMm[positionsMm.length - 1] / SCALE;
  elements.push(line(x0, y, x1, y, `class="twod-dim" stroke="#334155" stroke-width="1"`));

  for (let index = 0; index < positionsMm.length; index += 1) {
    const x = ox + positionsMm[index] / SCALE;
    elements.push(dimTick(x, y, true));
    if (index < labels.length) {
      const mid = ox + (positionsMm[index] + positionsMm[index + 1]) / 2 / SCALE;
      elements.push(
        text(
          mid,
          y - 4,
          `${labels[index]} mm`,
          `class="twod-annotation" font-size="8" fill="#1e293b" text-anchor="middle" pointer-events="none"`,
        ),
      );
    }
  }

  return elements;
}

/** positionsMm measured from floor upward */
function dimensionChainVertical(
  positionsMm: number[],
  labels: string[],
  x: number,
  oy: number,
  roomHeightMm: number,
) {
  const elements: string[] = [];
  if (positionsMm.length < 2) return elements;

  const floorY = oy + roomHeightMm / SCALE / 2;
  const toSvgY = (mmFromFloor: number) => floorY - mmFromFloor / SCALE;

  const y0 = toSvgY(positionsMm[0]);
  const y1 = toSvgY(positionsMm[positionsMm.length - 1]);
  elements.push(line(x, y0, x, y1, `class="twod-dim" stroke="#334155" stroke-width="1"`));

  for (let index = 0; index < positionsMm.length; index += 1) {
    const y = toSvgY(positionsMm[index]);
    elements.push(dimTick(x, y, false));
    if (index < labels.length) {
      const mid = (toSvgY(positionsMm[index]) + toSvgY(positionsMm[index + 1])) / 2;
      elements.push(
        text(
          x - 4,
          mid + 3,
          `${labels[index]} mm`,
          `class="twod-annotation" font-size="8" fill="#1e293b" text-anchor="end" pointer-events="none"`,
        ),
      );
    }
  }

  return elements;
}

function selectedPlanDimensions(
  cabinets: CabinetInstance[],
  ox: number,
  oy: number,
  options: TechnicalViewOptions,
) {
  const selected = resolveSelectedCabinets(
    cabinets,
    options.selectedCabinetIds,
    options.activeCabinetId,
  );
  const elements: string[] = [];

  for (const cabinet of selected) {
    const fp = getFootprintDimensions(cabinet.config.dimensions, cabinet.placement.rotation);
    const ghost =
      options.ghostPlacement?.cabinetId === cabinet.id ? options.ghostPlacement : null;
    const cx = ox + (ghost?.x ?? cabinet.placement.x) / SCALE;
    const cy = oy + (ghost?.z ?? cabinet.placement.z) / SCALE;
    const bw = fp.width / SCALE;
    const bd = fp.depth / SCALE;

    const widthY = cy + bd / 2 + 18;
    elements.push(line(cx - bw / 2, widthY, cx + bw / 2, widthY, `class="twod-dim twod-dim-selected" stroke="#1d4ed8" stroke-width="1.1"`));
    elements.push(dimTick(cx - bw / 2, widthY, true));
    elements.push(dimTick(cx + bw / 2, widthY, true));
    elements.push(
      text(
        cx,
        widthY - 4,
        `${dimensionLabel(fp.width)} mm`,
        `class="twod-annotation twod-dim-selected" font-size="8" font-weight="700" fill="#1d4ed8" text-anchor="middle" pointer-events="none"`,
      ),
    );

    const depthX = cx + bw / 2 + 16;
    elements.push(line(depthX, cy - bd / 2, depthX, cy + bd / 2, `class="twod-dim twod-dim-selected" stroke="#1d4ed8" stroke-width="1.1"`));
    elements.push(dimTick(depthX, cy - bd / 2, false));
    elements.push(dimTick(depthX, cy + bd / 2, false));
    elements.push(
      text(
        depthX + 4,
        cy + 3,
        `${dimensionLabel(fp.depth)} mm`,
        `class="twod-annotation twod-dim-selected" font-size="8" font-weight="700" fill="#1d4ed8" text-anchor="start" pointer-events="none"`,
      ),
    );
  }

  return elements;
}

function selectedElevationDimensions(
  cabinets: CabinetInstance[],
  roomHeightMm: number,
  ox: number,
  oy: number,
  options: TechnicalViewOptions,
  axis: "x" | "z",
) {
  const selected = resolveSelectedCabinets(
    cabinets,
    options.selectedCabinetIds,
    options.activeCabinetId,
  );
  const elements: string[] = [];
  const floorY = oy + roomHeightMm / SCALE / 2;

  for (const cabinet of selected) {
    const fp = getFootprintDimensions(cabinet.config.dimensions, cabinet.placement.rotation);
    const span = axis === "x" ? fp.width : fp.depth;
    const ghost =
      options.ghostPlacement?.cabinetId === cabinet.id ? options.ghostPlacement : null;
    const center = axis === "x"
      ? (ghost?.x ?? cabinet.placement.x)
      : (ghost?.z ?? cabinet.placement.z);
    const yMm = ghost?.y ?? cabinet.placement.y;
    const height = cabinet.config.dimensions.height;
    const x = ox + center / SCALE;
    const topY = floorY - (yMm + height) / SCALE;
    const bottomY = floorY - yMm / SCALE;
    const left = x - span / SCALE / 2;
    const right = x + span / SCALE / 2;

    // Height marker to the right of the cabinet
    const heightX = right + 14;
    elements.push(line(heightX, topY, heightX, bottomY, `class="twod-dim twod-dim-selected" stroke="#1d4ed8" stroke-width="1.1"`));
    elements.push(dimTick(heightX, topY, false));
    elements.push(dimTick(heightX, bottomY, false));
    elements.push(
      text(
        heightX + 4,
        (topY + bottomY) / 2 + 3,
        `${dimensionLabel(height)} mm`,
        `class="twod-annotation twod-dim-selected" font-size="8" font-weight="700" fill="#1d4ed8" text-anchor="start" pointer-events="none"`,
      ),
    );

    // Width/depth marker above
    const widthY = topY - 12;
    elements.push(line(left, widthY, right, widthY, `class="twod-dim twod-dim-selected" stroke="#1d4ed8" stroke-width="1.1"`));
    elements.push(dimTick(left, widthY, true));
    elements.push(dimTick(right, widthY, true));
    elements.push(
      text(
        x,
        widthY - 3,
        `${dimensionLabel(span)} mm`,
        `class="twod-annotation twod-dim-selected" font-size="8" font-weight="700" fill="#1d4ed8" text-anchor="middle" pointer-events="none"`,
      ),
    );

    // Floor clearance when wall-mounted
    if (yMm > 0) {
      const clearX = left - 12;
      elements.push(line(clearX, bottomY, clearX, floorY, `class="twod-dim twod-dim-selected" stroke="#0369a1" stroke-width="1" stroke-dasharray="3 2"`));
      elements.push(
        text(
          clearX - 3,
          (bottomY + floorY) / 2 + 3,
          `${dimensionLabel(yMm)} mm`,
          `class="twod-annotation twod-dim-selected" font-size="7.5" fill="#0369a1" text-anchor="end" pointer-events="none"`,
        ),
      );
    }
  }

  return elements;
}

function titleBlock(
  svgWidth: number,
  title: string,
  projectName: string,
  viewLabel: string,
  scaleText: string,
  sheetMeta = "",
) {
  const blockH = 32;
  const y = 6;
  return [
    rect(8, y, svgWidth - 16, blockH, `class="twod-titleblock" fill="#ffffff" stroke="#334155" stroke-width="1.25"`),
    line(svgWidth - 240, y, svgWidth - 240, y + blockH, `class="twod-titleblock" stroke="#334155" stroke-width="1"`),
    line(svgWidth - 130, y, svgWidth - 130, y + blockH, `class="twod-titleblock" stroke="#334155" stroke-width="1"`),
    text(14, y + 12, shortLabel(projectName || "Cabinet Project", 32), `class="twod-titleblock-text" font-size="10" font-weight="700" fill="#0f172a"`),
    text(14, y + 24, shortLabel(title + (sheetMeta ? ` · ${sheetMeta}` : ""), 42), `class="twod-titleblock-text" font-size="8" fill="#475569"`),
    text(svgWidth - 235, y + 12, viewLabel, `class="twod-titleblock-text" font-size="8" font-weight="700" fill="#0f172a"`),
    text(svgWidth - 235, y + 24, scaleText, `class="twod-titleblock-text" font-size="8" fill="#475569"`),
    text(svgWidth - 125, y + 12, "TECHNICAL SHEET", `class="twod-titleblock-text" font-size="8" font-weight="700" fill="#0f172a"`),
    text(svgWidth - 125, y + 24, new Date().toLocaleDateString(), `class="twod-titleblock-text" font-size="8" fill="#475569"`),
  ];
}

function resolveDisplay(options: TechnicalViewOptions): DraftingDisplayPreferences {
  return clampDraftingDisplay({
    showCabinetTags: options.showCabinetTags,
    showOpeningTags: options.showOpeningTags,
    showApplianceTags: options.showApplianceTags,
    showDimensionChains: options.showDimensionChains,
    showWallLabels: options.showWallLabels,
    dimMinSegmentMm: options.dimMinSegmentMm,
  });
}

function draftingLayer(
  drafting: ProjectDrafting | undefined,
  view: TechnicalViewKind,
  mapPoint: (point: { x: number; y: number; z: number }) => { x: number; y: number },
) {
  const safe = clampProjectDrafting(drafting);
  const elements: string[] = [];
  for (const note of safe.notes) {
    if (!draftingVisibleInView(note.view, view)) continue;
    const point = mapPoint(note.anchor);
    elements.push(...renderNoteSvg(point.x, point.y, note.text));
  }
  for (const leader of safe.leaders) {
    if (!draftingVisibleInView(leader.view, view)) continue;
    const target = mapPoint(leader.target);
    const label = mapPoint(leader.label);
    elements.push(...renderLeaderSvg(target.x, target.y, label.x, label.y, leader.text));
  }
  return elements;
}

function cabinetIndexMap(project: CabinetProject) {
  return new Map(project.cabinets.map((cabinet, index) => [cabinet.id, index]));
}

function gridLines(
  ox: number,
  oy: number,
  roomW: number,
  roomD: number,
  stepMm: number,
) {
  const elements: string[] = [];
  const left = ox - roomW / SCALE / 2;
  const right = ox + roomW / SCALE / 2;
  const top = oy - roomD / SCALE / 2;
  const bottom = oy + roomD / SCALE / 2;

  for (let x = -roomW / 2; x <= roomW / 2; x += stepMm) {
    const sx = ox + x / SCALE;
    elements.push(line(sx, top, sx, bottom, `class="twod-grid" stroke="#e2e8f0" stroke-width="0.55"`));
  }
  for (let z = -roomD / 2; z <= roomD / 2; z += stepMm) {
    const sz = oy + z / SCALE;
    elements.push(line(left, sz, right, sz, `class="twod-grid" stroke="#e2e8f0" stroke-width="0.55"`));
  }
  return elements;
}

function elevationGrid(
  ox: number,
  oy: number,
  roomSpanMm: number,
  roomHeightMm: number,
  stepMm: number,
) {
  const elements: string[] = [];
  const left = ox - roomSpanMm / SCALE / 2;
  const right = ox + roomSpanMm / SCALE / 2;
  const top = oy - roomHeightMm / SCALE / 2;
  const bottom = oy + roomHeightMm / SCALE / 2;

  for (let x = -roomSpanMm / 2; x <= roomSpanMm / 2; x += stepMm) {
    elements.push(line(ox + x / SCALE, top, ox + x / SCALE, bottom, `class="twod-grid" stroke="#e8edf2" stroke-width="0.5"`));
  }
  for (let y = 0; y <= roomHeightMm; y += stepMm) {
    const sy = oy + roomHeightMm / SCALE / 2 - y / SCALE;
    elements.push(line(left, sy, right, sy, `class="twod-grid" stroke="#e8edf2" stroke-width="0.5"`));
  }
  return elements;
}

function snapGuideLines(
  guides: SnapGuide[],
  ox: number,
  oy: number,
  roomSpanMm: number,
  roomCrossMm: number,
  view: TechnicalViewKind,
) {
  const elements: string[] = [];
  const left = ox - roomSpanMm / SCALE / 2;
  const right = ox + roomSpanMm / SCALE / 2;
  const top = oy - roomCrossMm / SCALE / 2;
  const bottom = oy + roomCrossMm / SCALE / 2;

  for (const guide of guides) {
    const color =
      guide.kind === "wall"
        ? "#ea580c"
        : guide.kind === "adjacency"
          ? "#0d9488"
          : guide.kind === "align"
            ? "#2563eb"
            : "#94a3b8";
    const cls = `twod-guide twod-guide-${guide.kind}`;

    if (view === "top") {
      if (guide.axis === "x") {
        const x = ox + guide.positionMm / SCALE;
        elements.push(line(x, top, x, bottom, `class="${cls}" stroke="${color}" stroke-width="1.25" stroke-dasharray="5 3"`));
      } else if (guide.axis === "z") {
        const z = oy + guide.positionMm / SCALE;
        elements.push(line(left, z, right, z, `class="${cls}" stroke="${color}" stroke-width="1.25" stroke-dasharray="5 3"`));
      }
      continue;
    }

    // Elevations: horizontal axis is x (front) or z (side); vertical is y from floor
    if (guide.axis === "y") {
      const y = oy + roomCrossMm / SCALE / 2 - guide.positionMm / SCALE;
      elements.push(line(left, y, right, y, `class="${cls}" stroke="${color}" stroke-width="1.25" stroke-dasharray="5 3"`));
    } else if (guide.axis === "x" || guide.axis === "z") {
      const x = ox + guide.positionMm / SCALE;
      elements.push(line(x, top, x, bottom, `class="${cls}" stroke="${color}" stroke-width="1.25" stroke-dasharray="5 3"`));
    }
  }
  return elements;
}

function cabinetPlanGraphics(
  cabinet: CabinetInstance,
  ox: number,
  oy: number,
  options: TechnicalViewOptions,
  cabinetIndex = 0,
) {
  const elements: string[] = [];
  const display = resolveDisplay(options);
  const fp = getFootprintDimensions(cabinet.config.dimensions, cabinet.placement.rotation);
  const ghost =
    options.ghostPlacement?.cabinetId === cabinet.id ? options.ghostPlacement : null;
  const cx = ox + (ghost?.x ?? cabinet.placement.x) / SCALE;
  const cy = oy + (ghost?.z ?? cabinet.placement.z) / SCALE;
  const bw = fp.width / SCALE;
  const bd = fp.depth / SCALE;
  const wallMounted = cabinet.placement.attachment !== "floor";
  const fill = wallMounted
    ? "#d6c3a4"
    : usesRotatedFootprint(cabinet.placement.rotation)
      ? "#d0b48a"
      : "#c4a574";

  elements.push(rect(cx - bw / 2, cy - bd / 2, bw, bd, cabinetRectAttrs(cabinet.id, fill, options, wallMounted ? "twod-cabinet-wall" : "twod-cabinet-floor")));

  if (cabinet.config.toeKickHeight > 0 && cabinet.config.toeKickInset > 0) {
    const inset = cabinet.config.toeKickInset / SCALE;
    elements.push(
      rect(
        cx - bw / 2 + inset,
        cy + bd / 2 - inset,
        Math.max(2, bw - inset * 2),
        Math.max(1, inset),
        `class="twod-cabinet-opening" fill="none" stroke="#78716c" stroke-width="0.75" stroke-dasharray="2 2" pointer-events="none"`,
      ),
    );
  }

  elements.push(
    line(
      cx - bw / 2,
      cy - bd / 2,
      cx + bw / 2,
      cy - bd / 2,
      `class="twod-cabinet-front" stroke="#292524" stroke-width="2.25" pointer-events="none"`,
    ),
  );

  if (display.showCabinetTags) {
    elements.push(...renderCabinetTagSvg(cx, cy - bd / 2 - 10, formatCabinetTag(cabinetIndex)));
  }

  const typeLabel = cabinetTypeLabels[cabinet.config.type] ?? cabinet.config.type;
  elements.push(
    text(
      cx,
      cy - 2,
      shortLabel(cabinet.name, 14),
      `class="twod-label" font-size="9" font-weight="700" fill="#1c1917" text-anchor="middle" pointer-events="none"`,
    ),
  );
  elements.push(
    text(
      cx,
      cy + 9,
      shortLabel(typeLabel, 14),
      `class="twod-annotation" font-size="7.5" fill="#57534e" text-anchor="middle" pointer-events="none"`,
    ),
  );

  if (display.showApplianceTags) {
    const appliance = formatApplianceTag(cabinet.config.type);
    if (appliance) {
      elements.push(
        text(
          cx,
          cy + 20,
          appliance,
          `class="twod-tag twod-tag-appliance" font-size="7" font-weight="700" fill="#9a3412" text-anchor="middle" pointer-events="none"`,
        ),
      );
    }
  }

  elements.push(
    text(
      cx,
      cy + bd / 2 + 11,
      `${dimensionLabel(fp.width)}×${dimensionLabel(fp.depth)}`,
      `class="twod-annotation" font-size="7.5" fill="#44403c" text-anchor="middle" pointer-events="none"`,
    ),
  );

  return elements;
}

function cabinetElevationGraphics(
  cabinet: CabinetInstance,
  x: number,
  y: number,
  width: number,
  height: number,
  options: TechnicalViewOptions,
  fill: string,
  spanLabelMm: number,
  cabinetIndex = 0,
) {
  const elements: string[] = [];
  const display = resolveDisplay(options);
  const wallMounted = cabinet.placement.attachment !== "floor";
  elements.push(
    rect(
      x,
      y,
      width,
      height,
      cabinetRectAttrs(cabinet.id, fill, options, wallMounted ? "twod-cabinet-wall" : "twod-cabinet-floor"),
    ),
  );

  if (display.showCabinetTags) {
    elements.push(
      ...renderCabinetTagSvg(x + width / 2, y - 8, formatCabinetTag(cabinetIndex)),
    );
  }

  if (options.showElevationDetails !== false) {
    const toe = cabinet.config.toeKickHeight > 0 ? cabinet.config.toeKickHeight / SCALE : 0;
    if (toe > 0) {
      elements.push(
        line(x, y + height - toe, x + width, y + height - toe, `class="twod-cabinet-opening" stroke="#57534e" stroke-width="1" pointer-events="none"`),
      );
    }

    if (cabinet.config.hasDoors) {
      const doorGap = 2;
      const doorCount = cabinet.config.dimensions.width < 600 ? 1 : 2;
      const doorW = (width - doorGap * (doorCount + 1)) / doorCount;
      for (let index = 0; index < doorCount; index += 1) {
        const dx = x + doorGap + index * (doorW + doorGap);
        const dy = y + 3;
        const dh = height - toe - 6;
        elements.push(
          rect(dx, dy, doorW, dh, `class="twod-cabinet-opening" fill="none" stroke="#44403c" stroke-width="1.05" pointer-events="none"`),
        );
        const handleX = index === 0 && doorCount === 2 ? dx + doorW - 4 : dx + 4;
        elements.push(
          line(handleX, dy + dh * 0.45, handleX, dy + dh * 0.55, `class="twod-cabinet-opening" stroke="#292524" stroke-width="1.5" pointer-events="none"`),
        );
      }
    }

    if ((cabinet.config.drawerCount ?? 0) > 0) {
      const count = cabinet.config.drawerCount ?? 0;
      const usable = height - toe - 6;
      const drawerH = usable / count;
      for (let index = 0; index < count; index += 1) {
        const dy = y + 3 + index * drawerH;
        elements.push(
          rect(x + 3, dy, width - 6, drawerH - 2, `class="twod-cabinet-opening" fill="none" stroke="#44403c" stroke-width="1.05" pointer-events="none"`),
        );
        elements.push(
          line(x + width / 2 - 8, dy + drawerH / 2, x + width / 2 + 8, dy + drawerH / 2, `class="twod-cabinet-opening" stroke="#292524" stroke-width="1.4" pointer-events="none"`),
        );
      }
    }

    if (cabinet.config.shelfCount > 0 && !cabinet.config.hasDoors) {
      const usable = height - toe - 8;
      for (let index = 1; index <= cabinet.config.shelfCount; index += 1) {
        const sy = y + 4 + (usable * index) / (cabinet.config.shelfCount + 1);
        elements.push(line(x + 3, sy, x + width - 3, sy, `class="twod-cabinet-opening" stroke="#78716c" stroke-width="0.9" stroke-dasharray="3 2" pointer-events="none"`));
      }
    }
  }

  const typeLabel = cabinetTypeLabels[cabinet.config.type] ?? cabinet.config.type;
  elements.push(
    text(
      x + width / 2,
      y - 14,
      shortLabel(cabinet.name, 16),
      `class="twod-label" font-size="8.5" font-weight="700" fill="#1c1917" text-anchor="middle" pointer-events="none"`,
    ),
  );
  elements.push(
    text(
      x + width / 2,
      y - 4,
      shortLabel(typeLabel, 14),
      `class="twod-annotation" font-size="7" fill="#57534e" text-anchor="middle" pointer-events="none"`,
    ),
  );
  elements.push(
    text(
      x + width / 2,
      y + height + 11,
      `${dimensionLabel(spanLabelMm)} mm`,
      `class="twod-annotation" font-size="7.5" fill="#44403c" text-anchor="middle" pointer-events="none"`,
    ),
  );

  return elements;
}

export function planSvgToWorldMm(
  svgX: number,
  svgY: number,
  originX: number,
  originY: number,
  scale: number = SCALE,
) {
  return {
    x: (svgX - originX) * scale,
    z: (svgY - originY) * scale,
  };
}

export function elevationFrontSvgToWorldMm(
  svgX: number,
  svgY: number,
  originX: number,
  originY: number,
  roomHeightMm: number,
  scale: number = SCALE,
) {
  return {
    x: (svgX - originX) * scale,
    y: roomHeightMm / 2 - (svgY - originY) * scale,
  };
}

export function elevationSideSvgToWorldMm(
  svgX: number,
  svgY: number,
  originX: number,
  originY: number,
  roomHeightMm: number,
  scale: number = SCALE,
) {
  return {
    z: (svgX - originX) * scale,
    y: roomHeightMm / 2 - (svgY - originY) * scale,
  };
}

function topView(
  project: CabinetProject,
  room: RoomConfig,
  countertops: CountertopSegment[] = [],
  options: TechnicalViewOptions = {},
): TechnicalViewResult {
  const rw = room.dimensions.widthMm;
  const rd = room.dimensions.depthMm;
  const svgWidth = rw / SCALE + MARGIN * 2;
  const svgHeight = rd / SCALE + MARGIN * 2 + (options.mode === "print" ? 20 : 0) + 24;
  const ox = MARGIN + rw / SCALE / 2;
  const oy = MARGIN + rd / SCALE / 2 + (options.mode === "print" ? 18 : 0);
  const elements: string[] = [];
  const showChains = options.showDimensionChains !== false;
  const showWallLabels = options.showWallLabels !== false;
  const display = resolveDisplay(options);
  const indexMap = cabinetIndexMap(project);
  const sheetMeta =
    options.sheetMeta ??
    (() => {
      const job = clampJobMeta(project.job);
      return `${formatJobTitle(job)} · ${formatJobSubtitle(job)}`;
    })();

  elements.push(rect(0, 0, svgWidth, svgHeight, `fill="${options.mode === "print" ? "#ffffff" : "#f1f5f9"}" class="twod-sheet"`));

  if (options.mode === "print") {
    elements.push(
      ...titleBlock(
        svgWidth,
        options.title ?? "Room Plan",
        options.projectName ?? "Cabinet Project",
        "PLAN",
        `1:${SCALE * 25}`,
        sheetMeta,
      ),
    );
  }

  if (options.showGrid) {
    elements.push(...gridLines(ox, oy, rw, rd, 500));
  }

  elements.push(rect(
    ox - rw / SCALE / 2,
    oy - rd / SCALE / 2,
    rw / SCALE,
    rd / SCALE,
    `class="twod-wall twod-wall-outline" fill="#f8fafc" stroke="#0f172a" stroke-width="2.25"`,
  ));

  if (showWallLabels && display.showWallLabels) {
    elements.push(text(ox, oy - rd / SCALE / 2 - 8, "BACK WALL", `class="twod-wall-label" font-size="8" font-weight="700" fill="#64748b" text-anchor="middle"`));
    elements.push(text(ox, oy + rd / SCALE / 2 + 14, "FRONT", `class="twod-wall-label" font-size="8" font-weight="700" fill="#64748b" text-anchor="middle"`));
    elements.push(text(ox - rw / SCALE / 2 - 10, oy, "LEFT", `class="twod-wall-label" font-size="8" font-weight="700" fill="#64748b" text-anchor="middle" transform="rotate(-90 ${ox - rw / SCALE / 2 - 10} ${oy})"`));
    elements.push(text(ox + rw / SCALE / 2 + 12, oy, "RIGHT", `class="twod-wall-label" font-size="8" font-weight="700" fill="#64748b" text-anchor="middle" transform="rotate(90 ${ox + rw / SCALE / 2 + 12} ${oy})"`));
  }

  for (const cabinet of project.cabinets) {
    elements.push(
      ...cabinetPlanGraphics(cabinet, ox, oy, options, indexMap.get(cabinet.id) ?? 0),
    );
  }

  for (const countertop of countertops) {
    const cx = ox + countertop.positionX / SCALE;
    const cz = oy + countertop.positionZ / SCALE;
    elements.push(rect(
      cx - countertop.widthMm / SCALE / 2,
      cz - countertop.depthMm / SCALE / 2,
      countertop.widthMm / SCALE,
      countertop.depthMm / SCALE,
      `class="twod-countertop" fill="none" stroke="#4d7c0f" stroke-width="1.5" stroke-dasharray="5 3"`,
    ));
  }

  for (const [doorIndex, door] of room.doors.entries()) {
    const dx = door.side === "back-wall" ? ox + door.positionMm / SCALE
      : door.side === "left-wall" ? ox - rw / SCALE / 2 - 6 : ox + rw / SCALE / 2 + 2;
    const dy = door.side === "back-wall" ? oy - rd / SCALE / 2 - 6 : oy + door.positionMm / SCALE;
    const dw = door.side === "back-wall" ? door.widthMm / SCALE : 4;
    const dh = door.side === "back-wall" ? 4 : door.widthMm / SCALE;
    elements.push(rect(dx - dw / 2, dy - dh / 2, dw, dh, `class="twod-opening" fill="#dbeafe" stroke="#1d4ed8" stroke-width="1.35"`));
    if (display.showOpeningTags) {
      elements.push(
        text(
          dx,
          dy - 8,
          formatOpeningTag("door", doorIndex, door.widthMm, door.heightMm),
          `class="twod-tag twod-tag-opening" font-size="7" font-weight="700" fill="#1d4ed8" text-anchor="middle"`,
        ),
      );
    }
  }

  for (const [winIndex, win] of room.windows.entries()) {
    const wx = win.side === "back-wall" ? ox + win.positionMm / SCALE
      : win.side === "left-wall" ? ox - rw / SCALE / 2 - 6 : ox + rw / SCALE / 2 + 2;
    const wy = win.side === "back-wall" ? oy - rd / SCALE / 2 - 6 : oy + win.positionMm / SCALE;
    const ww = win.side === "back-wall" ? win.widthMm / SCALE : 4;
    const wh = win.side === "back-wall" ? 4 : win.widthMm / SCALE;
    elements.push(rect(wx - ww / 2, wy - wh / 2, ww, wh, `class="twod-opening" fill="#ccfbf1" stroke="#0f766e" stroke-width="1.35"`));
    if (display.showOpeningTags) {
      elements.push(
        text(
          wx,
          wy - 8,
          formatOpeningTag("window", winIndex, win.widthMm, win.heightMm, win.sillHeightMm),
          `class="twod-tag twod-tag-opening" font-size="7" font-weight="700" fill="#0f766e" text-anchor="middle"`,
        ),
      );
    }
  }

  if (options.snapGuides?.length) {
    elements.push(...snapGuideLines(options.snapGuides, ox, oy, rw, rd, "top"));
  }

  elements.push(...selectedPlanDimensions(project.cabinets, ox, oy, options));

  // Overall room dimensions
  const topDimY = oy - rd / SCALE / 2 - 24;
  elements.push(line(ox - rw / SCALE / 2, topDimY, ox + rw / SCALE / 2, topDimY, `class="twod-dim twod-dim-overall" stroke="#0f172a" stroke-width="1.35"`));
  elements.push(dimTick(ox - rw / SCALE / 2, topDimY, true));
  elements.push(dimTick(ox + rw / SCALE / 2, topDimY, true));
  elements.push(text(ox, topDimY - 4, `${dimensionLabel(rw)} mm`, `class="twod-annotation twod-dim-overall" font-size="9" font-weight="700" fill="#0f172a" text-anchor="middle"`));

  const leftDimX = ox - rw / SCALE / 2 - 24;
  elements.push(line(leftDimX, oy - rd / SCALE / 2, leftDimX, oy + rd / SCALE / 2, `class="twod-dim twod-dim-overall" stroke="#0f172a" stroke-width="1.35"`));
  elements.push(dimTick(leftDimX, oy - rd / SCALE / 2, false));
  elements.push(dimTick(leftDimX, oy + rd / SCALE / 2, false));
  elements.push(text(leftDimX - 4, oy, `${dimensionLabel(rd)} mm`, `class="twod-annotation twod-dim-overall" font-size="9" font-weight="700" fill="#0f172a" text-anchor="end"`));

  if (showChains && display.showDimensionChains && project.cabinets.length > 0) {
    const minSeg = display.dimMinSegmentMm;
    const widthChain = filterDimensionChain(collectPlanDimensionChain(project.cabinets, rw), minSeg);
    elements.push(...dimensionChainHorizontal(widthChain.positions, widthChain.labels, ox, oy + rd / SCALE / 2 + 28));

    const depthChain = filterDimensionChain(collectPlanDepthChain(project.cabinets, rd), minSeg);
    const depthChainX = ox + rw / SCALE / 2 + 28;
    const floorish = oy;
    if (depthChain.positions.length >= 2) {
      const z0 = floorish + depthChain.positions[0] / SCALE;
      const z1 = floorish + depthChain.positions[depthChain.positions.length - 1] / SCALE;
      elements.push(line(depthChainX, z0, depthChainX, z1, `class="twod-dim twod-dim-chain" stroke="#334155" stroke-width="1"`));
      for (let index = 0; index < depthChain.positions.length; index += 1) {
        const z = floorish + depthChain.positions[index] / SCALE;
        elements.push(dimTick(depthChainX, z, false));
        if (index < depthChain.labels.length) {
          const mid = floorish + (depthChain.positions[index] + depthChain.positions[index + 1]) / 2 / SCALE;
          elements.push(
            text(
              depthChainX + 4,
              mid + 3,
              `${depthChain.labels[index]} mm`,
              `class="twod-annotation twod-dim-chain" font-size="7.5" fill="#1e293b" text-anchor="start" pointer-events="none"`,
            ),
          );
        }
      }
    }

    let runOffset = 0;
    for (const run of options.runs ?? []) {
      if (run.cabinetIds.length < 2) continue;
      const chain = collectRunDimensionChain(run, project.cabinets);
      if (!chain) continue;
      const filtered = filterDimensionChain(chain, minSeg);
      if (run.axis === "x") {
        elements.push(
          ...dimensionChainHorizontal(
            filtered.positions,
            filtered.labels,
            ox,
            oy + rd / SCALE / 2 + 44 + runOffset,
          ),
        );
        runOffset += 14;
      } else {
        const runX = ox + rw / SCALE / 2 + 44 + runOffset;
        if (filtered.positions.length >= 2) {
          const z0 = floorish + filtered.positions[0] / SCALE;
          const z1 = floorish + filtered.positions[filtered.positions.length - 1] / SCALE;
          elements.push(line(runX, z0, runX, z1, `class="twod-dim twod-dim-run" stroke="#475569" stroke-width="1"`));
          for (let index = 0; index < filtered.positions.length; index += 1) {
            const z = floorish + filtered.positions[index] / SCALE;
            elements.push(dimTick(runX, z, false));
            if (index < filtered.labels.length) {
              const mid =
                floorish + (filtered.positions[index] + filtered.positions[index + 1]) / 2 / SCALE;
              elements.push(
                text(
                  runX + 4,
                  mid + 3,
                  `${filtered.labels[index]} mm`,
                  `class="twod-annotation twod-dim-run" font-size="7" fill="#334155" text-anchor="start" pointer-events="none"`,
                ),
              );
            }
          }
          runOffset += 14;
        }
      }
    }
  }

  elements.push(
    ...draftingLayer(options.drafting ?? project.drafting, "top", (point) => ({
      x: ox + point.x / SCALE,
      y: oy + point.z / SCALE,
    })),
  );

  return {
    width: svgWidth,
    height: svgHeight,
    originX: ox,
    originY: oy,
    scale: SCALE,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" class="twod-draft">${elements.join("")}</svg>`,
  };
}

function frontView(
  project: CabinetProject,
  room: RoomConfig,
  options: TechnicalViewOptions = {},
): TechnicalViewResult {
  const rw = room.dimensions.widthMm;
  const rh = room.dimensions.heightMm;
  const svgWidth = rw / SCALE + MARGIN * 2 + 20;
  const svgHeight = rh / SCALE + MARGIN * 2 + (options.mode === "print" ? 20 : 0) + 20;
  const ox = MARGIN + rw / SCALE / 2;
  const oy = MARGIN + rh / SCALE / 2 + (options.mode === "print" ? 18 : 0);
  const elements: string[] = [];
  const display = resolveDisplay(options);
  const indexMap = cabinetIndexMap(project);
  const sheetMeta =
    options.sheetMeta ??
    (() => {
      const job = clampJobMeta(project.job);
      return `${formatJobTitle(job)} · ${formatJobSubtitle(job)}`;
    })();

  elements.push(rect(0, 0, svgWidth, svgHeight, `fill="${options.mode === "print" ? "#ffffff" : "#f1f5f9"}" class="twod-sheet"`));
  if (options.mode === "print") {
    elements.push(
      ...titleBlock(
        svgWidth,
        options.title ?? "Front Elevation",
        options.projectName ?? "Cabinet Project",
        "FRONT ELEV.",
        `1:${SCALE * 25}`,
        sheetMeta,
      ),
    );
  }

  if (options.showGrid) {
    elements.push(...elevationGrid(ox, oy, rw, rh, 500));
  }

  elements.push(rect(
    ox - rw / SCALE / 2,
    oy - rh / SCALE / 2,
    rw / SCALE,
    rh / SCALE,
    `class="twod-wall twod-wall-outline" fill="#f8fafc" stroke="#0f172a" stroke-width="2.25"`,
  ));

  // Floor line emphasis
  elements.push(line(
    ox - rw / SCALE / 2,
    oy + rh / SCALE / 2,
    ox + rw / SCALE / 2,
    oy + rh / SCALE / 2,
    `class="twod-wall twod-floor-line" stroke="#0f172a" stroke-width="2.4"`,
  ));

  if (display.showWallLabels) {
    elements.push(text(ox, oy - rh / SCALE / 2 - 8, "BACK WALL ELEVATION", `class="twod-wall-label" font-size="8" font-weight="700" fill="#64748b" text-anchor="middle"`));
  }

  for (const [winIndex, window] of room.windows.filter((item) => item.side === "back-wall").entries()) {
    const x = ox + window.positionMm / SCALE - window.widthMm / SCALE / 2;
    const y = oy + rh / SCALE / 2 - (window.sillHeightMm + window.heightMm) / SCALE;
    elements.push(rect(x, y, window.widthMm / SCALE, window.heightMm / SCALE, `class="twod-opening" fill="#dbeafe" stroke="#1d4ed8" stroke-width="1.45"`));
    if (display.showOpeningTags) {
      elements.push(
        text(
          x + window.widthMm / SCALE / 2,
          y - 4,
          formatOpeningTag("window", winIndex, window.widthMm, window.heightMm, window.sillHeightMm),
          `class="twod-tag twod-tag-opening" font-size="7" font-weight="700" fill="#1d4ed8" text-anchor="middle"`,
        ),
      );
    }
  }

  for (const [doorIndex, door] of room.doors.filter((item) => item.side === "back-wall").entries()) {
    const x = ox + door.positionMm / SCALE - door.widthMm / SCALE / 2;
    const y = oy + rh / SCALE / 2 - door.heightMm / SCALE;
    elements.push(rect(x, y, door.widthMm / SCALE, door.heightMm / SCALE, `class="twod-opening" fill="#eff6ff" stroke="#2563eb" stroke-width="1.45"`));
    if (display.showOpeningTags) {
      elements.push(
        text(
          x + door.widthMm / SCALE / 2,
          y - 4,
          formatOpeningTag("door", doorIndex, door.widthMm, door.heightMm),
          `class="twod-tag twod-tag-opening" font-size="7" font-weight="700" fill="#1d4ed8" text-anchor="middle"`,
        ),
      );
    }
  }

  const visibleCabinets = project.cabinets.filter((cabinet) => {
    const side = cabinet.placement.attachment;
    return side === "floor" || side === "back-wall";
  });

  for (const cabinet of visibleCabinets) {
    const fp = getFootprintDimensions(cabinet.config.dimensions, cabinet.placement.rotation);
    const width = fp.width / SCALE;
    const height = cabinet.config.dimensions.height / SCALE;
    const ghost =
      options.ghostPlacement?.cabinetId === cabinet.id ? options.ghostPlacement : null;
    const x = ox + (ghost?.x ?? cabinet.placement.x) / SCALE - width / 2;
    const y =
      oy +
      rh / SCALE / 2 -
      ((ghost?.y ?? cabinet.placement.y) + cabinet.config.dimensions.height) / SCALE;
    const fill = cabinet.placement.attachment === "back-wall" ? "#d6c3a4" : "#c4a574";
    elements.push(
      ...cabinetElevationGraphics(
        cabinet,
        x,
        y,
        width,
        height,
        options,
        fill,
        fp.width,
        indexMap.get(cabinet.id) ?? 0,
      ),
    );
  }

  if (options.snapGuides?.length) {
    elements.push(...snapGuideLines(options.snapGuides, ox, oy, rw, rh, "front"));
  }

  elements.push(...selectedElevationDimensions(visibleCabinets, rh, ox, oy, options, "x"));

  // Overall dims
  const roomDimX = ox - rw / SCALE / 2 - 24;
  elements.push(line(roomDimX, oy - rh / SCALE / 2, roomDimX, oy + rh / SCALE / 2, `class="twod-dim twod-dim-overall" stroke="#0f172a" stroke-width="1.35"`));
  elements.push(text(roomDimX - 4, oy, `${dimensionLabel(rh)} mm`, `class="twod-annotation twod-dim-overall" font-size="9" font-weight="700" fill="#0f172a" text-anchor="end"`));
  const bottomDimY = oy + rh / SCALE / 2 + 18;
  elements.push(line(ox - rw / SCALE / 2, bottomDimY, ox + rw / SCALE / 2, bottomDimY, `class="twod-dim twod-dim-overall" stroke="#0f172a" stroke-width="1.35"`));
  elements.push(text(ox, bottomDimY + 11, `${dimensionLabel(rw)} mm`, `class="twod-annotation twod-dim-overall" font-size="9" font-weight="700" fill="#0f172a" text-anchor="middle"`));

  if (display.showDimensionChains && visibleCabinets.length > 0) {
    const minSeg = display.dimMinSegmentMm;
    const horizontal = filterDimensionChain(
      collectElevationHorizontalChain(visibleCabinets, rw, "x"),
      minSeg,
    );
    elements.push(...dimensionChainHorizontal(horizontal.positions, horizontal.labels, ox, oy + rh / SCALE / 2 + 34));

    const vertical = filterDimensionChain(
      collectElevationVerticalChain(visibleCabinets, rh),
      minSeg,
    );
    elements.push(...dimensionChainVertical(vertical.positions, vertical.labels, ox + rw / SCALE / 2 + 28, oy, rh));
  }

  elements.push(
    ...draftingLayer(options.drafting ?? project.drafting, "front", (point) => ({
      x: ox + point.x / SCALE,
      y: oy + rh / SCALE / 2 - point.y / SCALE,
    })),
  );

  return {
    width: svgWidth,
    height: svgHeight,
    originX: ox,
    originY: oy,
    scale: SCALE,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" class="twod-draft">${elements.join("")}</svg>`,
  };
}

function sideView(
  project: CabinetProject,
  room: RoomConfig,
  options: TechnicalViewOptions = {},
): TechnicalViewResult {
  const rd = room.dimensions.depthMm;
  const rh = room.dimensions.heightMm;
  const svgWidth = rd / SCALE + MARGIN * 2 + 20;
  const svgHeight = rh / SCALE + MARGIN * 2 + (options.mode === "print" ? 20 : 0) + 20;
  const ox = MARGIN + rd / SCALE / 2;
  const oy = MARGIN + rh / SCALE / 2 + (options.mode === "print" ? 18 : 0);
  const elements: string[] = [];
  const display = resolveDisplay(options);
  const indexMap = cabinetIndexMap(project);
  const sheetMeta =
    options.sheetMeta ??
    (() => {
      const job = clampJobMeta(project.job);
      return `${formatJobTitle(job)} · ${formatJobSubtitle(job)}`;
    })();

  elements.push(rect(0, 0, svgWidth, svgHeight, `fill="${options.mode === "print" ? "#ffffff" : "#f1f5f9"}" class="twod-sheet"`));
  if (options.mode === "print") {
    elements.push(
      ...titleBlock(
        svgWidth,
        options.title ?? "Side Elevation",
        options.projectName ?? "Cabinet Project",
        "SIDE ELEV.",
        `1:${SCALE * 25}`,
        sheetMeta,
      ),
    );
  }

  if (options.showGrid) {
    elements.push(...elevationGrid(ox, oy, rd, rh, 500));
  }

  elements.push(rect(
    ox - rd / SCALE / 2,
    oy - rh / SCALE / 2,
    rd / SCALE,
    rh / SCALE,
    `class="twod-wall twod-wall-outline" fill="#f8fafc" stroke="#0f172a" stroke-width="2.25"`,
  ));

  elements.push(line(
    ox - rd / SCALE / 2,
    oy + rh / SCALE / 2,
    ox + rd / SCALE / 2,
    oy + rh / SCALE / 2,
    `class="twod-wall twod-floor-line" stroke="#0f172a" stroke-width="2.4"`,
  ));

  if (display.showWallLabels) {
    elements.push(text(ox, oy - rh / SCALE / 2 - 8, "SIDE WALL ELEVATION", `class="twod-wall-label" font-size="8" font-weight="700" fill="#64748b" text-anchor="middle"`));
  }

  for (const [winIndex, window] of room.windows
    .filter((item) => item.side === "left-wall" || item.side === "right-wall")
    .entries()) {
    const x = ox + window.positionMm / SCALE - window.widthMm / SCALE / 2;
    const y = oy + rh / SCALE / 2 - (window.sillHeightMm + window.heightMm) / SCALE;
    elements.push(rect(x, y, window.widthMm / SCALE, window.heightMm / SCALE, `class="twod-opening" fill="#dbeafe" stroke="#1d4ed8" stroke-width="1.45"`));
    if (display.showOpeningTags) {
      elements.push(
        text(
          x + window.widthMm / SCALE / 2,
          y - 4,
          formatOpeningTag("window", winIndex, window.widthMm, window.heightMm, window.sillHeightMm),
          `class="twod-tag twod-tag-opening" font-size="7" font-weight="700" fill="#1d4ed8" text-anchor="middle"`,
        ),
      );
    }
  }

  for (const [doorIndex, door] of room.doors
    .filter((item) => item.side === "left-wall" || item.side === "right-wall")
    .entries()) {
    const x = ox + door.positionMm / SCALE - door.widthMm / SCALE / 2;
    const y = oy + rh / SCALE / 2 - door.heightMm / SCALE;
    elements.push(rect(x, y, door.widthMm / SCALE, door.heightMm / SCALE, `class="twod-opening" fill="#eff6ff" stroke="#2563eb" stroke-width="1.45"`));
    if (display.showOpeningTags) {
      elements.push(
        text(
          x + door.widthMm / SCALE / 2,
          y - 4,
          formatOpeningTag("door", doorIndex, door.widthMm, door.heightMm),
          `class="twod-tag twod-tag-opening" font-size="7" font-weight="700" fill="#1d4ed8" text-anchor="middle"`,
        ),
      );
    }
  }

  const visibleCabinets = project.cabinets.filter(
    (cabinet) =>
      cabinet.placement.attachment === "floor" ||
      cabinet.placement.attachment === "left-wall" ||
      cabinet.placement.attachment === "right-wall",
  );

  for (const cabinet of visibleCabinets) {
    const fp = getFootprintDimensions(cabinet.config.dimensions, cabinet.placement.rotation);
    const depth = fp.depth / SCALE;
    const height = cabinet.config.dimensions.height / SCALE;
    const ghost =
      options.ghostPlacement?.cabinetId === cabinet.id ? options.ghostPlacement : null;
    const x = ox + (ghost?.z ?? cabinet.placement.z) / SCALE - depth / 2;
    const y =
      oy +
      rh / SCALE / 2 -
      ((ghost?.y ?? cabinet.placement.y) + cabinet.config.dimensions.height) / SCALE;
    const fill = cabinet.placement.attachment === "floor" ? "#c4a574" : "#d6c3a4";
    elements.push(
      ...cabinetElevationGraphics(
        cabinet,
        x,
        y,
        depth,
        height,
        options,
        fill,
        fp.depth,
        indexMap.get(cabinet.id) ?? 0,
      ),
    );
  }

  if (options.snapGuides?.length) {
    elements.push(...snapGuideLines(options.snapGuides, ox, oy, rd, rh, "side"));
  }

  elements.push(...selectedElevationDimensions(visibleCabinets, rh, ox, oy, options, "z"));

  const roomDimX = ox - rd / SCALE / 2 - 24;
  elements.push(line(roomDimX, oy - rh / SCALE / 2, roomDimX, oy + rh / SCALE / 2, `class="twod-dim twod-dim-overall" stroke="#0f172a" stroke-width="1.35"`));
  elements.push(text(roomDimX - 4, oy, `${dimensionLabel(rh)} mm`, `class="twod-annotation twod-dim-overall" font-size="9" font-weight="700" fill="#0f172a" text-anchor="end"`));
  const bottomDimY = oy + rh / SCALE / 2 + 18;
  elements.push(line(ox - rd / SCALE / 2, bottomDimY, ox + rd / SCALE / 2, bottomDimY, `class="twod-dim twod-dim-overall" stroke="#0f172a" stroke-width="1.35"`));
  elements.push(text(ox, bottomDimY + 11, `${dimensionLabel(rd)} mm`, `class="twod-annotation twod-dim-overall" font-size="9" font-weight="700" fill="#0f172a" text-anchor="middle"`));

  if (display.showDimensionChains && visibleCabinets.length > 0) {
    const minSeg = display.dimMinSegmentMm;
    const horizontal = filterDimensionChain(
      collectElevationHorizontalChain(visibleCabinets, rd, "z"),
      minSeg,
    );
    elements.push(...dimensionChainHorizontal(horizontal.positions, horizontal.labels, ox, oy + rh / SCALE / 2 + 34));

    const vertical = filterDimensionChain(
      collectElevationVerticalChain(visibleCabinets, rh),
      minSeg,
    );
    elements.push(...dimensionChainVertical(vertical.positions, vertical.labels, ox + rd / SCALE / 2 + 28, oy, rh));
  }

  elements.push(
    ...draftingLayer(options.drafting ?? project.drafting, "side", (point) => ({
      x: ox + point.z / SCALE,
      y: oy + rh / SCALE / 2 - point.y / SCALE,
    })),
  );

  return {
    width: svgWidth,
    height: svgHeight,
    originX: ox,
    originY: oy,
    scale: SCALE,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" class="twod-draft">${elements.join("")}</svg>`,
  };
}

export function createTechnicalView(
  project: CabinetProject,
  room: RoomConfig,
  view: TechnicalViewKind,
  countertops: CountertopSegment[] = [],
  options: TechnicalViewOptions = {},
): TechnicalViewResult {
  switch (view) {
    case "front":
      return frontView(project, room, options);
    case "side":
      return sideView(project, room, options);
    default:
      return topView(project, room, countertops, options);
  }
}

export async function svgToPngDataUrl(svg: string): Promise<string> {
  const encoded = window.btoa(
    encodeURIComponent(svg).replace(/%([0-9A-F]{2})/g, (_, hex: string) =>
      String.fromCharCode(Number.parseInt(hex, 16)),
    ),
  );
  const svgDataUrl = `data:image/svg+xml;base64,${encoded}`;

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Unable to render technical view image."));
        return;
      }

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);
      resolve(canvas.toDataURL("image/png", 1));
    };
    image.onerror = () => reject(new Error("Unable to load technical view image."));
    image.src = svgDataUrl;
  });
}

export function formatProjectTechnicalSummary(project: CabinetProject, room: RoomConfig) {
  return [
    `Room: ${Math.round(millimetresToMetres(room.dimensions.widthMm) * 1000)} x ${Math.round(millimetresToMetres(room.dimensions.depthMm) * 1000)} x ${Math.round(millimetresToMetres(room.dimensions.heightMm) * 1000)} mm`,
    `Items: ${project.cabinets.length}`,
    `Doors: ${room.doors.length}`,
    `Windows: ${room.windows.length}`,
  ];
}
