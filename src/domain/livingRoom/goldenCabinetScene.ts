import { DEFAULT_ROOM } from "../roomModel";
import {
  GOLDEN_CABINET_FAMILY_IDS,
  createGoldenCabinetInstance,
  familyType,
  readCabinetIdentity,
  type GoldenCabinetFamilyId,
} from "../cabinetIdentity";
import { interiorProjectFromCabinetProject } from "../interiorProject";
import type { InteriorProject } from "../interiorProject";
import { cabinetSceneRole } from "./cabinetSceneRoles";
import { compileLivingRoomScene } from "./sceneCompiler";
import type { CompiledPrimitive, CompiledSceneNode } from "./sceneTypes";

const NOW = "2026-08-30T08:00:00.000Z";

function roleOf(primitive: CompiledPrimitive) {
  const material = primitive.id.includes("back") ? "back"
    : primitive.id.includes("door") || primitive.id.includes("drawer") ? "door"
    : "board";
  return cabinetSceneRole(primitive.id, material);
}

export function createGoldenCabinetSceneProject(
  now = NOW,
): InteriorProject {
  const cabinets = GOLDEN_CABINET_FAMILY_IDS.map((familyId, index) => {
    const cabinet = createGoldenCabinetInstance(familyId);
    const width = cabinet.config.dimensions.width;
    return {
      ...cabinet,
      placement: {
        ...cabinet.placement,
        x: index * (width + 40),
        z: 0,
      },
    };
  });
  return interiorProjectFromCabinetProject({
    project: { version: 1, cabinets },
    activeRoom: DEFAULT_ROOM,
    now,
  });
}

export function goldenSceneNode(
  project: InteriorProject,
  familyId: GoldenCabinetFamilyId,
): CompiledSceneNode {
  const scene = compileLivingRoomScene(project);
  const object = project.objects.find((item) => readCabinetIdentity(item)?.familyId === familyId);
  const node = scene.nodes.find((item) => item.sourceObjectId === object?.id);
  if (!node) throw new Error(`Missing compiled node for ${familyId}`);
  return node;
}

export function goldenPrimitiveRoles(node: CompiledSceneNode): Set<string> {
  return new Set(node.primitives.map(roleOf));
}

export function goldenFamilyType(familyId: GoldenCabinetFamilyId) {
  return familyType(familyId);
}
