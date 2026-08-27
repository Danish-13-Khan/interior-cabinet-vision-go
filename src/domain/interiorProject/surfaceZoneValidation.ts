import { polygonSelfIntersects, polygonSignedArea } from "./roomGeometry";
import { isGeneratedRoomSurface, surfaceZoneFitsRoom } from "./surfaceEditing";
import type { InteriorProject, InteriorValidationIssue } from "./types";

export function validateSurfaceZones(
  project: InteriorProject,
  issues: InteriorValidationIssue[],
) {
  for (const surface of project.surfaces) {
    if (isGeneratedRoomSurface(surface)) continue;
    const path = `surfaces.${surface.id}`;
    const polygon = surface.polygon ?? [];
    if (!surface.roomId || polygon.length < 3
      || Math.abs(polygonSignedArea(polygon)) < 10_000
      || polygonSelfIntersects(polygon)) {
      issues.push({ severity: "error", code: "surface-zone-invalid", path,
        message: "Surface zones need a valid non-crossing polygon.", repaired: false });
      continue;
    }
    if (!surfaceZoneFitsRoom(project, surface.roomId, polygon)) {
      issues.push({ severity: "error", code: "surface-zone-outside-room", path,
        message: "Surface zones must stay inside their room boundary.", repaired: false });
    }
    if (surface.materialId
      && !project.materials.some((material) => material.id === surface.materialId)) {
      issues.push({ severity: "warning", code: "surface-zone-material-missing", path,
        message: "Surface zone references an unknown material.", repaired: false });
    }
  }
}
