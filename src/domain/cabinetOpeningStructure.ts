import type { CabinetType } from "./cabinetCapabilities";
import {
  supportsDoors,
  supportsDrawers,
  supportsShelves,
} from "./cabinetCapabilities";
import { getFamilyOpeningRules } from "./cabinetFamilyRules";

export type OpeningContentType =
  | "door"
  | "drawer-stack"
  | "open-shelf"
  | "divider"
  | "empty";

export type OpeningSplitAxis = "horizontal" | "vertical";

export type DoorStyle = "none" | "single" | "double" | "bi-fold";
export type DoorHinge = "left" | "right" | "both";
export type OpeningStyle = "door" | "drawer" | "open" | "mixed";

export type OpeningLeaf = {
  kind: "leaf";
  id: string;
  label: string;
  contentType: OpeningContentType;
  /** Share of parent split, 0.05–0.95 */
  ratio: number;
  doorStyle?: DoorStyle;
  doorHinge?: DoorHinge;
  drawerCount?: number;
  shelfCount?: number;
  shelvesAdjustable?: boolean;
};

export type OpeningSplit = {
  kind: "split";
  id: string;
  label: string;
  axis: OpeningSplitAxis;
  children: OpeningNode[];
};

export type OpeningNode = OpeningLeaf | OpeningSplit;

export type OpeningStructure = {
  root: OpeningNode;
  activeOpeningId: string;
};

let openingIdCounter = 0;

function nextOpeningId(prefix: string) {
  openingIdCounter += 1;
  return `${prefix}-${openingIdCounter}`;
}

export function resetOpeningIdCounterForTests() {
  openingIdCounter = 0;
}

function clampRatio(value: number, fallback = 0.5): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(0.95, Math.max(0.05, value));
}

function contentTypeToOpeningStyle(contentType: OpeningContentType): OpeningStyle {
  switch (contentType) {
    case "door":
      return "door";
    case "drawer-stack":
      return "drawer";
    case "open-shelf":
    case "empty":
      return "open";
    case "divider":
      return "mixed";
    default:
      return "open";
  }
}

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

function mapOpeningNode(
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

function normalizeLeaf(
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
    drawerCount:
      contentType === "drawer-stack"
        ? Math.min(8, Math.max(1, Math.round(leaf.drawerCount ?? 3)))
        : 0,
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
  const ratioSum = children.reduce((sum, child) => sum + (child.kind === "leaf" ? child.ratio : 0.5), 0) || 1;
  const normalizedChildren = children.map((child) => {
    if (child.kind !== "leaf") return child;
    return { ...child, ratio: clampRatio(child.ratio / ratioSum, 1 / children.length) };
  });

  const leaves = normalizedChildren.flatMap((child) => collectOpeningLeaves(child));
  if (leaves.length > rules.maxLeaves) {
    return normalizeLeaf(leaves[0], type, widthMm);
  }

  return {
    kind: "split",
    id: node.id || nextOpeningId("split"),
    label: node.label.trim() || (axis === "horizontal" ? "Horizontal Split" : "Vertical Split"),
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

export { contentTypeToOpeningStyle };
