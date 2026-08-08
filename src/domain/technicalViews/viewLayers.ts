import {
  getFootprintDimensions,
  type CabinetInstance,
  type CabinetProject,
} from "../cabinetDimensions";
import {
  clampDraftingDisplay,
  clampProjectDrafting,
  draftingVisibleInView,
  renderLeaderSvg,
  renderNoteSvg,
  type DraftingDisplayPreferences,
  type ProjectDrafting,
} from "../draftingAnnotations";
import type { SnapGuide } from "../placementSnap";
import { resolveSelectedCabinets } from "../placementSnap";
import { SCALE } from "./constants";
import {
  dimensionLabel,
  dimTick,
  line,
  rect,
  shortLabel,
  text,
} from "./svgPrimitives";
import type { TechnicalViewKind, TechnicalViewOptions } from "./types";

export function selectedPlanDimensions(
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

export function selectedElevationDimensions(
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

export function titleBlock(
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

export function resolveDisplay(options: TechnicalViewOptions): DraftingDisplayPreferences {
  return clampDraftingDisplay({
    showCabinetTags: options.showCabinetTags,
    showOpeningTags: options.showOpeningTags,
    showApplianceTags: options.showApplianceTags,
    showDimensionChains: options.showDimensionChains,
    showWallLabels: options.showWallLabels,
    showRunBands: options.showRunBands,
    showRunLabels: options.showRunLabels,
    showFillers: options.showFillers,
    showCountertopSpans: options.showCountertopSpans,
    dimMinSegmentMm: options.dimMinSegmentMm,
  });
}

export function draftingLayer(
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

export function cabinetIndexMap(project: CabinetProject) {
  return new Map(project.cabinets.map((cabinet, index) => [cabinet.id, index]));
}

export function gridLines(
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

export function elevationGrid(
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

export function snapGuideLines(
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
