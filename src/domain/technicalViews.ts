import {
  cabinetTypeLabels,
  getFootprintDimensions,
  millimetresToMetres,
  usesRotatedFootprint,
  type CabinetInstance,
  type CabinetProject,
} from "./cabinetDimensions";
import type { CountertopSegment } from "./cabinetLibrary";
import type { SnapGuide } from "./placementSnap";
import { collectPlanDimensionChain } from "./placementSnap";
import type { RoomConfig } from "./roomModel";

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
  title?: string;
  projectName?: string;
  snapGuides?: SnapGuide[];
  ghostPlacement?: {
    cabinetId: string;
    x: number;
    y: number;
    z: number;
  } | null;
};

export const TECHNICAL_VIEW_SCALE = 4;
export const TECHNICAL_VIEW_MARGIN = 56;

const SCALE = TECHNICAL_VIEW_SCALE;
const MARGIN = TECHNICAL_VIEW_MARGIN;

function cabinetPaint(
  cabinetId: string,
  baseFill: string,
  options: TechnicalViewOptions,
) {
  if (options.mode === "print") {
    return {
      fill: baseFill,
      stroke: "#4b5563",
      strokeWidth: "1.4",
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
    stroke: "#775b33",
    strokeWidth: "1.2",
  };
}

function cabinetRectAttrs(
  cabinetId: string,
  baseFill: string,
  options: TechnicalViewOptions,
) {
  const paint = cabinetPaint(cabinetId, baseFill, options);
  return `fill="${paint.fill}" stroke="${paint.stroke}" stroke-width="${paint.strokeWidth}" rx="1.5" data-cabinet-id="${cabinetId}" class="twod-cabinet" style="cursor:grab"`;
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
    return line(x, y - 3, x, y + 3, `stroke="#475569" stroke-width="1"`);
  }
  return line(x - 3, y, x + 3, y, `stroke="#475569" stroke-width="1"`);
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
  elements.push(line(x0, y, x1, y, `stroke="#475569" stroke-width="1"`));

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
          `font-size="8" fill="#334155" text-anchor="middle" pointer-events="none"`,
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
) {
  const blockH = 28;
  const y = 8;
  return [
    rect(8, y, svgWidth - 16, blockH, `fill="#ffffff" stroke="#64748b" stroke-width="1"`),
    line(svgWidth - 220, y, svgWidth - 220, y + blockH, `stroke="#64748b" stroke-width="1"`),
    line(svgWidth - 120, y, svgWidth - 120, y + blockH, `stroke="#64748b" stroke-width="1"`),
    text(14, y + 12, shortLabel(projectName || "Cabinet Project", 28), `font-size="10" font-weight="700" fill="#0f172a"`),
    text(14, y + 23, title, `font-size="8" fill="#475569"`),
    text(svgWidth - 215, y + 12, viewLabel, `font-size="8" font-weight="700" fill="#0f172a"`),
    text(svgWidth - 215, y + 23, scaleText, `font-size="8" fill="#475569"`),
    text(svgWidth - 115, y + 12, "TECHNICAL SHEET", `font-size="8" font-weight="700" fill="#0f172a"`),
    text(svgWidth - 115, y + 23, new Date().toLocaleDateString(), `font-size="8" fill="#475569"`),
  ];
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
    elements.push(line(sx, top, sx, bottom, `stroke="#e2e8f0" stroke-width="0.6"`));
  }
  for (let z = -roomD / 2; z <= roomD / 2; z += stepMm) {
    const sz = oy + z / SCALE;
    elements.push(line(left, sz, right, sz, `stroke="#e2e8f0" stroke-width="0.6"`));
  }
  return elements;
}

function snapGuideLines(
  guides: SnapGuide[],
  ox: number,
  oy: number,
  roomW: number,
  roomD: number,
  view: TechnicalViewKind,
) {
  const elements: string[] = [];
  const left = ox - roomW / SCALE / 2;
  const right = ox + roomW / SCALE / 2;
  const top = oy - roomD / SCALE / 2;
  const bottom = oy + roomD / SCALE / 2;

  for (const guide of guides) {
    const color =
      guide.kind === "wall"
        ? "#f97316"
        : guide.kind === "align" || guide.kind === "adjacency"
          ? "#2563eb"
          : "#94a3b8";
    if (view === "top") {
      if (guide.axis === "x") {
        const x = ox + guide.positionMm / SCALE;
        elements.push(line(x, top, x, bottom, `stroke="${color}" stroke-width="1.2" stroke-dasharray="4 3"`));
      } else if (guide.axis === "z") {
        const z = oy + guide.positionMm / SCALE;
        elements.push(line(left, z, right, z, `stroke="${color}" stroke-width="1.2" stroke-dasharray="4 3"`));
      }
    }
  }
  return elements;
}

