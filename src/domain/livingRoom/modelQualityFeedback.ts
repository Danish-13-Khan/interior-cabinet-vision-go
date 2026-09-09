/** Review/viewport copy for adapter, assembly, and catalog preview quality (Step 6). */

import { validateCabinetAssembly } from "../cabinetAssembly";
import type { InteriorProject } from "../interiorProject";
import { cabinetFromObject } from "../interiorProject/cabinetAdapterCabinets";
import { getLivingRoomObjectAdapter } from "./sceneAdapters";
import { compileCabinet, isCabinetGeometryFallback } from "./sceneAdaptersCabinet";

export const MODEL_GLB_FALLBACK_EVENT = "cabinet-studio-model-glb-fallback";

export type ModelQualityKind = "adapter" | "assembly" | "preview";

export type ModelQualityIssue = {
  id: string;
  code: string;
  severity: "error" | "warning" | "info";
  title: string;
  detail: string;
  objectId: string | null;
  /** True when proposal/client export gates treat this as blocking. */
  blocking: boolean;
  kind: ModelQualityKind;
};

export function reportModelGlbFallback(detail?: { objectId?: string }) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(MODEL_GLB_FALLBACK_EVENT, { detail }));
}

export function catalogPreviewFallbackLabel(hasThumbnail: boolean): string | null {
  return hasThumbnail ? null : "No preview";
}

function activeRoomObjects(project: InteriorProject) {
  return project.objects.filter((object) => object.roomId === project.activeRoomId);
}

/** Map existing compile/assembly signals into Review rows — no new math. */
export function collectModelQualityIssues(project: InteriorProject): ModelQualityIssue[] {
  const issues: ModelQualityIssue[] = [];

  for (const object of activeRoomObjects(project)) {
    const adapter = getLivingRoomObjectAdapter(object.catalogItemId);

    if (!adapter) {
      issues.push({
        id: `missing-adapter:${object.id}`,
        code: "missing-adapter",
        severity: "warning",
        title: `Missing adapter · ${object.name}`,
        detail: "No production adapter for this catalog item; a placeholder box is shown.",
        objectId: object.id,
        blocking: object.kind === "cabinet",
        kind: "adapter",
      });
    } else if (adapter.id === "corner-wardrobe-v1") {
      issues.push({
        id: `preview-corner:${object.id}`,
        code: "preview-corner-adapter",
        severity: "info",
        title: `Simplified corner preview · ${object.name}`,
        detail: "Corner uses an L-box preview adapter, not full shared cabinet assembly geometry.",
        objectId: object.id,
        blocking: false,
        kind: "adapter",
      });
    } else if (adapter.compile === compileCabinet) {
      const primitives = compileCabinet(object);
      if (isCabinetGeometryFallback(primitives)) {
        issues.push({
          id: `geometry-fallback:${object.id}`,
          code: "geometry-fallback",
          severity: "error",
          title: `Safe fallback · ${object.name}`,
          detail: "Cabinet geometry could not compile; labeled fallback is shown. Blocks proposal export.",
          objectId: object.id,
          blocking: true,
          kind: "adapter",
        });
      }
    }

    const cabinet = cabinetFromObject(object);
    if (!cabinet) continue;
    for (const assembly of validateCabinetAssembly(cabinet.config)) {
      if (assembly.severity === "info") continue;
      issues.push({
        id: `assembly:${object.id}:${assembly.code}:${assembly.openingId ?? "root"}`,
        code: `assembly-${assembly.code}`,
        severity: assembly.severity === "error" ? "error" : "warning",
        title: `${object.name}: ${assembly.message}`,
        detail: assembly.severity === "error"
          ? "Assembly check failed — open Build check in the cabinet editor."
          : "Assembly warning — review openings in the cabinet editor.",
        objectId: object.id,
        blocking: assembly.severity === "error",
        kind: "assembly",
      });
    }
  }

  return issues;
}

export function modelQualityBlockingCount(issues: readonly ModelQualityIssue[]): number {
  return issues.filter((issue) => issue.blocking).length;
}

export function modelQualitySeverityClass(issue: ModelQualityIssue): "is-error" | "is-warning" | "is-info" {
  if (issue.severity === "error") return "is-error";
  if (issue.severity === "warning") return "is-warning";
  return "is-info";
}
