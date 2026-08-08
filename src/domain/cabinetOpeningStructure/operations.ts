import type { CabinetType } from "../cabinetCapabilities";
import {
  supportsDrawers,
  supportsShelves,
} from "../cabinetCapabilities";
import { getFamilyOpeningRules } from "../cabinetFamilyRules";
import type {
  OpeningContentType,
  OpeningLeaf,
  OpeningSplit,
  OpeningStructure,
  OpeningSplitAxis,
} from "./types";
import { nextOpeningId } from "./ids";
import {
  collectOpeningLeaves,
  createOpeningLeaf,
  findOpeningNode,
  mapOpeningNode,
} from "./queries";
import { normalizeLeaf, normalizeOpeningStructure } from "./normalize";

export function splitOpening(
  structure: OpeningStructure,
  openingId: string,
  axis: OpeningSplitAxis,
  type: CabinetType,
  widthMm: number,
): OpeningStructure {
  const rules = getFamilyOpeningRules(type);
  if (axis === "horizontal" && !rules.allowHorizontalSplit) return structure;
  if (axis === "vertical" && !rules.allowVerticalSplit) return structure;

  const target = findOpeningNode(structure.root, openingId);
  if (!target || target.kind !== "leaf") return structure;

  const leaves = collectOpeningLeaves(structure.root);
  if (leaves.length >= rules.maxLeaves) return structure;

  const left = normalizeLeaf(
    {
      ...target,
      id: nextOpeningId("opening"),
      label: `${target.label} A`,
      ratio: 0.5,
    },
    type,
    widthMm,
  );
  const rightContent =
    axis === "horizontal" && supportsDrawers(type) && target.contentType === "door"
      ? "drawer-stack"
      : target.contentType;
  const right = normalizeLeaf(
    createOpeningLeaf(rightContent, {
      label: `${target.label} B`,
      ratio: 0.5,
      doorStyle: target.doorStyle,
      drawerCount: rightContent === "drawer-stack" ? 2 : target.drawerCount,
      shelfCount: target.shelfCount,
    }),
    type,
    widthMm,
  );

  const splitNode: OpeningSplit = {
    kind: "split",
    id: nextOpeningId("split"),
    label: axis === "horizontal" ? "Stacked Openings" : "Side-by-side Openings",
    axis,
    children: [left, right],
  };

  const root = mapOpeningNode(structure.root, (node) =>
    node.id === openingId ? splitNode : node,
  );

  return normalizeOpeningStructure(
    type,
    { root, activeOpeningId: left.id },
    widthMm,
  );
}

export function setOpeningContentType(
  structure: OpeningStructure,
  openingId: string,
  contentType: OpeningContentType,
  type: CabinetType,
  widthMm: number,
): OpeningStructure {
  const rules = getFamilyOpeningRules(type);
  if (!rules.allowedContentTypes.includes(contentType)) return structure;

  const root = mapOpeningNode(structure.root, (node) => {
    if (node.id !== openingId || node.kind !== "leaf") return node;
    return normalizeLeaf(
      {
        ...node,
        contentType,
        doorStyle: contentType === "door" ? (widthMm < 600 ? "single" : "double") : "none",
        drawerCount: contentType === "drawer-stack" ? Math.max(1, node.drawerCount ?? 3) : 0,
        shelfCount:
          contentType === "open-shelf"
            ? Math.max(1, node.shelfCount ?? 2)
            : contentType === "door" && supportsShelves(type)
              ? node.shelfCount ?? 1
              : 0,
      },
      type,
      widthMm,
    );
  });

  return normalizeOpeningStructure(
    type,
    { root, activeOpeningId: openingId },
    widthMm,
  );
}

export function updateOpeningLeaf(
  structure: OpeningStructure,
  openingId: string,
  patch: Partial<OpeningLeaf>,
  type: CabinetType,
  widthMm: number,
): OpeningStructure {
  const root = mapOpeningNode(structure.root, (node) => {
    if (node.id !== openingId || node.kind !== "leaf") return node;
    return normalizeLeaf({ ...node, ...patch, kind: "leaf", id: node.id }, type, widthMm);
  });
  return normalizeOpeningStructure(
    type,
    { root, activeOpeningId: openingId },
    widthMm,
  );
}

export function setActiveOpening(
  structure: OpeningStructure,
  openingId: string,
): OpeningStructure {
  const exists = findOpeningNode(structure.root, openingId);
  if (!exists) return structure;
  return { ...structure, activeOpeningId: openingId };
}
