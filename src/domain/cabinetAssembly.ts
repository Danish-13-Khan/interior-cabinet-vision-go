import { isStorageType, type CabinetConfig } from "./cabinetDimensions";
import { resolveCabinetComposition } from "./cabinetComposition";
import {
  collectOpeningLeaves,
  type OpeningNode,
} from "./cabinetOpeningStructure";
import { getMaxUnsupportedShelfSpanMm } from "./manufacturingRules/limits";
import { resolveCabinetMaterialSpec } from "./materialSystem";
import { layoutCabinetElevationFace } from "./openingLayout";
import type { OpeningFaceRect } from "./openingLayout";

export type AssemblyIssue = {
  code: string;
  severity: "info" | "warning" | "error";
  openingId?: string;
  message: string;
};

export type CabinetAssemblySummary = {
  openingCount: number;
  doorCount: number;
  drawerCount: number;
  shelfCount: number;
  verticalDividers: number;
  horizontalPartitions: number;
};

export type AssemblyBoundary = {
  axis: "vertical" | "horizontal";
  positionMm: number;
  startMm: number;
  endMm: number;
};

export function collectAssemblyBoundaries(
  openings: OpeningFaceRect[],
): AssemblyBoundary[] {
  const boundaries = new Map<string, AssemblyBoundary>();
  const close = (a: number, b: number) => Math.abs(a - b) < 0.8;
  for (let i = 0; i < openings.length; i += 1) {
    for (let j = i + 1; j < openings.length; j += 1) {
      const a = openings[i]!;
      const b = openings[j]!;
      const aRight = a.xMm + a.widthMm;
      const bRight = b.xMm + b.widthMm;
      const aTop = a.yMm + a.heightMm;
      const bTop = b.yMm + b.heightMm;
      if (close(aRight, b.xMm) || close(bRight, a.xMm)) {
        const positionMm = close(aRight, b.xMm) ? aRight : bRight;
        const startMm = Math.max(a.yMm, b.yMm);
        const endMm = Math.min(aTop, bTop);
        if (endMm - startMm > 1) {
          const key = `v-${Math.round(positionMm)}-${Math.round(startMm)}-${Math.round(endMm)}`;
          boundaries.set(key, { axis: "vertical", positionMm, startMm, endMm });
        }
      }
      if (close(aTop, b.yMm) || close(bTop, a.yMm)) {
        const positionMm = close(aTop, b.yMm) ? aTop : bTop;
        const startMm = Math.max(a.xMm, b.xMm);
        const endMm = Math.min(aRight, bRight);
        if (endMm - startMm > 1) {
          const key = `h-${Math.round(positionMm)}-${Math.round(startMm)}-${Math.round(endMm)}`;
          boundaries.set(key, { axis: "horizontal", positionMm, startMm, endMm });
        }
      }
    }
  }
  return [...boundaries.values()];
}

function splitCounts(node: OpeningNode): {
  verticalDividers: number;
  horizontalPartitions: number;
} {
  if (node.kind === "leaf") {
    return { verticalDividers: 0, horizontalPartitions: 0 };
  }
  const nested = node.children.map(splitCounts);
  return {
    verticalDividers:
      (node.axis === "vertical" ? node.children.length - 1 : 0) +
      nested.reduce((sum, item) => sum + item.verticalDividers, 0),
    horizontalPartitions:
      (node.axis === "horizontal" ? node.children.length - 1 : 0) +
      nested.reduce((sum, item) => sum + item.horizontalPartitions, 0),
  };
}

