import {
  getFootprintDimensions,
  millimetresToMetres,
  usesRotatedFootprint,
  type CabinetProject,
} from "./cabinetDimensions";
import type { CountertopSegment } from "./cabinetLibrary";
import type { RoomConfig } from "./roomModel";

export type TechnicalViewKind = "top" | "front" | "side";

export type TechnicalViewResult = {
  width: number;
  height: number;
  svg: string;
};

export type TechnicalViewOptions = {
  selectedCabinetIds?: string[];
  activeCabinetId?: string | null;
};

const SCALE = 4;
const MARGIN = 48;

function cabinetPaint(
  cabinetId: string,
  baseFill: string,
  options: TechnicalViewOptions,
) {
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
  return `fill="${paint.fill}" stroke="${paint.stroke}" stroke-width="${paint.strokeWidth}" rx="2" data-cabinet-id="${cabinetId}" class="twod-cabinet" style="cursor:pointer"`;
}

function escapeXml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function shortLabel(value: string) {
  return value.length > 14 ? `${value.slice(0, 13)}…` : value;
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
  return `${Math.round(valueMm)} mm`;
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
  const svgHeight = rd / SCALE + MARGIN * 2;
  const ox = MARGIN + rw / SCALE / 2;
  const oy = MARGIN + rd / SCALE / 2;
  const elements: string[] = [];

  elements.push(rect(0, 0, svgWidth, svgHeight, `fill="#f4f6f8" class="twod-sheet"`));
  elements.push(rect(
    ox - rw / SCALE / 2,
    oy - rd / SCALE / 2,
    rw / SCALE,
    rd / SCALE,
    `fill="#fafbfc" stroke="#6b7c8f" stroke-width="1.5"`,
  ));

  for (const cabinet of project.cabinets) {
    const fp = getFootprintDimensions(cabinet.config.dimensions, cabinet.placement.rotation);
    const cx = ox + cabinet.placement.x / SCALE;
    const cy = oy + cabinet.placement.z / SCALE;
    const bw = fp.width / SCALE;
    const bd = fp.depth / SCALE;
    const fill = usesRotatedFootprint(cabinet.placement.rotation) ? "#d6b788" : "#cba775";
    elements.push(rect(
      cx - bw / 2,
      cy - bd / 2,
      bw,
      bd,
      cabinetRectAttrs(cabinet.id, fill, options),
    ));
    elements.push(text(
      cx,
      cy + 3,
      shortLabel(cabinet.name),
      `font-size="9" font-weight="700" fill="#3a2d1a" text-anchor="middle" pointer-events="none"`,
    ));
    elements.push(text(
      cx,
      cy + bd / 2 + 12,
      dimensionLabel(fp.width),
      `font-size="8" fill="#5f6f84" text-anchor="middle" pointer-events="none"`,
    ));
  }

  for (const countertop of countertops) {
    const cx = ox + countertop.positionX / SCALE;
    const cz = oy + countertop.positionZ / SCALE;
    elements.push(rect(
      cx - countertop.widthMm / SCALE / 2,
      cz - countertop.depthMm / SCALE / 2,
      countertop.widthMm / SCALE,
      countertop.depthMm / SCALE,
      `fill="none" stroke="#6b7e5c" stroke-width="2" stroke-dasharray="6 3" rx="3"`,
    ));
  }

  for (const door of room.doors) {
    const dx = door.side === "back-wall" ? ox + door.positionMm / SCALE
      : door.side === "left-wall" ? ox - rw / SCALE / 2 - 6 : ox + rw / SCALE / 2 + 2;
    const dy = door.side === "back-wall" ? oy - rd / SCALE / 2 - 6 : oy + door.positionMm / SCALE;
    const dw = door.side === "back-wall" ? door.widthMm / SCALE : 4;
    const dh = door.side === "back-wall" ? 4 : door.widthMm / SCALE;
    elements.push(rect(dx - dw / 2, dy - dh / 2, dw, dh, `fill="#dbeafe" stroke="#3b82f6" stroke-width="1"`));
  }

  for (const win of room.windows) {
    const wx = win.side === "back-wall" ? ox + win.positionMm / SCALE
      : win.side === "left-wall" ? ox - rw / SCALE / 2 - 6 : ox + rw / SCALE / 2 + 2;
    const wy = win.side === "back-wall" ? oy - rd / SCALE / 2 - 6 : oy + win.positionMm / SCALE;
    const ww = win.side === "back-wall" ? win.widthMm / SCALE : 4;
    const wh = win.side === "back-wall" ? 4 : win.widthMm / SCALE;
    elements.push(rect(wx - ww / 2, wy - wh / 2, ww, wh, `fill="#d1fae5" stroke="#0f766e" stroke-width="1"`));
  }

  const topDimY = oy - rd / SCALE / 2 - 18;
  elements.push(line(ox - rw / SCALE / 2, topDimY, ox + rw / SCALE / 2, topDimY, `stroke="#65748b" stroke-width="1"`));
  elements.push(text(ox, topDimY - 4, dimensionLabel(rw), `font-size="9" fill="#475569" text-anchor="middle"`));
  const leftDimX = ox - rw / SCALE / 2 - 20;
  elements.push(line(leftDimX, oy - rd / SCALE / 2, leftDimX, oy + rd / SCALE / 2, `stroke="#65748b" stroke-width="1"`));
  elements.push(text(leftDimX - 4, oy, dimensionLabel(rd), `font-size="9" fill="#475569" text-anchor="end"`));

  return {
    width: svgWidth,
    height: svgHeight,
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
  const svgHeight = rh / SCALE + MARGIN * 2;
  const ox = MARGIN + rw / SCALE / 2;
  const oy = MARGIN + rh / SCALE / 2;
  const elements: string[] = [];

  elements.push(rect(0, 0, svgWidth, svgHeight, `fill="#f4f6f8" class="twod-sheet"`));
  elements.push(rect(
    ox - rw / SCALE / 2,
    oy - rh / SCALE / 2,
    rw / SCALE,
    rh / SCALE,
    `fill="#fafbfc" stroke="#6b7c8f" stroke-width="1.5"`,
  ));

  for (const window of room.windows.filter((item) => item.side === "back-wall")) {
    const x = ox + window.positionMm / SCALE - window.widthMm / SCALE / 2;
    const y = oy + rh / SCALE / 2 - (window.sillHeightMm + window.heightMm) / SCALE;
    elements.push(rect(x, y, window.widthMm / SCALE, window.heightMm / SCALE, `fill="#dbeafe" stroke="#3b82f6" stroke-width="1.2"`));
  }

  for (const door of room.doors.filter((item) => item.side === "back-wall")) {
    const x = ox + door.positionMm / SCALE - door.widthMm / SCALE / 2;
    const y = oy + rh / SCALE / 2 - door.heightMm / SCALE;
    elements.push(rect(x, y, door.widthMm / SCALE, door.heightMm / SCALE, `fill="#eff6ff" stroke="#5b8def" stroke-width="1.2"`));
  }

  const visibleCabinets = project.cabinets.filter((cabinet) => {
    const side = cabinet.placement.attachment;
    return side === "floor" || side === "back-wall";
  });

  for (const cabinet of visibleCabinets) {
    const width = cabinet.config.dimensions.width / SCALE;
    const height = cabinet.config.dimensions.height / SCALE;
    const x = ox + cabinet.placement.x / SCALE - width / 2;
    const y = oy + rh / SCALE / 2 - (cabinet.placement.y + cabinet.config.dimensions.height) / SCALE;
    const fill = cabinet.placement.attachment === "back-wall" ? "#d7c2a1" : "#cba775";
    elements.push(rect(x, y, width, height, cabinetRectAttrs(cabinet.id, fill, options)));
    elements.push(text(x + width / 2, y - 4, shortLabel(cabinet.name), `font-size="8.5" fill="#4b5563" text-anchor="middle" pointer-events="none"`));
    elements.push(text(x + width / 2, y + height + 11, dimensionLabel(cabinet.config.dimensions.width), `font-size="8" fill="#64748b" text-anchor="middle" pointer-events="none"`));
  }

  const roomDimX = ox - rw / SCALE / 2 - 18;
  elements.push(line(roomDimX, oy - rh / SCALE / 2, roomDimX, oy + rh / SCALE / 2, `stroke="#65748b" stroke-width="1"`));
  elements.push(text(roomDimX - 4, oy, dimensionLabel(rh), `font-size="9" fill="#475569" text-anchor="end"`));

  return {
    width: svgWidth,
    height: svgHeight,
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
  const svgHeight = rh / SCALE + MARGIN * 2;
  const ox = MARGIN + rd / SCALE / 2;
  const oy = MARGIN + rh / SCALE / 2;
  const elements: string[] = [];

  elements.push(rect(0, 0, svgWidth, svgHeight, `fill="#f4f6f8" class="twod-sheet"`));
  elements.push(rect(
    ox - rd / SCALE / 2,
    oy - rh / SCALE / 2,
    rd / SCALE,
    rh / SCALE,
    `fill="#fafbfc" stroke="#6b7c8f" stroke-width="1.5"`,
  ));

  for (const window of room.windows.filter((item) => item.side === "left-wall" || item.side === "right-wall")) {
    const z = window.positionMm;
    const x = ox + z / SCALE - window.widthMm / SCALE / 2;
    const y = oy + rh / SCALE / 2 - (window.sillHeightMm + window.heightMm) / SCALE;
    elements.push(rect(x, y, window.widthMm / SCALE, window.heightMm / SCALE, `fill="#dbeafe" stroke="#3b82f6" stroke-width="1.2"`));
  }

  for (const door of room.doors.filter((item) => item.side === "left-wall" || item.side === "right-wall")) {
    const x = ox + door.positionMm / SCALE - door.widthMm / SCALE / 2;
    const y = oy + rh / SCALE / 2 - door.heightMm / SCALE;
    elements.push(rect(x, y, door.widthMm / SCALE, door.heightMm / SCALE, `fill="#eff6ff" stroke="#5b8def" stroke-width="1.2"`));
  }

  const visibleCabinets = project.cabinets.filter((cabinet) => cabinet.placement.attachment === "floor" || cabinet.placement.attachment === "left-wall" || cabinet.placement.attachment === "right-wall");

  for (const cabinet of visibleCabinets) {
    const depth = cabinet.config.dimensions.depth / SCALE;
    const height = cabinet.config.dimensions.height / SCALE;
    const x = ox + cabinet.placement.z / SCALE - depth / 2;
    const y = oy + rh / SCALE / 2 - (cabinet.placement.y + cabinet.config.dimensions.height) / SCALE;
    const fill = cabinet.placement.attachment === "floor" ? "#cba775" : "#d7c2a1";
    elements.push(rect(x, y, depth, height, cabinetRectAttrs(cabinet.id, fill, options)));
    elements.push(text(x + depth / 2, y - 4, shortLabel(cabinet.name), `font-size="8.5" fill="#4b5563" text-anchor="middle" pointer-events="none"`));
    elements.push(text(x + depth / 2, y + height + 11, dimensionLabel(cabinet.config.dimensions.depth), `font-size="8" fill="#64748b" text-anchor="middle" pointer-events="none"`));
  }

  const roomDimX = ox - rd / SCALE / 2 - 18;
  elements.push(line(roomDimX, oy - rh / SCALE / 2, roomDimX, oy + rh / SCALE / 2, `stroke="#65748b" stroke-width="1"`));
  elements.push(text(roomDimX - 4, oy, dimensionLabel(rh), `font-size="9" fill="#475569" text-anchor="end"`));

  return {
    width: svgWidth,
    height: svgHeight,
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
