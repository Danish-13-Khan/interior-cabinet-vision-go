import { useCallback, useEffect } from "react";
import type { InteriorProject, Point3Mm } from "../domain/interiorProject";
import type { CompiledLivingRoomScene } from "../domain/livingRoom";
import { openingOffsetAtPoint } from "../domain/livingRoom";
import { openingCenterMm } from "../domain/livingRoom/openingCenter";
import type {
  ModelTransformPreview,
  ModelTransformTarget,
} from "../components/livingRoomScene/ModelMoveGizmo";

type Options = {
  project: InteriorProject;
  scene: CompiledLivingRoomScene;
  selectedIds: string[];
  activeOpeningId: string | null;
  snapSizeMm: number;
  onMove: (objectId: string, position: Point3Mm) => void;
  onMovePreview?: (objectId: string, position: Point3Mm) => { position: Point3Mm; rotationY: number } | null | void;
  onUpdateOpening?: (openingId: string, patch: { offsetMm?: number; sillHeightMm?: number }) => void;
  onTransformPreviewChange?: (preview: ModelTransformPreview | null) => void;
};

/** 3D move gizmo target (single object or opening) with snapped preview and commit. */
export function useModelViewTransform({
  project, scene, selectedIds, activeOpeningId, snapSizeMm,
  onMove, onMovePreview, onUpdateOpening, onTransformPreviewChange,
}: Options) {
  const activeObject = selectedIds.length === 1
    ? project.objects.find((object) => object.id === selectedIds[0]) ?? null
    : null;
  const activeObjectOrigin = activeObject
    ? scene.nodes.find((node) => node.sourceObjectId === activeObject.id)?.positionMm ?? activeObject.position
    : null;
  const activeOpening = activeOpeningId
    ? project.openings.find((opening) => opening.id === activeOpeningId) ?? null
    : null;
  const activeOpeningWall = activeOpening
    ? project.walls.find((wall) => wall.id === activeOpening.wallId) ?? null
    : null;
  const openingCenter = activeOpening && activeOpeningWall
    ? openingCenterMm(activeOpening, activeOpeningWall)
    : null;
  const transformTarget: ModelTransformTarget | null = activeObject
    ? { kind: "object", id: activeObject.id, positionMm: activeObjectOrigin ?? activeObject.position }
    : activeOpening && openingCenter
      ? { kind: "opening", id: activeOpening.id, positionMm: openingCenter }
      : null;

  useEffect(() => {
    onTransformPreviewChange?.(null);
  }, [activeObject?.id, activeOpening?.id, onTransformPreviewChange]);

  const resolveTransformPosition = useCallback((target: ModelTransformTarget, proposed: Point3Mm) => {
    let resolved: Point3Mm;
    if (target.kind === "object") {
      const preview = onMovePreview?.(target.id, proposed);
      resolved = preview && typeof preview === "object" ? preview.position : proposed;
      onTransformPreviewChange?.({ ...target, positionMm: resolved });
      return resolved;
    }
    const opening = project.openings.find((item) => item.id === target.id);
    const wall = opening ? project.walls.find((item) => item.id === opening.wallId) : null;
    if (!opening || !wall) return target.positionMm;
    const offsetMm = openingOffsetAtPoint(wall, proposed, opening.widthMm, snapSizeMm);
    const dx = wall.end.x - wall.start.x;
    const dz = wall.end.z - wall.start.z;
    const length = Math.max(1, Math.hypot(dx, dz));
    const center = offsetMm + opening.widthMm / 2;
    resolved = {
      x: wall.start.x + dx / length * center,
      y: Math.min(Math.max(0, wall.heightMm - opening.heightMm), Math.max(0, proposed.y)),
      z: wall.start.z + dz / length * center,
    };
    onTransformPreviewChange?.({ ...target, positionMm: resolved });
    return resolved;
  }, [onMovePreview, onTransformPreviewChange, project.openings, project.walls, snapSizeMm]);

  const commitTransformPosition = useCallback((target: ModelTransformTarget, proposed: Point3Mm) => {
    const resolved = resolveTransformPosition(target, proposed);
    if (target.kind === "object") {
      onMove(target.id, resolved);
      onTransformPreviewChange?.(null);
      return;
    }
    const opening = project.openings.find((item) => item.id === target.id);
    const wall = opening ? project.walls.find((item) => item.id === opening.wallId) : null;
    if (!opening || !wall) return;
    onUpdateOpening?.(opening.id, {
      offsetMm: openingOffsetAtPoint(wall, resolved, opening.widthMm, snapSizeMm),
      sillHeightMm: Math.max(0, resolved.y),
    });
    onTransformPreviewChange?.(null);
  }, [onMove, onTransformPreviewChange, onUpdateOpening, project.openings, project.walls, resolveTransformPosition, snapSizeMm]);

  return { activeObject, transformTarget, resolveTransformPosition, commitTransformPosition };
}
