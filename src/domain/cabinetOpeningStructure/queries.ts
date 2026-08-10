import type { CabinetType } from "../cabinetCapabilities";
import { getFamilyOpeningRules } from "../cabinetFamilyRules";
import type {
  DoorHinge,
  DoorStyle,
  OpeningContentType,
  OpeningLeaf,
  OpeningNode,
  OpeningSplit,
  OpeningStructure,
  OpeningStyle,
} from "./types";
import { clampRatio, nextOpeningId } from "./ids";

export function createOpeningLeaf(
  contentType: OpeningContentType,
  options: Partial<Omit<OpeningLeaf, "kind" | "contentType">> = {},
): OpeningLeaf {
  const label =
    options.label ??
    (contentType === "door"
      ? "Door Opening"
      : contentType === "drawer-stack"
        ? "Drawer Stack"
        : contentType === "open-shelf"
          ? "Open Shelf"
          : contentType === "divider"
            ? "Divider Section"
            : "Empty Opening");

  return {
    kind: "leaf",
    id: options.id ?? nextOpeningId("opening"),
    label,
    contentType,
    ratio: clampRatio(options.ratio ?? 1),
    doorStyle: options.doorStyle ?? (contentType === "door" ? "double" : "none"),
    doorHinge: options.doorHinge ?? "left",
    drawerCount: options.drawerCount ?? (contentType === "drawer-stack" ? 3 : 0),
    drawerRatios: options.drawerRatios,
    shelfCount: options.shelfCount ?? (contentType === "open-shelf" ? 2 : 0),
    shelvesAdjustable: options.shelvesAdjustable ?? true,
  };
}

export function createDefaultOpeningStructure(
  type: CabinetType,
  widthMm: number,
): OpeningStructure {
  const rules = getFamilyOpeningRules(type);
  const root = rules.createDefaultRoot(widthMm);
  const leaves = collectOpeningLeaves(root);
  return {
    root,
    activeOpeningId: leaves[0]?.id ?? root.id,
  };
}

export function collectOpeningLeaves(node: OpeningNode): OpeningLeaf[] {
  if (node.kind === "leaf") return [node];
  return node.children.flatMap((child) => collectOpeningLeaves(child));
}

export function collectOpeningNodes(node: OpeningNode): OpeningNode[] {
  if (node.kind === "leaf") return [node];
  return [node, ...node.children.flatMap((child) => collectOpeningNodes(child))];
}

export function getOpeningNodeRatio(node: OpeningNode): number {
  return clampRatio(node.ratio ?? 1, 1);
}

export function findOpeningParent(
  node: OpeningNode,
  childId: string,
): OpeningSplit | null {
  if (node.kind === "leaf") return null;
  if (node.children.some((child) => child.id === childId)) return node;
  for (const child of node.children) {
    const found = findOpeningParent(child, childId);
    if (found) return found;
  }
  return null;
}

export function findOpeningNode(node: OpeningNode, id: string): OpeningNode | null {
  if (node.id === id) return node;
  if (node.kind === "leaf") return null;
  for (const child of node.children) {
    const found = findOpeningNode(child, id);
    if (found) return found;
  }
  return null;
}

export function getActiveOpeningLeaf(structure: OpeningStructure): OpeningLeaf | null {
  const active = findOpeningNode(structure.root, structure.activeOpeningId);
  if (active?.kind === "leaf") return active;
  return collectOpeningLeaves(structure.root)[0] ?? null;
}

export function mapOpeningNode(
  node: OpeningNode,
  mapper: (current: OpeningNode) => OpeningNode,
): OpeningNode {
  const mapped = mapper(node);
  if (mapped.kind === "leaf") return mapped;
  return {
    ...mapped,
    children: mapped.children.map((child) => mapOpeningNode(child, mapper)),
  };
}

export function describeOpeningStructure(structure: OpeningStructure): string {
  const leaves = collectOpeningLeaves(structure.root);
  if (leaves.length === 0) return "No openings";
  return leaves
    .map((leaf) => `${leaf.label}:${leaf.contentType}`)
    .join(" | ");
}

export function openingStructureToLegacyStyle(structure: OpeningStructure): OpeningStyle {
  const leaves = collectOpeningLeaves(structure.root);
  const types = new Set(leaves.map((leaf) => leaf.contentType));
  if (types.has("door") && types.has("drawer-stack")) return "mixed";
  if (types.has("door")) return "door";
  if (types.has("drawer-stack")) return "drawer";
  if (types.has("open-shelf") || types.has("empty")) return "open";
  if (types.has("divider")) return "mixed";
  return "open";
}

export function aggregateOpeningMetrics(structure: OpeningStructure): {
  doorCount: number;
  hasDoors: boolean;
  doorStyle: DoorStyle;
  doorHinge: DoorHinge;
  drawerCount: number;
  shelfCount: number;
  shelvesAdjustable: boolean;
  dividerCount: number;
} {
  const leaves = collectOpeningLeaves(structure.root);
  const doorLeaves = leaves.filter((leaf) => leaf.contentType === "door");
  const drawerLeaves = leaves.filter((leaf) => leaf.contentType === "drawer-stack");
  const shelfBearingLeaves = leaves.filter(
    (leaf) => leaf.contentType === "open-shelf" || leaf.contentType === "door",
  );
  const dividerLeaves = leaves.filter((leaf) => leaf.contentType === "divider");

  let doorCount = 0;
  let doorStyle: DoorStyle = "none";
  let doorHinge: DoorHinge = "both";

  for (const leaf of doorLeaves) {
    const style = leaf.doorStyle && leaf.doorStyle !== "none" ? leaf.doorStyle : "double";
    doorStyle = style;
    doorHinge = leaf.doorHinge ?? "left";
    doorCount += style === "single" ? 1 : style === "bi-fold" ? 2 : 2;
  }

  return {
    doorCount,
    hasDoors: doorLeaves.length > 0,
    doorStyle: doorLeaves.length > 0 ? doorStyle : "none",
    doorHinge,
    drawerCount: drawerLeaves.reduce((sum, leaf) => sum + (leaf.drawerCount ?? 0), 0),
    shelfCount: shelfBearingLeaves.reduce((sum, leaf) => sum + (leaf.shelfCount ?? 0), 0),
    shelvesAdjustable: shelfBearingLeaves.some((leaf) => leaf.shelvesAdjustable !== false),
    dividerCount: dividerLeaves.length,
  };
}
