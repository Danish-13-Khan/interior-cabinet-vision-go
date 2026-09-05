import type { ArchitecturalScene } from "./archSceneTypes";
import { distMm } from "../proposalGeom";

export type PlacementConstraint = {
  wallId: string;
  lengthMm: number;
  usableMm: number;
  clearancesMm: { left: number; right: number };
  cornerIds: string[];
  blockedByOpenings: string[];
};

/** G-12.4 cabinet placement constraints from scene. */
export function buildPlacementConstraints(scene: ArchitecturalScene): PlacementConstraint[] {
  return scene.walls.map((w) => {
    const lengthMm = distMm(w.start, w.end);
    const openings = scene.openings.filter((o) => o.wallId === w.id);
    const blocked = openings.reduce((s, o) => s + o.widthMm, 0);
    const corners = [w.junctionStartId, w.junctionEndId].filter(Boolean) as string[];
    return {
      wallId: w.id,
      lengthMm,
      usableMm: Math.max(0, lengthMm - blocked - 100), // 50mm each end clearance
      clearancesMm: { left: 50, right: 50 },
      cornerIds: corners,
      blockedByOpenings: openings.map((o) => o.id),
    };
  });
}
