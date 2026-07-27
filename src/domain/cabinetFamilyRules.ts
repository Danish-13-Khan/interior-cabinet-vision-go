import type { CabinetType } from "./cabinetCapabilities";
import {
  isStorageType,
  supportsDoors,
  supportsDrawers,
  supportsShelves,
  supportsToeKick,
} from "./cabinetCapabilities";
import type {
  OpeningContentType,
  OpeningLeaf,
  OpeningNode,
} from "./cabinetOpeningStructure";

export type FamilyOpeningRules = {
  family: CabinetType;
  supportsOpenings: boolean;
  allowedContentTypes: OpeningContentType[];
  allowVerticalSplit: boolean;
  allowHorizontalSplit: boolean;
  maxSplitDepth: number;
  maxLeaves: number;
  defaultToeKick: boolean;
  notes: string;
  createDefaultRoot: (widthMm: number) => OpeningNode;
};

function leaf(
  contentType: OpeningContentType,
  options: Partial<Omit<OpeningLeaf, "kind" | "contentType">> & { id: string; label: string },
): OpeningLeaf {
  return {
    kind: "leaf",
    id: options.id,
    label: options.label,
    contentType,
    ratio: options.ratio ?? 1,
    doorStyle: options.doorStyle ?? (contentType === "door" ? "double" : "none"),
    doorHinge: options.doorHinge ?? "left",
    drawerCount: options.drawerCount ?? (contentType === "drawer-stack" ? 3 : 0),
    shelfCount: options.shelfCount ?? (contentType === "open-shelf" ? 2 : 0),
    shelvesAdjustable: options.shelvesAdjustable ?? true,
  };
}

const NON_STORAGE: FamilyOpeningRules = {
  family: "table",
  supportsOpenings: false,
  allowedContentTypes: ["empty"],
  allowVerticalSplit: false,
  allowHorizontalSplit: false,
  maxSplitDepth: 0,
  maxLeaves: 1,
  defaultToeKick: false,
  notes: "Furniture items do not use carcass openings.",
  createDefaultRoot: () => leaf("empty", { id: "opening-none", label: "None", ratio: 1 }),
};

