import type { CabinetType } from "../cabinetCapabilities";
import { supportsShelves } from "../cabinetCapabilities";
import { getFamilyOpeningRules } from "../cabinetFamilyRules";
import type {
  OpeningLeaf,
  OpeningNode,
  OpeningStructure,
} from "./types";
import { clampRatio, nextOpeningId } from "./ids";
import {
  collectOpeningLeaves,
  createDefaultOpeningStructure,
  createOpeningLeaf,
} from "./queries";

export function normalizeLeaf(
  leaf: OpeningLeaf,
  type: CabinetType,
  widthMm: number,
): OpeningLeaf {
  const rules = getFamilyOpeningRules(type);
  let contentType = leaf.contentType;
  if (!rules.allowedContentTypes.includes(contentType)) {
    contentType = rules.allowedContentTypes[0] ?? "empty";
  }

  const doorStyle =
    contentType === "door"
      ? leaf.doorStyle && leaf.doorStyle !== "none"
        ? leaf.doorStyle
        : widthMm < 600
          ? "single"
          : "double"
      : "none";

  const drawerCount =
    contentType === "drawer-stack"
      ? Math.min(8, Math.max(1, Math.round(leaf.drawerCount ?? 3)))
      : 0;
  const rawDrawerRatios =
    contentType === "drawer-stack" && leaf.drawerRatios?.length === drawerCount
      ? leaf.drawerRatios.map((ratio) =>
          Number.isFinite(ratio) ? Math.max(0.08, ratio) : 1,
        )
      : undefined;
  const drawerRatioTotal = rawDrawerRatios?.reduce((sum, ratio) => sum + ratio, 0) ?? 0;

  return {
    ...leaf,
    kind: "leaf",
    label: leaf.label.trim() || "Opening",
    contentType,
    ratio: clampRatio(leaf.ratio, 1),
    doorStyle,
    doorHinge:
      doorStyle === "single"
        ? leaf.doorHinge === "right"
          ? "right"
          : "left"
        : "both",
    drawerCount,
    drawerRatios:
      rawDrawerRatios && drawerRatioTotal > 0
        ? rawDrawerRatios.map((ratio) => ratio / drawerRatioTotal)
        : undefined,
    shelfCount:
      contentType === "open-shelf"
        ? Math.min(6, Math.max(0, Math.round(leaf.shelfCount ?? 2)))
        : contentType === "door" && supportsShelves(type)
          ? Math.min(6, Math.max(0, Math.round(leaf.shelfCount ?? 1)))
          : 0,
    shelvesAdjustable: Boolean(leaf.shelvesAdjustable ?? true),
  };
}

function normalizeNode(
  node: OpeningNode,
  type: CabinetType,
  widthMm: number,
  depth: number,
): OpeningNode {
  const rules = getFamilyOpeningRules(type);
  if (node.kind === "leaf" || depth >= rules.maxSplitDepth) {
    if (node.kind === "split") {
      // Collapse deepest illegal splits into first child leaf/default
      const firstLeaf = collectOpeningLeaves(node)[0];
      return normalizeLeaf(
        firstLeaf ?? createOpeningLeaf(rules.allowedContentTypes[0] ?? "empty"),
        type,
        widthMm,
      );
    }
    return normalizeLeaf(node, type, widthMm);
  }

  const children = node.children
    .slice(0, Math.max(2, Math.min(node.children.length, 4)))
    .map((child) => normalizeNode(child, type, widthMm, depth + 1));

  while (children.length < 2) {
    children.push(
      normalizeLeaf(
        createOpeningLeaf(rules.allowedContentTypes[0] ?? "empty", {
          ratio: 0.5,
        }),
        type,
        widthMm,
      ),
    );
  }

  const axis =
    node.axis === "vertical" && rules.allowVerticalSplit
      ? "vertical"
      : node.axis === "horizontal" && rules.allowHorizontalSplit
        ? "horizontal"
        : rules.allowHorizontalSplit
          ? "horizontal"
          : "vertical";

  // Normalize ratios to sum ~1
  const ratioSum = children.reduce(
    (sum, child) => sum + clampRatio(child.ratio ?? 1, 1),
    0,
  ) || 1;
  const normalizedChildren = children.map((child) => {
    const normalizedRatio = clampRatio(
      (child.ratio ?? 1) / ratioSum,
      1 / children.length,
    );
    return { ...child, ratio: normalizedRatio };
  });

  const leaves = normalizedChildren.flatMap((child) => collectOpeningLeaves(child));
  if (leaves.length > rules.maxLeaves) {
    return normalizeLeaf(leaves[0], type, widthMm);
  }

  return {
    kind: "split",
    id: node.id || nextOpeningId("split"),
    label: node.label.trim() || (axis === "horizontal" ? "Horizontal Split" : "Vertical Split"),
    ratio: clampRatio(node.ratio ?? 1, 1),
    axis,
    children: normalizedChildren,
  };
}

export function normalizeOpeningStructure(
  type: CabinetType,
  structure: OpeningStructure | undefined,
  widthMm: number,
): OpeningStructure {
  const rules = getFamilyOpeningRules(type);
  if (!rules.supportsOpenings) {
    const empty = createOpeningLeaf("empty", { id: "opening-none", label: "None", ratio: 1 });
    return { root: empty, activeOpeningId: empty.id };
  }

  const seed = structure ?? createDefaultOpeningStructure(type, widthMm);
  const root = normalizeNode(seed.root, type, widthMm, 0);
  const leaves = collectOpeningLeaves(root);
  const active =
    leaves.find((leaf) => leaf.id === seed.activeOpeningId)?.id ??
    leaves[0]?.id ??
    root.id;

  return {
    root,
    activeOpeningId: active,
  };
}
