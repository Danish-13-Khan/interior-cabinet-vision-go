import type { CabinetType } from "../cabinetCapabilities";
import { supportsDoors, supportsShelves } from "../cabinetCapabilities";
import type { OpeningStructure, OpeningStyle } from "./types";
import { createDefaultOpeningStructure, createOpeningLeaf } from "./queries";
import { normalizeOpeningStructure } from "./normalize";

export function migrateLegacyOpeningsToStructure(
  type: CabinetType,
  widthMm: number,
  legacyStyle: OpeningStyle | undefined,
  shelfCount: number,
  drawerCount: number,
  hasDoors: boolean,
): OpeningStructure {
  if (legacyStyle === "mixed" || (hasDoors && drawerCount > 0)) {
    return normalizeOpeningStructure(
      type,
      {
        root: {
          kind: "split",
          id: "split-mixed",
          label: "Mixed Openings",
          axis: "horizontal",
          children: [
            createOpeningLeaf("drawer-stack", {
              id: "opening-drawer",
              label: "Drawer Stack",
              ratio: 0.35,
              drawerCount: Math.max(1, drawerCount),
            }),
            createOpeningLeaf("door", {
              id: "opening-door",
              label: "Door Opening",
              ratio: 0.65,
              doorStyle: widthMm < 600 ? "single" : "double",
              shelfCount,
            }),
          ],
        },
        activeOpeningId: "opening-door",
      },
      widthMm,
    );
  }

  if (legacyStyle === "drawer" || (!hasDoors && drawerCount > 0)) {
    return createDefaultOpeningStructure(
      type === "drawer" ? "drawer" : type,
      widthMm,
    );
  }

  if (legacyStyle === "open" || (!hasDoors && drawerCount === 0)) {
    const leaf = createOpeningLeaf(
      supportsShelves(type) ? "open-shelf" : "empty",
      {
        id: "opening-primary",
        label: type === "sink" ? "Sink Bay" : "Open Shelf",
        shelfCount,
      },
    );
    return { root: leaf, activeOpeningId: leaf.id };
  }

  const leaf = createOpeningLeaf(supportsDoors(type) ? "door" : "open-shelf", {
    id: "opening-primary",
    label: "Door Opening",
    doorStyle: widthMm < 600 ? "single" : "double",
    shelfCount,
  });
  return { root: leaf, activeOpeningId: leaf.id };
}