export function getFamilyOpeningRules(type: CabinetType): FamilyOpeningRules {
  if (!isStorageType(type)) {
    return { ...NON_STORAGE, family: type };
  }

  switch (type) {
    case "base":
      return {
        family: "base",
        supportsOpenings: true,
        allowedContentTypes: ["door", "drawer-stack", "open-shelf", "divider"],
        allowVerticalSplit: true,
        allowHorizontalSplit: true,
        maxSplitDepth: 2,
        maxLeaves: 4,
        defaultToeKick: true,
        notes: "Base cabinets support door bays, drawer stacks, and stacked mixed openings.",
        createDefaultRoot: (widthMm) =>
          leaf("door", {
            id: "opening-primary",
            label: "Door Opening",
            doorStyle: widthMm < 600 ? "single" : "double",
            shelfCount: 1,
          }),
      };
    case "wall":
      return {
        family: "wall",
        supportsOpenings: true,
        allowedContentTypes: ["door", "open-shelf", "divider"],
        allowVerticalSplit: true,
        allowHorizontalSplit: false,
        maxSplitDepth: 1,
        maxLeaves: 3,
        defaultToeKick: false,
        notes: "Wall cabinets are door or open shelf bays; no toe kick or drawer stacks.",
        createDefaultRoot: (widthMm) =>
          leaf("door", {
            id: "opening-primary",
            label: "Door Opening",
            doorStyle: widthMm < 600 ? "single" : "double",
            shelfCount: 1,
          }),
      };
    case "tall":
      return {
        family: "tall",
        supportsOpenings: true,
        allowedContentTypes: ["door", "drawer-stack", "open-shelf", "divider"],
        allowVerticalSplit: true,
        allowHorizontalSplit: true,
        maxSplitDepth: 2,
        maxLeaves: 4,
        defaultToeKick: true,
        notes: "Tall units commonly stack drawers under door or open sections.",
        createDefaultRoot: (widthMm) =>
          leaf("door", {
            id: "opening-primary",
            label: "Pantry Opening",
            doorStyle: widthMm < 600 ? "single" : "double",
            shelfCount: 4,
          }),
      };
    case "drawer":
      return {
        family: "drawer",
        supportsOpenings: true,
        allowedContentTypes: ["drawer-stack"],
        allowVerticalSplit: false,
        allowHorizontalSplit: false,
        maxSplitDepth: 0,
        maxLeaves: 1,
        defaultToeKick: true,
        notes: "Drawer banks are a single drawer-stack opening.",
        createDefaultRoot: () =>
          leaf("drawer-stack", {
            id: "opening-primary",
            label: "Drawer Stack",
            drawerCount: 3,
          }),
      };
    case "sink":
      return {
        family: "sink",
        supportsOpenings: true,
        allowedContentTypes: ["door", "open-shelf", "empty"],
        allowVerticalSplit: true,
        allowHorizontalSplit: false,
        maxSplitDepth: 1,
        maxLeaves: 2,
        defaultToeKick: true,
        notes: "Sink bases prefer open or door bays without shelves over the bowl.",
        createDefaultRoot: (widthMm) =>
          leaf("door", {
            id: "opening-primary",
            label: "Sink Bay",
            doorStyle: widthMm < 600 ? "single" : "double",
            shelfCount: 0,
          }),
      };
    case "corner":
      return {
        family: "corner",
        supportsOpenings: true,
        allowedContentTypes: ["door", "open-shelf", "divider"],
        allowVerticalSplit: false,
        allowHorizontalSplit: false,
        maxSplitDepth: 0,
        maxLeaves: 1,
        defaultToeKick: true,
        notes: "Corner cabinets use one access opening plus a fixed return divider.",
        createDefaultRoot: () =>
          leaf("door", {
            id: "opening-primary",
            label: "Corner Opening",
            doorStyle: "single",
            shelfCount: 1,
          }),
      };
    case "open-shelf":
      return {
        family: "open-shelf",
        supportsOpenings: true,
        allowedContentTypes: ["open-shelf", "divider"],
        allowVerticalSplit: true,
        allowHorizontalSplit: false,
        maxSplitDepth: 1,
        maxLeaves: 3,
        defaultToeKick: true,
        notes: "Open shelf cabinets expose shelf sections only.",
        createDefaultRoot: () =>
          leaf("open-shelf", {
            id: "opening-primary",
            label: "Open Shelf",
            shelfCount: 3,
          }),
      };
    case "almirah":
      return {
        family: "almirah",
        supportsOpenings: true,
        allowedContentTypes: ["door", "drawer-stack", "open-shelf", "divider"],
        allowVerticalSplit: true,
        allowHorizontalSplit: true,
        maxSplitDepth: 2,
        maxLeaves: 4,
        defaultToeKick: true,
        notes: "Almirahs support wardrobe-style splits and mixed storage openings.",
        createDefaultRoot: (widthMm) =>
          leaf("door", {
            id: "opening-primary",
            label: "Wardrobe Opening",
            doorStyle: widthMm < 600 ? "single" : "double",
            shelfCount: 4,
          }),
      };
    default:
      return {
        family: type,
        supportsOpenings: supportsShelves(type) || supportsDoors(type) || supportsDrawers(type),
        allowedContentTypes: ["door", "open-shelf", "empty"],
        allowVerticalSplit: false,
        allowHorizontalSplit: false,
        maxSplitDepth: 0,
        maxLeaves: 1,
        defaultToeKick: supportsToeKick(type),
        notes: "Generic storage opening rules.",
        createDefaultRoot: () =>
          leaf(supportsDoors(type) ? "door" : "open-shelf", {
            id: "opening-primary",
            label: "Primary Opening",
          }),
      };
  }
}

export function listFamilyOpeningSummaries() {
  const families: CabinetType[] = [
    "base",
    "wall",
    "tall",
    "drawer",
    "sink",
    "corner",
    "open-shelf",
  ];
  return families.map((family) => {
    const rules = getFamilyOpeningRules(family);
    return {
      family,
      allowedContentTypes: rules.allowedContentTypes,
      allowVerticalSplit: rules.allowVerticalSplit,
      allowHorizontalSplit: rules.allowHorizontalSplit,
      notes: rules.notes,
    };
  });
}
