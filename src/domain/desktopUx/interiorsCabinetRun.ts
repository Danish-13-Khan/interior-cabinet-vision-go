import { isCabinetRunFiller } from "../livingRoom/wardrobePlacement";
import { cabinetRunForObject } from "../livingRoom/cabinetRunLayout";
import type { InteriorProject } from "../interiorProject";
import type { LivingRoomCatalogItem, LivingRoomPlanIssue } from "../livingRoom";
import type { InteriorsChromeTool } from "./interiorsChrome";
import { INTERIORS_CHROME_TOOLS } from "./interiorsChrome";

export const INTERIORS_CABINET_RUN_FAMILY_ORDER = [
  "base", "drawer", "wall", "tall", "open-shelf",
] as const;

export function isInteriorsCabinetRunTool(tool: InteriorsChromeTool): boolean {
  return INTERIORS_CHROME_TOOLS.find((item) => item.id === tool)?.group === "design";
}

export function interiorsCabinetRunHint(tool: InteriorsChromeTool): string {
  if (tool === "run") return "Select cabinets on a wall, then snap them into a run";
  if (tool === "shelf") return "Place an open shelf on the selected wall";
  if (tool === "material") return "Paint the selection, wall, floor, or ceiling";
  return "Place a cabinet family on the selected wall";
}

export function interiorsCabinetRunFamilyItems(
  tool: InteriorsChromeTool,
  catalog: readonly LivingRoomCatalogItem[],
): LivingRoomCatalogItem[] {
  const cabinets = catalog.filter((item) => item.kind === "cabinet" && item.familyId);
  if (tool === "material") return [];
  if (tool === "shelf") return cabinets.filter((item) => item.cabinetType === "open-shelf");
  return INTERIORS_CABINET_RUN_FAMILY_ORDER.flatMap((type) =>
    cabinets.filter((item) => item.cabinetType === type),
  );
}

export function interiorsCabinetRunCounts(project: InteriorProject) {
  const roomId = project.activeRoomId;
  const cabinets = project.objects.filter((item) => item.kind === "cabinet" && item.roomId === roomId);
  const fillers = cabinets.filter(isCabinetRunFiller);
  const runIds = new Set(
    cabinets.map(cabinetRunForObject).flatMap((run) => (run?.runId ? [run.runId] : [])),
  );
  return {
    cabinetCount: cabinets.length - fillers.length,
    fillerCount: fillers.length,
    runCount: runIds.size,
  };
}

export function interiorsCabinetRunCountLabel(counts: ReturnType<typeof interiorsCabinetRunCounts>): string {
  const cabinets = `${counts.cabinetCount} cabinet${counts.cabinetCount === 1 ? "" : "s"}`;
  const fillers = `${counts.fillerCount} filler${counts.fillerCount === 1 ? "" : "s"}`;
  const runs = `${counts.runCount} run${counts.runCount === 1 ? "" : "s"}`;
  return `${cabinets} · ${fillers} · ${runs}`;
}

export function interiorsCabinetRunWarnings(
  issues: readonly LivingRoomPlanIssue[],
  selectedIds: readonly string[],
): LivingRoomPlanIssue[] {
  if (selectedIds.length === 0) return [...issues];
  const selected = new Set(selectedIds);
  const beside = issues.filter((issue) => issue.objectIds.some((id) => selected.has(id)));
  return beside.length ? beside : [...issues];
}

export function interiorsCabinetRunAttachedWallId(object: {
  extensions?: Record<string, unknown>;
}): string | null {
  const value = object.extensions?.wallAttachment;
  if (!value || typeof value !== "object") return null;
  const wallId = (value as { wallId?: unknown }).wallId;
  return typeof wallId === "string" && wallId ? wallId : null;
}

export type InteriorsCabinetRunSnapTarget = {
  wallId: string | null;
  warning: string | null;
};

export function interiorsCabinetRunSnapTarget(
  cabinets: readonly { id: string; extensions?: Record<string, unknown> }[],
): InteriorsCabinetRunSnapTarget {
  if (cabinets.length < 2) {
    return { wallId: null, warning: null };
  }
  const walls = cabinets.map((item) => interiorsCabinetRunAttachedWallId(item));
  if (walls.some((wallId) => !wallId)) {
    return { wallId: null, warning: "Snap each cabinet to a wall before creating a run" };
  }
  const unique = [...new Set(walls as string[])];
  if (unique.length > 1) {
    return {
      wallId: null,
      warning: "Select cabinets on one wall. Mixed-wall selections cannot snap into a run.",
    };
  }
  return { wallId: unique[0] ?? null, warning: null };
}
