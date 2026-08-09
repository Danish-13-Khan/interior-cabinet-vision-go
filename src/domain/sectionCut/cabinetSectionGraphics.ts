import type { CabinetInstance } from "../cabinetDimensions";
import {
  createCabinetConstruction,
  getConstructionSummary,
} from "../cabinetConstruction";
import { hatchFill } from "../constructionGraphics/hatch";
import { layoutCabinetElevationFace } from "../openingLayout";
import { SCALE } from "../technicalViews/constants";
import { line, rect, text } from "../technicalViews/svgPrimitives";

/**
 * True cabinet section cut: depth × height carcass with shelves / toe kick.
 * Origin at top-left of cabinet footprint in section view (SVG).
 */
export function cabinetSectionCutGraphics(
  cabinet: CabinetInstance,
  svgX: number,
  svgY: number,
  scale = SCALE,
  options: { emphasize?: boolean; showLabels?: boolean } = {},
) {
  const elements: string[] = [];
  const dims = cabinet.config.dimensions;
  const depth = dims.depth / scale;
  const height = dims.height / scale;
  const thick = Math.max(1.2, dims.boardThickness / scale);
  const layout = layoutCabinetElevationFace(cabinet.config);
  const construction = createCabinetConstruction(cabinet.config);
  const toe = layout.toeKickHeightMm / scale;
  const emphasize = options.emphasize !== false;

  elements.push(
    rect(
      svgX,
      svgY,
      depth,
      height,
      `class="twod-cabinet twod-section-carcass ${emphasize ? "twod-section-cut-active" : ""}" data-cabinet-id="${cabinet.id}"`,
    ),
  );

  elements.push(...hatchFill(svgX, svgY, thick, height - toe));
  elements.push(...hatchFill(svgX, svgY, depth, thick));
  elements.push(
    ...hatchFill(svgX, svgY + height - thick - toe, depth, thick),
  );
  elements.push(
    ...hatchFill(svgX + depth - thick, svgY, thick, height - toe),
  );

  if (toe > 0.5) {
    const inset = Math.max(thick, (cabinet.config.toeKickInset || 60) / scale);
    elements.push(
      rect(
        svgX + inset,
        svgY + height - toe,
        Math.max(2, depth - inset),
        toe,
        `class="twod-toe-kick-plan twod-section-toe" pointer-events="none"`,
      ),
    );
  }

  for (const opening of layout.openings) {
    if (opening.contentType === "open-shelf" || opening.shelfCount > 0) {
      const shelves = Math.max(1, opening.shelfCount || 1);
      for (let i = 1; i <= shelves; i += 1) {
        const yFromBottom =
          layout.toeKickHeightMm +
          opening.yMm +
          (opening.heightMm * i) / (shelves + 1);
        const sy = svgY + height - yFromBottom / scale;
        elements.push(
          line(
            svgX + thick + 1,
            sy,
            svgX + depth - thick - 1,
            sy,
            `class="twod-section-shelf twod-line-interior" pointer-events="none"`,
          ),
        );
      }
    }
    if (opening.contentType === "drawer-stack" || opening.drawerCount > 0) {
      const count = Math.max(1, opening.drawerCount || 1);
      for (let i = 0; i < count; i += 1) {
        const yFromBottom =
          layout.toeKickHeightMm +
          opening.yMm +
          (opening.heightMm * (i + 0.5)) / count;
        const sy = svgY + height - yFromBottom / scale;
        const drawerDepth = depth * 0.72;
        elements.push(
          rect(
            svgX + thick + 1,
            sy - 3,
            drawerDepth,
            6,
            `class="twod-section-drawer" pointer-events="none"`,
          ),
        );
      }
    }
  }

  elements.push(
    line(
      svgX + depth,
      svgY,
      svgX + depth,
      svgY + height - toe,
      `class="twod-cabinet-front twod-section-front" pointer-events="none"`,
    ),
  );

  if (options.showLabels !== false) {
    elements.push(
      text(
        svgX + depth / 2,
        svgY - 4,
        cabinet.name,
        `class="twod-label twod-cabinet-name" font-size="7" text-anchor="middle" pointer-events="none"`,
      ),
      text(
        svgX + depth / 2,
        svgY + height + 10,
        getConstructionSummary(construction).slice(0, 42),
        `class="twod-annotation twod-section-note" font-size="5.5" text-anchor="middle" pointer-events="none"`,
      ),
    );
  }

  return elements;
}
