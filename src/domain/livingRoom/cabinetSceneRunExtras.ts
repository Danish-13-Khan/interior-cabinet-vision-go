import { createCabinetPlanningWorkflow, type CountertopSegment } from "../cabinetRuns";
import { cabinetProjectFromInteriorProject } from "../interiorProject";
import type { InteriorProject } from "../interiorProject";
import { LIVING_ROOM_MATERIAL_IDS } from "./materials";
import { materialIdForCabinetRole } from "./cabinetSceneRoles";
import { createProceduralRenderBinding } from "./renderAssetBindings";
import { boxPrimitive } from "./scenePrimitives";
import type { CompiledSceneNode } from "./sceneTypes";

function extraNode(
  id: string,
  name: string,
  adapterId: string,
  positionMm: CompiledSceneNode["positionMm"],
  primitive: CompiledSceneNode["primitives"][number],
  metadata: CompiledSceneNode["metadata"],
): CompiledSceneNode {
  return {
    id,
    name,
    sourceObjectId: null,
    adapterId,
    positionMm,
    rotationDegrees: { x: 0, y: 0, z: 0 },
    primitives: [primitive],
    placeholder: false,
    metadata,
    renderBinding: createProceduralRenderBinding(),
  };
}

/** Same active-room + layer filter as compiled object nodes. */
export function sceneVisibleObjects(project: InteriorProject) {
  return project.objects.filter((object) => (
    object.roomId === project.activeRoomId
    && object.extensions?.layerVisible !== false
  ));
}

/** widthMm is run length; depthMm is into the room — swap for Z-axis runs. */
export function countertopBoxSizeMm(segment: CountertopSegment) {
  const alongX = segment.axis === "z" ? segment.depthMm : segment.widthMm;
  const alongZ = segment.axis === "z" ? segment.widthMm : segment.depthMm;
  return { width: alongX, height: segment.thicknessMm, depth: alongZ };
}

/** Run countertops — never authored through tall cabinets. */
export function compileCabinetRunExtras(project: InteriorProject): CompiledSceneNode[] {
  const visible = sceneVisibleObjects(project);
  const cabinets = visible.filter((object) => object.kind === "cabinet");
  if (cabinets.length === 0) return [];
  const compatible = cabinetProjectFromInteriorProject({ ...project, objects: visible });
  const room = project.rooms.find((item) => item.id === project.activeRoomId)
    ?? project.rooms[0];
  if (!room) return [];
  const workflow = createCabinetPlanningWorkflow(compatible.project, {
    widthMm: room.dimensions.widthMm,
    depthMm: room.dimensions.depthMm,
    heightMm: room.dimensions.heightMm,
  });
  return workflow.countertops.map((segment) => {
    const host = cabinets.find((object) => object.id === segment.cabinetIds[0]);
    const materialId = host
      ? materialIdForCabinetRole(host, "countertop")
      : LIVING_ROOM_MATERIAL_IDS.warmStone;
    return extraNode(
      `countertop-node:${segment.id}`,
      "Countertop",
      "countertop-v1",
      { x: segment.positionX, y: segment.positionY, z: segment.positionZ },
      boxPrimitive(segment.id, countertopBoxSizeMm(segment), { x: 0, y: segment.thicknessMm / 2, z: 0 }, materialId),
      {
        role: "countertop",
        runId: segment.runId,
        axis: segment.axis,
        countertopId: segment.id,
        widthMm: segment.widthMm,
        depthMm: segment.depthMm,
        thicknessMm: segment.thicknessMm,
        cabinetIds: segment.cabinetIds.join(","),
      },
    );
  });
}

export function countertopTouchesCabinet(
  nodes: readonly CompiledSceneNode[],
  cabinetId: string,
): boolean {
  return nodes.some((node) => (
    node.metadata.role === "countertop"
    && String(node.metadata.cabinetIds ?? "").split(",").includes(cabinetId)
  ));
}
