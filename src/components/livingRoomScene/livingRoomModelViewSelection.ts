import type { InteriorProject } from "../../domain/interiorProject";
import type { CompiledLivingRoomScene } from "../../domain/livingRoom";
import type { ModelTransformTarget } from "./ModelMoveGizmo";
import { openingCenterOnWall } from "./livingRoomModelViewTransform";

export function resolveActiveModelSelection(input: {
  project: InteriorProject;
  scene: CompiledLivingRoomScene;
  selectedIds: string[];
  activeOpeningId: string | null;
}) {
  const { project, scene, selectedIds, activeOpeningId } = input;
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
    ? openingCenterOnWall(activeOpeningWall, activeOpening)
    : null;
  const transformTarget: ModelTransformTarget | null = activeObject
    ? { kind: "object", id: activeObject.id, positionMm: activeObjectOrigin ?? activeObject.position }
    : activeOpening && openingCenter
      ? { kind: "opening", id: activeOpening.id, positionMm: openingCenter }
      : null;
  return { activeObject, activeOpening, transformTarget };
}
