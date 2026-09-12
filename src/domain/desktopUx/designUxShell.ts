/**
 * Shared-shell chrome visibility for Design UX polish (Phase E).
 * Aligns with interiors workflow areas + Present client strip — does not rewrite UI.
 */

import type { InteriorsWorkflowArea } from "./interiorsWorkflowArea";
import { interiorsWorkflowShowsToolRail } from "./interiorsWorkflowArea";

export type DesignUxChromeSurface = {
  workflowNav: boolean;
  toolRail: boolean;
  catalogPanel: boolean;
  inspector: boolean;
  /** Present titlebar + journey tray */
  presentChrome: boolean;
  /** Authoring edit tools (draw/place/paint) */
  editTools: boolean;
  /** Client-facing strip: hide shop chrome */
  clientStrip: boolean;
};

export type DesignUxShellDensity = "calm" | "compact";

/**
 * Resolve which chrome surfaces belong on for a workflow area.
 * `presenting` forces client strip (Present / render mode).
 */
export function designUxChromeForArea(
  area: InteriorsWorkflowArea,
  presenting = false,
): DesignUxChromeSurface {
  const isPresent = presenting || area === "present";
  if (isPresent) {
    return {
      workflowNav: true,
      toolRail: false,
      catalogPanel: false,
      inspector: false,
      presentChrome: true,
      editTools: false,
      clientStrip: true,
    };
  }
  if (area === "review") {
    return {
      workflowNav: true,
      toolRail: false,
      catalogPanel: true,
      inspector: true,
      presentChrome: false,
      editTools: false,
      clientStrip: false,
    };
  }
  return {
    workflowNav: true,
    toolRail: interiorsWorkflowShowsToolRail(area),
    catalogPanel: true,
    inspector: true,
    presentChrome: false,
    editTools: true,
    clientStrip: false,
  };
}

/** Catalog rail show gate used by LivingRoomPlanCatalogRail. */
export function designUxShowsCatalogRail(input: {
  area: InteriorsWorkflowArea;
  toolRailVisible: boolean;
  presenting: boolean;
  drawRoomActive?: boolean;
}): boolean {
  if (!input.toolRailVisible || input.presenting || input.drawRoomActive) return false;
  return designUxChromeForArea(input.area, input.presenting).catalogPanel;
}

/** Tool rail show gate (extends interiorsWorkflowShowsToolRail). */
export function designUxShowsToolRail(input: {
  area: InteriorsWorkflowArea;
  toolRailVisible: boolean;
  presenting: boolean;
}): boolean {
  if (!input.toolRailVisible || input.presenting) return false;
  return designUxChromeForArea(input.area, input.presenting).toolRail;
}

export function designUxShellClassNames(input: {
  uiMode: DesignUxShellDensity;
  appearance: "light" | "dark-frame";
  presenting: boolean;
}): string[] {
  const classes = [
    "lr-plan-shell",
    "lr-product-shell",
    "lr-product-shell-v2",
    "is-drafting-studio",
    `is-ui-${input.uiMode}`,
    `is-appearance-${input.appearance}`,
  ];
  if (input.presenting) classes.push("is-presenting", "is-client-strip");
  return classes;
}
