import {
  cabinetTypeLabels,
  getFootprintDimensions,
  usesRotatedFootprint,
  type CabinetInstance,
} from "../cabinetDimensions";
import {
  formatApplianceTag,
  formatCabinetTag,
  renderCabinetTagSvg,
} from "../draftingAnnotations";
import { renderElevationFaceGraphics } from "../elevationFaceGraphics";
import { SCALE } from "./constants";
import {
  dimensionLabel,
  line,
  rect,
  shortLabel,
  text,
} from "./svgPrimitives";
import type { TechnicalViewOptions } from "./types";
import { resolveDisplay } from "./viewLayers";

export function cabinetClassName(
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

export function cabinetPaint(
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

export function cabinetRectAttrs(
  cabinetId: string,
  baseFill: string,
  options: TechnicalViewOptions,
  extraClass = "",
) {
  const paint = cabinetPaint(cabinetId, baseFill, options);
  return `fill="${paint.fill}" stroke="${paint.stroke}" stroke-width="${paint.strokeWidth}" rx="1" data-cabinet-id="${cabinetId}" class="${cabinetClassName(cabinetId, options, extraClass)}" style="cursor:grab"`;
}

export function cabinetPlanGraphics(
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

export function cabinetElevationGraphics(
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

  elements.push(
    ...renderElevationFaceGraphics(cabinet, x, y, width, height, {
      showDetails: options.showElevationDetails !== false,
      activeOpeningId:
        options.activeCabinetId === cabinet.id
          ? options.activeOpeningId ?? null
          : null,
      scale: SCALE,
    }),
  );

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