export function summarizeCabinetAssembly(
  config: CabinetConfig,
): CabinetAssemblySummary {
  const structure = resolveCabinetComposition(config).openingStructure;
  if (!structure || !isStorageType(config.type)) {
    return {
      openingCount: 0,
      doorCount: 0,
      drawerCount: 0,
      shelfCount: 0,
      verticalDividers: 0,
      horizontalPartitions: 0,
    };
  }
  const leaves = collectOpeningLeaves(structure.root);
  const split = splitCounts(structure.root);
  return {
    openingCount: leaves.length,
    doorCount: leaves.reduce((sum, leaf) => {
      if (leaf.contentType !== "door") return sum;
      return sum + (leaf.doorStyle === "single" ? 1 : 2);
    }, 0),
    drawerCount: leaves.reduce(
      (sum, leaf) => sum + (leaf.contentType === "drawer-stack" ? leaf.drawerCount ?? 0 : 0),
      0,
    ),
    shelfCount: leaves.reduce(
      (sum, leaf) =>
        sum +
        (leaf.contentType === "door" || leaf.contentType === "open-shelf"
          ? leaf.shelfCount ?? 0
          : 0),
      0,
    ),
    ...split,
  };
}

export function validateCabinetAssembly(config: CabinetConfig): AssemblyIssue[] {
  if (!isStorageType(config.type)) return [];
  const layout = layoutCabinetElevationFace(config);
  const material = resolveCabinetMaterialSpec(config.buildRules);
  const maxShelfSpan = getMaxUnsupportedShelfSpanMm(
    material.shelfMaterial.thicknessMm,
    material.shelfMaterial.boardMaterialId,
  );
  const issues: AssemblyIssue[] = [];

  for (const opening of layout.openings) {
    if (opening.widthMm < 180 || opening.heightMm < 120) {
      issues.push({
        code: "ASSEMBLY_OPENING_SIZE",
        severity: "error",
        openingId: opening.id,
        message: `${opening.label} is too small at ${Math.round(opening.widthMm)} × ${Math.round(opening.heightMm)} mm.`,
      });
    }

    if (opening.contentType === "door") {
      const leafWidth =
        opening.doorStyle === "single" ? opening.widthMm : opening.widthMm / 2;
      if (leafWidth < 220) {
        issues.push({
          code: "ASSEMBLY_DOOR_WIDTH",
          severity: "warning",
          openingId: opening.id,
          message: `${opening.label} door leaf is only ${Math.round(leafWidth)} mm wide.`,
        });
      }
      if (opening.doorStyle === "double" && opening.widthMm < 500) {
        issues.push({
          code: "ASSEMBLY_DOUBLE_DOOR",
          severity: "warning",
          openingId: opening.id,
          message: `${opening.label} is narrow for double doors; use a single door.`,
        });
      }
    }

    if (opening.contentType === "drawer-stack") {
      const count = Math.max(1, opening.drawerCount);
      const frontHeight = opening.drawerRatios?.length === count
        ? opening.heightMm * Math.min(...opening.drawerRatios)
        : opening.heightMm / count;
      if (frontHeight < 100) {
        issues.push({
          code: "ASSEMBLY_DRAWER_HEIGHT",
          severity: "error",
          openingId: opening.id,
          message: `${opening.label} drawer fronts are about ${Math.round(frontHeight)} mm high; reduce the drawer count.`,
        });
      }
      if (opening.widthMm < 250) {
        issues.push({
          code: "ASSEMBLY_DRAWER_WIDTH",
          severity: "error",
          openingId: opening.id,
          message: `${opening.label} is too narrow for the selected drawer hardware.`,
        });
      }
    }

    if (
      (opening.contentType === "door" || opening.contentType === "open-shelf") &&
      opening.shelfCount > 0
    ) {
      const spacing = opening.heightMm / (opening.shelfCount + 1);
      if (spacing < 120) {
        issues.push({
          code: "ASSEMBLY_SHELF_SPACING",
          severity: "warning",
          openingId: opening.id,
          message: `${opening.label} shelf spacing is only about ${Math.round(spacing)} mm.`,
        });
      }
      if (opening.widthMm > maxShelfSpan) {
        issues.push({
          code: "ASSEMBLY_SHELF_SPAN",
          severity: "warning",
          openingId: opening.id,
          message: `${opening.label} shelf span ${Math.round(opening.widthMm)} mm exceeds the recommended ${maxShelfSpan} mm.`,
        });
      }
    }
  }

  return issues;
}
