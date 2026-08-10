import type { CabinetType } from "../cabinetCapabilities";
import {
  supportsDrawers,
  supportsShelves,
} from "../cabinetCapabilities";
import { getFamilyOpeningRules } from "../cabinetFamilyRules";
import type {
  OpeningContentType,
  OpeningLeaf,
  OpeningNode,
  OpeningSplit,
  OpeningStructure,
  OpeningSplitAxis,
} from "./types";
import { nextOpeningId } from "./ids";
import {
  collectOpeningLeaves,
  createOpeningLeaf,
  findOpeningParent,
  findOpeningNode,
  getOpeningNodeRatio,
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

  const createDrawerOverDoor =
    axis === "horizontal" &&
    supportsDrawers(type) &&
    target.contentType === "door";
  const leftContent = createDrawerOverDoor ? "drawer-stack" : target.contentType;
  const left = normalizeLeaf(
    {
      ...target,
      id: nextOpeningId("opening"),
      label: `${target.label} A`,
      contentType: leftContent,
      ratio: 0.5,
      drawerCount: leftContent === "drawer-stack" ? 2 : target.drawerCount,
    },
    type,
    widthMm,
  );
  const rightContent = target.contentType;
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
    ratio: target.ratio,
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

function replaceNode(
  node: OpeningNode,
  nodeId: string,
  replacement: OpeningNode,
): OpeningNode {
  if (node.id === nodeId) return replacement;
  if (node.kind === "leaf") return node;
  return {
    ...node,
    children: node.children.map((child) => replaceNode(child, nodeId, replacement)),
  };
}

function updateSplitChildren(
  node: OpeningNode,
  splitId: string,
  children: OpeningNode[],
): OpeningNode {
  if (node.kind === "leaf") return node;
  if (node.id === splitId) return { ...node, children };
  return {
    ...node,
    children: node.children.map((child) =>
      updateSplitChildren(child, splitId, children),
    ),
  };
}

export function setOpeningRatio(
  structure: OpeningStructure,
  openingId: string,
  ratio: number,
  type: CabinetType,
  widthMm: number,
): OpeningStructure {
  const parent = findOpeningParent(structure.root, openingId);
  if (!parent) return structure;
  const targetIndex = parent.children.findIndex((child) => child.id === openingId);
  if (targetIndex < 0) return structure;

  const targetRatio = Math.min(0.95, Math.max(0.05, ratio));
  const otherTotal = parent.children.reduce(
    (sum, child, index) =>
      index === targetIndex ? sum : sum + getOpeningNodeRatio(child),
    0,
  );
  const remaining = 1 - targetRatio;
  const otherCount = parent.children.length - 1;
  const children = parent.children.map((child, index) => {
    const nextRatio =
      index === targetIndex
        ? targetRatio
        : otherTotal > 0
          ? remaining * (getOpeningNodeRatio(child) / otherTotal)
          : remaining / Math.max(1, otherCount);
    return { ...child, ratio: nextRatio };
  });

  return normalizeOpeningStructure(
    type,
    {
      root: updateSplitChildren(structure.root, parent.id, children),
      activeOpeningId: openingId,
    },
    widthMm,
  );
}

export function mergeOpening(
  structure: OpeningStructure,
  openingId: string,
  type: CabinetType,
  widthMm: number,
): OpeningStructure {
  const target = findOpeningNode(structure.root, openingId);
  const parent = findOpeningParent(structure.root, openingId);
  if (!target || target.kind !== "leaf" || !parent) return structure;

  const merged = { ...target, ratio: parent.ratio ?? 1 };
  return normalizeOpeningStructure(
    type,
    {
      root: replaceNode(structure.root, parent.id, merged),
      activeOpeningId: merged.id,
    },
    widthMm,
  );
}

export function deleteOpening(
  structure: OpeningStructure,
  openingId: string,
  type: CabinetType,
  widthMm: number,
): OpeningStructure {
  const parent = findOpeningParent(structure.root, openingId);
  if (!parent) return structure;
  const remaining = parent.children.filter((child) => child.id !== openingId);
  if (remaining.length === parent.children.length || remaining.length === 0) {
    return structure;
  }

  const replacement =
    remaining.length === 1
      ? { ...remaining[0]!, ratio: parent.ratio ?? 1 }
      : { ...parent, children: remaining };
  const root = replaceNode(structure.root, parent.id, replacement);
  const activeOpeningId = collectOpeningLeaves(replacement)[0]?.id;
  if (!activeOpeningId) return structure;
  return normalizeOpeningStructure(type, { root, activeOpeningId }, widthMm);
}