function cabinetPlanGraphics(
  cabinet: CabinetInstance,
  ox: number,
  oy: number,
  options: TechnicalViewOptions,
) {
  const elements: string[] = [];
  const fp = getFootprintDimensions(cabinet.config.dimensions, cabinet.placement.rotation);
  const ghost =
    options.ghostPlacement?.cabinetId === cabinet.id ? options.ghostPlacement : null;
  const cx = ox + (ghost?.x ?? cabinet.placement.x) / SCALE;
  const cy = oy + (ghost?.z ?? cabinet.placement.z) / SCALE;
  const bw = fp.width / SCALE;
  const bd = fp.depth / SCALE;
  const fill = usesRotatedFootprint(cabinet.placement.rotation) ? "#d6b788" : "#cba775";

  elements.push(rect(cx - bw / 2, cy - bd / 2, bw, bd, cabinetRectAttrs(cabinet.id, fill, options)));

  // Toe-kick inset hint on plan
  if (cabinet.config.toeKickHeight > 0 && cabinet.config.toeKickInset > 0) {
    const inset = cabinet.config.toeKickInset / SCALE;
    elements.push(
      rect(
        cx - bw / 2 + inset,
        cy + bd / 2 - inset,
        Math.max(2, bw - inset * 2),
        Math.max(1, inset),
        `fill="none" stroke="#8b7355" stroke-width="0.8" stroke-dasharray="2 2" pointer-events="none"`,
      ),
    );
  }

  // Front edge indicator (facing +Z in local space approximated by thinner stroke on far side)
  elements.push(
    line(
      cx - bw / 2,
      cy - bd / 2,
      cx + bw / 2,
      cy - bd / 2,
      `stroke="#3f3f46" stroke-width="1.8" pointer-events="none"`,
    ),
  );

  const typeLabel = cabinetTypeLabels[cabinet.config.type] ?? cabinet.config.type;
  elements.push(
    text(
      cx,
      cy - 2,
      shortLabel(cabinet.name, 14),
      `font-size="9" font-weight="700" fill="#1f2937" text-anchor="middle" pointer-events="none"`,
    ),
  );
  elements.push(
    text(
      cx,
      cy + 9,
      shortLabel(typeLabel, 14),
      `font-size="7.5" fill="#64748b" text-anchor="middle" pointer-events="none"`,
    ),
  );
  elements.push(
    text(
      cx,
      cy + bd / 2 + 11,
      `${dimensionLabel(fp.width)}×${dimensionLabel(fp.depth)}`,
      `font-size="7.5" fill="#475569" text-anchor="middle" pointer-events="none"`,
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
) {
  const elements: string[] = [];
  elements.push(rect(x, y, width, height, cabinetRectAttrs(cabinet.id, fill, options)));

  if (options.showElevationDetails !== false) {
    const toe = cabinet.config.toeKickHeight > 0 ? cabinet.config.toeKickHeight / SCALE : 0;
    if (toe > 0) {
      elements.push(
        line(x, y + height - toe, x + width, y + height - toe, `stroke="#6b7280" stroke-width="0.9" pointer-events="none"`),
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
          rect(dx, dy, doorW, dh, `fill="none" stroke="#57534e" stroke-width="1" pointer-events="none"`),
        );
        const handleX = index === 0 && doorCount === 2 ? dx + doorW - 4 : dx + 4;
        elements.push(
          line(handleX, dy + dh * 0.45, handleX, dy + dh * 0.55, `stroke="#44403c" stroke-width="1.5" pointer-events="none"`),
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
          rect(x + 3, dy, width - 6, drawerH - 2, `fill="none" stroke="#57534e" stroke-width="1" pointer-events="none"`),
        );
        elements.push(
          line(x + width / 2 - 8, dy + drawerH / 2, x + width / 2 + 8, dy + drawerH / 2, `stroke="#44403c" stroke-width="1.4" pointer-events="none"`),
        );
      }
    }

    if (cabinet.config.shelfCount > 0 && !cabinet.config.hasDoors) {
      const usable = height - toe - 8;
      for (let index = 1; index <= cabinet.config.shelfCount; index += 1) {
        const sy = y + 4 + (usable * index) / (cabinet.config.shelfCount + 1);
        elements.push(line(x + 3, sy, x + width - 3, sy, `stroke="#78716c" stroke-width="0.9" stroke-dasharray="3 2" pointer-events="none"`));
      }
    }
  }

  elements.push(
    text(
      x + width / 2,
      y - 5,
      shortLabel(cabinet.name, 16),
      `font-size="8.5" font-weight="700" fill="#1f2937" text-anchor="middle" pointer-events="none"`,
    ),
  );
  elements.push(
    text(
      x + width / 2,
      y + height + 11,
      `${dimensionLabel(cabinet.config.dimensions.width)} mm`,
      `font-size="7.5" fill="#475569" text-anchor="middle" pointer-events="none"`,
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
  const svgHeight = rd / SCALE + MARGIN * 2 + (options.mode === "print" ? 20 : 0);
  const ox = MARGIN + rw / SCALE / 2;
  const oy = MARGIN + rd / SCALE / 2 + (options.mode === "print" ? 18 : 0);
  const elements: string[] = [];
  const showChains = options.showDimensionChains !== false;
  const showWallLabels = options.showWallLabels !== false;

  elements.push(rect(0, 0, svgWidth, svgHeight, `fill="${options.mode === "print" ? "#ffffff" : "#f4f6f8"}" class="twod-sheet"`));

  if (options.mode === "print") {
    elements.push(
      ...titleBlock(
        svgWidth,
        options.title ?? "Room Plan",
        options.projectName ?? "Cabinet Project",
        "PLAN",
        `1:${SCALE * 25}`,
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
    `fill="#f8fafc" stroke="#475569" stroke-width="1.6"`,
  ));

  if (showWallLabels) {
    elements.push(text(ox, oy - rd / SCALE / 2 - 8, "BACK WALL", `font-size="8" font-weight="700" fill="#64748b" text-anchor="middle"`));
    elements.push(text(ox, oy + rd / SCALE / 2 + 14, "FRONT", `font-size="8" font-weight="700" fill="#64748b" text-anchor="middle"`));
    elements.push(text(ox - rw / SCALE / 2 - 10, oy, "LEFT", `font-size="8" font-weight="700" fill="#64748b" text-anchor="middle" transform="rotate(-90 ${ox - rw / SCALE / 2 - 10} ${oy})"`));
    elements.push(text(ox + rw / SCALE / 2 + 12, oy, "RIGHT", `font-size="8" font-weight="700" fill="#64748b" text-anchor="middle" transform="rotate(90 ${ox + rw / SCALE / 2 + 12} ${oy})"`));
  }

  for (const cabinet of project.cabinets) {
    elements.push(...cabinetPlanGraphics(cabinet, ox, oy, options));
  }

  for (const countertop of countertops) {
    const cx = ox + countertop.positionX / SCALE;
    const cz = oy + countertop.positionZ / SCALE;
    elements.push(rect(
      cx - countertop.widthMm / SCALE / 2,
      cz - countertop.depthMm / SCALE / 2,
      countertop.widthMm / SCALE,
      countertop.depthMm / SCALE,
      `fill="none" stroke="#6b7e5c" stroke-width="1.6" stroke-dasharray="5 3"`,
    ));
  }

  for (const door of room.doors) {
    const dx = door.side === "back-wall" ? ox + door.positionMm / SCALE
      : door.side === "left-wall" ? ox - rw / SCALE / 2 - 6 : ox + rw / SCALE / 2 + 2;
    const dy = door.side === "back-wall" ? oy - rd / SCALE / 2 - 6 : oy + door.positionMm / SCALE;
    const dw = door.side === "back-wall" ? door.widthMm / SCALE : 4;
    const dh = door.side === "back-wall" ? 4 : door.widthMm / SCALE;
    elements.push(rect(dx - dw / 2, dy - dh / 2, dw, dh, `fill="#dbeafe" stroke="#2563eb" stroke-width="1"`));
    elements.push(text(dx, dy - 6, "DR", `font-size="7" fill="#1d4ed8" text-anchor="middle"`));
  }

  for (const win of room.windows) {
    const wx = win.side === "back-wall" ? ox + win.positionMm / SCALE
      : win.side === "left-wall" ? ox - rw / SCALE / 2 - 6 : ox + rw / SCALE / 2 + 2;
    const wy = win.side === "back-wall" ? oy - rd / SCALE / 2 - 6 : oy + win.positionMm / SCALE;
    const ww = win.side === "back-wall" ? win.widthMm / SCALE : 4;
    const wh = win.side === "back-wall" ? 4 : win.widthMm / SCALE;
    elements.push(rect(wx - ww / 2, wy - wh / 2, ww, wh, `fill="#d1fae5" stroke="#0f766e" stroke-width="1"`));
    elements.push(text(wx, wy - 6, "WN", `font-size="7" fill="#0f766e" text-anchor="middle"`));
  }

  if (options.snapGuides?.length) {
    elements.push(...snapGuideLines(options.snapGuides, ox, oy, rw, rd, "top"));
  }

  // Overall room dimensions
  const topDimY = oy - rd / SCALE / 2 - 24;
  elements.push(line(ox - rw / SCALE / 2, topDimY, ox + rw / SCALE / 2, topDimY, `stroke="#334155" stroke-width="1"`));
  elements.push(dimTick(ox - rw / SCALE / 2, topDimY, true));
  elements.push(dimTick(ox + rw / SCALE / 2, topDimY, true));
  elements.push(text(ox, topDimY - 4, `${dimensionLabel(rw)} mm`, `font-size="9" font-weight="700" fill="#0f172a" text-anchor="middle"`));

  const leftDimX = ox - rw / SCALE / 2 - 24;
  elements.push(line(leftDimX, oy - rd / SCALE / 2, leftDimX, oy + rd / SCALE / 2, `stroke="#334155" stroke-width="1"`));
  elements.push(dimTick(leftDimX, oy - rd / SCALE / 2, false));
  elements.push(dimTick(leftDimX, oy + rd / SCALE / 2, false));
  elements.push(text(leftDimX - 4, oy, `${dimensionLabel(rd)} mm`, `font-size="9" font-weight="700" fill="#0f172a" text-anchor="end"`));

  if (showChains && project.cabinets.length > 0) {
    const chain = collectPlanDimensionChain(project.cabinets, rw);
    elements.push(...dimensionChainHorizontal(chain.positions, chain.labels, ox, oy + rd / SCALE / 2 + 28));
  }

  return {
    width: svgWidth,
    height: svgHeight,
    originX: ox,
    originY: oy,
    scale: SCALE,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">${elements.join("")}</svg>`,
  };
}

function frontView(
  project: CabinetProject,
  room: RoomConfig,
  options: TechnicalViewOptions = {},
): TechnicalViewResult {
  const rw = room.dimensions.widthMm;
  const rh = room.dimensions.heightMm;
  const svgWidth = rw / SCALE + MARGIN * 2;
  const svgHeight = rh / SCALE + MARGIN * 2 + (options.mode === "print" ? 20 : 0);
  const ox = MARGIN + rw / SCALE / 2;
  const oy = MARGIN + rh / SCALE / 2 + (options.mode === "print" ? 18 : 0);
  const elements: string[] = [];

  elements.push(rect(0, 0, svgWidth, svgHeight, `fill="${options.mode === "print" ? "#ffffff" : "#f4f6f8"}" class="twod-sheet"`));
  if (options.mode === "print") {
    elements.push(
      ...titleBlock(
        svgWidth,
        options.title ?? "Front Elevation",
        options.projectName ?? "Cabinet Project",
        "FRONT ELEV.",
        `1:${SCALE * 25}`,
      ),
    );
  }

  elements.push(rect(
    ox - rw / SCALE / 2,
    oy - rh / SCALE / 2,
    rw / SCALE,
    rh / SCALE,
    `fill="#f8fafc" stroke="#475569" stroke-width="1.6"`,
  ));

  if (options.showWallLabels !== false) {
    elements.push(text(ox, oy - rh / SCALE / 2 - 8, "BACK WALL ELEVATION", `font-size="8" font-weight="700" fill="#64748b" text-anchor="middle"`));
  }

  for (const window of room.windows.filter((item) => item.side === "back-wall")) {
    const x = ox + window.positionMm / SCALE - window.widthMm / SCALE / 2;
    const y = oy + rh / SCALE / 2 - (window.sillHeightMm + window.heightMm) / SCALE;
    elements.push(rect(x, y, window.widthMm / SCALE, window.heightMm / SCALE, `fill="#dbeafe" stroke="#2563eb" stroke-width="1.2"`));
    elements.push(text(x + window.widthMm / SCALE / 2, y - 3, "WINDOW", `font-size="7" fill="#1d4ed8" text-anchor="middle"`));
  }

  for (const door of room.doors.filter((item) => item.side === "back-wall")) {
    const x = ox + door.positionMm / SCALE - door.widthMm / SCALE / 2;
    const y = oy + rh / SCALE / 2 - door.heightMm / SCALE;
    elements.push(rect(x, y, door.widthMm / SCALE, door.heightMm / SCALE, `fill="#eff6ff" stroke="#3b82f6" stroke-width="1.2"`));
    elements.push(text(x + door.widthMm / SCALE / 2, y - 3, "DOOR", `font-size="7" fill="#1d4ed8" text-anchor="middle"`));
  }

  const visibleCabinets = project.cabinets.filter((cabinet) => {
    const side = cabinet.placement.attachment;
    return side === "floor" || side === "back-wall";
  });

  for (const cabinet of visibleCabinets) {
    const width = cabinet.config.dimensions.width / SCALE;
    const height = cabinet.config.dimensions.height / SCALE;
    const ghost =
      options.ghostPlacement?.cabinetId === cabinet.id ? options.ghostPlacement : null;
    const x = ox + (ghost?.x ?? cabinet.placement.x) / SCALE - width / 2;
    const y =
      oy +
      rh / SCALE / 2 -
      ((ghost?.y ?? cabinet.placement.y) + cabinet.config.dimensions.height) / SCALE;
    const fill = cabinet.placement.attachment === "back-wall" ? "#d7c2a1" : "#cba775";
    elements.push(...cabinetElevationGraphics(cabinet, x, y, width, height, options, fill));
  }

  // Overall dims
  const roomDimX = ox - rw / SCALE / 2 - 24;
  elements.push(line(roomDimX, oy - rh / SCALE / 2, roomDimX, oy + rh / SCALE / 2, `stroke="#334155" stroke-width="1"`));
  elements.push(text(roomDimX - 4, oy, `${dimensionLabel(rh)} mm`, `font-size="9" font-weight="700" fill="#0f172a" text-anchor="end"`));
  const bottomDimY = oy + rh / SCALE / 2 + 18;
  elements.push(line(ox - rw / SCALE / 2, bottomDimY, ox + rw / SCALE / 2, bottomDimY, `stroke="#334155" stroke-width="1"`));
  elements.push(text(ox, bottomDimY + 11, `${dimensionLabel(rw)} mm`, `font-size="9" font-weight="700" fill="#0f172a" text-anchor="middle"`));

  if (options.showDimensionChains !== false && visibleCabinets.length > 0) {
    const edges = [-rw / 2];
    for (const cabinet of visibleCabinets) {
      edges.push(cabinet.placement.x - cabinet.config.dimensions.width / 2);
      edges.push(cabinet.placement.x + cabinet.config.dimensions.width / 2);
    }
    edges.push(rw / 2);
    const unique = Array.from(new Set(edges.map((v) => Math.round(v)))).sort((a, b) => a - b);
    const labels = unique.slice(0, -1).map((value, index) => String(unique[index + 1] - value));
    elements.push(...dimensionChainHorizontal(unique, labels, ox, oy + rh / SCALE / 2 + 34));
  }

  return {
    width: svgWidth,
    height: svgHeight,
    originX: ox,
    originY: oy,
    scale: SCALE,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">${elements.join("")}</svg>`,
  };
}

function sideView(
  project: CabinetProject,
  room: RoomConfig,
  options: TechnicalViewOptions = {},
): TechnicalViewResult {
  const rd = room.dimensions.depthMm;
  const rh = room.dimensions.heightMm;
  const svgWidth = rd / SCALE + MARGIN * 2;
  const svgHeight = rh / SCALE + MARGIN * 2 + (options.mode === "print" ? 20 : 0);
  const ox = MARGIN + rd / SCALE / 2;
  const oy = MARGIN + rh / SCALE / 2 + (options.mode === "print" ? 18 : 0);
  const elements: string[] = [];

  elements.push(rect(0, 0, svgWidth, svgHeight, `fill="${options.mode === "print" ? "#ffffff" : "#f4f6f8"}" class="twod-sheet"`));
  if (options.mode === "print") {
    elements.push(
      ...titleBlock(
        svgWidth,
        options.title ?? "Side Elevation",
        options.projectName ?? "Cabinet Project",
        "SIDE ELEV.",
        `1:${SCALE * 25}`,
      ),
    );
  }

  elements.push(rect(
    ox - rd / SCALE / 2,
    oy - rh / SCALE / 2,
    rd / SCALE,
    rh / SCALE,
    `fill="#f8fafc" stroke="#475569" stroke-width="1.6"`,
  ));

  if (options.showWallLabels !== false) {
    elements.push(text(ox, oy - rh / SCALE / 2 - 8, "SIDE WALL ELEVATION", `font-size="8" font-weight="700" fill="#64748b" text-anchor="middle"`));
  }

  for (const window of room.windows.filter((item) => item.side === "left-wall" || item.side === "right-wall")) {
    const x = ox + window.positionMm / SCALE - window.widthMm / SCALE / 2;
    const y = oy + rh / SCALE / 2 - (window.sillHeightMm + window.heightMm) / SCALE;
    elements.push(rect(x, y, window.widthMm / SCALE, window.heightMm / SCALE, `fill="#dbeafe" stroke="#2563eb" stroke-width="1.2"`));
    elements.push(text(x + window.widthMm / SCALE / 2, y - 3, "WINDOW", `font-size="7" fill="#1d4ed8" text-anchor="middle"`));
  }

  for (const door of room.doors.filter((item) => item.side === "left-wall" || item.side === "right-wall")) {
    const x = ox + door.positionMm / SCALE - door.widthMm / SCALE / 2;
    const y = oy + rh / SCALE / 2 - door.heightMm / SCALE;
    elements.push(rect(x, y, door.widthMm / SCALE, door.heightMm / SCALE, `fill="#eff6ff" stroke="#3b82f6" stroke-width="1.2"`));
    elements.push(text(x + door.widthMm / SCALE / 2, y - 3, "DOOR", `font-size="7" fill="#1d4ed8" text-anchor="middle"`));
  }

  const visibleCabinets = project.cabinets.filter(
    (cabinet) =>
      cabinet.placement.attachment === "floor" ||
      cabinet.placement.attachment === "left-wall" ||
      cabinet.placement.attachment === "right-wall",
  );

  for (const cabinet of visibleCabinets) {
    const depth = cabinet.config.dimensions.depth / SCALE;
    const height = cabinet.config.dimensions.height / SCALE;
    const ghost =
      options.ghostPlacement?.cabinetId === cabinet.id ? options.ghostPlacement : null;
    const x = ox + (ghost?.z ?? cabinet.placement.z) / SCALE - depth / 2;
    const y =
      oy +
      rh / SCALE / 2 -
      ((ghost?.y ?? cabinet.placement.y) + cabinet.config.dimensions.height) / SCALE;
    const fill = cabinet.placement.attachment === "floor" ? "#cba775" : "#d7c2a1";
    // Reuse elevation graphics but label depth on the bottom via override after
    const graphics = cabinetElevationGraphics(cabinet, x, y, depth, height, options, fill);
    // Replace width dim text with depth — last text element is the dim; rebuild simply:
    elements.push(...graphics.slice(0, -1));
    elements.push(
      text(
        x + depth / 2,
        y + height + 11,
        `${dimensionLabel(cabinet.config.dimensions.depth)} mm`,
        `font-size="7.5" fill="#475569" text-anchor="middle" pointer-events="none"`,
      ),
    );
  }

  const roomDimX = ox - rd / SCALE / 2 - 24;
  elements.push(line(roomDimX, oy - rh / SCALE / 2, roomDimX, oy + rh / SCALE / 2, `stroke="#334155" stroke-width="1"`));
  elements.push(text(roomDimX - 4, oy, `${dimensionLabel(rh)} mm`, `font-size="9" font-weight="700" fill="#0f172a" text-anchor="end"`));
  const bottomDimY = oy + rh / SCALE / 2 + 18;
  elements.push(line(ox - rd / SCALE / 2, bottomDimY, ox + rd / SCALE / 2, bottomDimY, `stroke="#334155" stroke-width="1"`));
  elements.push(text(ox, bottomDimY + 11, `${dimensionLabel(rd)} mm`, `font-size="9" font-weight="700" fill="#0f172a" text-anchor="middle"`));

  return {
    width: svgWidth,
    height: svgHeight,
    originX: ox,
    originY: oy,
    scale: SCALE,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">${elements.join("")}</svg>`,
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
