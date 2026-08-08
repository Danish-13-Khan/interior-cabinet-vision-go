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
  if (options.mode === "print") parts.push("twod-print");
  if (isActive) parts.push("twod-active");
  if (isSelected) parts.push("twod-selected");
  return parts.filter(Boolean).join(" ");
}

export function cabinetRectAttrs(
  cabinetId: string,
  _baseFill: string,
  options: TechnicalViewOptions,
  extraClass = "",
) {
  return `data-cabinet-id="${cabinetId}" class="${cabinetClassName(cabinetId, options, extraClass)}" style="cursor:grab"`;
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
  const rotated = usesRotatedFootprint(cabinet.placement.rotation);
  const fillClass = wallMounted
    ? "twod-cabinet-wall"
    : rotated
      ? "twod-cabinet-rotated"
      : "twod-cabinet-floor";

  elements.push(
    rect(
      cx - bw / 2,
      cy - bd / 2,
      bw,
      bd,
      cabinetRectAttrs(cabinet.id, "", options, fillClass),
    ),
  );

  if (cabinet.config.toeKickHeight > 0 && cabinet.config.toeKickInset > 0) {
    const inset = cabinet.config.toeKickInset / SCALE;
    elements.push(
      rect(
        cx - bw / 2 + inset,
        cy + bd / 2 - inset,
        Math.max(2, bw - inset * 2),
        Math.max(1, inset),
        `class="twod-cabinet-opening twod-toe-kick-plan" pointer-events="none"`,
      ),
    );
  }

  elements.push(
    line(
      cx - bw / 2,
      cy - bd / 2,
      cx + bw / 2,
      cy - bd / 2,
      `class="twod-cabinet-front" pointer-events="none"`,
    ),
  );

  if (display.showCabinetTags) {
    elements.push(...renderCabinetTagSvg(cx, cy - bd / 2 - 8, formatCabinetTag(cabinetIndex)));
  }

  const typeLabel = cabinetTypeLabels[cabinet.config.type] ?? cabinet.config.type;
  elements.push(
    text(
      cx,
      cy - 1,
      shortLabel(cabinet.name, 12),
      `class="twod-label twod-cabinet-name" font-size="8" text-anchor="middle" pointer-events="none"`,
    ),
  );
  elements.push(
    text(
      cx,
      cy + 8,
      shortLabel(typeLabel, 12),
      `class="twod-annotation twod-cabinet-type" font-size="6.5" text-anchor="middle" pointer-events="none"`,
    ),
  );

  if (display.showApplianceTags) {
    const appliance = formatApplianceTag(cabinet.config.type);
    if (appliance) {
      elements.push(
        text(
          cx,
          cy + 17,
          appliance,
          `class="twod-tag twod-tag-appliance" font-size="6.5" text-anchor="middle" pointer-events="none"`,
        ),
      );
    }
  }

  elements.push(
    text(
      cx,
      cy + bd / 2 + 9,
      `${dimensionLabel(fp.width)}×${dimensionLabel(fp.depth)}`,
      `class="twod-annotation twod-cabinet-size" font-size="6.5" text-anchor="middle" pointer-events="none"`,
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
  _fill: string,
  spanLabelMm: number,
  cabinetIndex = 0,
  drawScale = SCALE,
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
      cabinetRectAttrs(
        cabinet.id,
        "",
        options,
        wallMounted ? "twod-cabinet-wall" : "twod-cabinet-floor",
      ),
    ),
  );

  if (display.showCabinetTags) {
    elements.push(
      ...renderCabinetTagSvg(x + width / 2, y - 6, formatCabinetTag(cabinetIndex)),
    );
  }

  elements.push(
    ...renderElevationFaceGraphics(cabinet, x, y, width, height, {
      showDetails: options.showElevationDetails !== false,
      activeOpeningId:
        options.activeCabinetId === cabinet.id
          ? options.activeOpeningId ?? null
          : null,
      scale: drawScale,
    }),
  );

  const typeLabel = cabinetTypeLabels[cabinet.config.type] ?? cabinet.config.type;
  elements.push(
    text(
      x + width / 2,
      y - 12,
      shortLabel(cabinet.name, 14),
      `class="twod-label twod-cabinet-name" font-size="7.5" text-anchor="middle" pointer-events="none"`,
    ),
  );
  elements.push(
    text(
      x + width / 2,
      y - 3,
      shortLabel(typeLabel, 12),
      `class="twod-annotation twod-cabinet-type" font-size="6.5" text-anchor="middle" pointer-events="none"`,
    ),
  );
  elements.push(
    text(
      x + width / 2,
      y + height + 9,
      `${dimensionLabel(spanLabelMm)} mm`,
      `class="twod-annotation twod-cabinet-size" font-size="6.5" text-anchor="middle" pointer-events="none"`,
    ),
  );

  return elements;
}
