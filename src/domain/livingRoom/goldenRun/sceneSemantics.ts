import { readCabinetIdentity } from "../../cabinetIdentity";
import type { InteriorProject } from "../../interiorProject";
import { cabinetSceneRole } from "../cabinetSceneRoles";
import { isCabinetRunFiller } from "../wardrobePlacement";
import { compileLivingRoomScene } from "../sceneCompiler";
import type { CompiledPrimitive, CompiledSceneNode } from "../sceneTypes";

export type GoldenSceneCabinet = {
  objectId: string;
  familyId: string;
  cabinetType: string;
  geometry: string;
  roles: string[];
  widthMm: number;
  heightMm: number;
  yMm: number;
};

function roleOf(primitive: CompiledPrimitive) {
  const material = primitive.id.includes("back") ? "back"
    : primitive.id.includes("door") || primitive.id.includes("drawer") ? "door"
    : "board";
  return cabinetSceneRole(primitive.id, material);
}

function rolesOf(node: CompiledSceneNode) {
  return [...new Set(node.primitives.map(roleOf))].sort();
}

export type GoldenSceneCountertop = {
  id: string;
  nodeId: string;
  geometry: string;
  cabinetIds: string[];
  widthMm: number;
  depthMm: number;
  thicknessMm: number;
  role: "countertop";
};

/** Compiled 3D semantics for every identified cabinet in the document. */
export function listGoldenSceneCabinets(project: InteriorProject): GoldenSceneCabinet[] {
  const scene = compileLivingRoomScene(project);
  return project.objects.flatMap((object) => {
    const identity = readCabinetIdentity(object);
    if (!identity || isCabinetRunFiller(object)) return [];
    const node = scene.nodes.find((item) => item.sourceObjectId === object.id);
    if (!node) return [];
    return [{
      objectId: object.id,
      familyId: identity.familyId,
      cabinetType: identity.cabinetType,
      geometry: String(node.metadata.geometry ?? node.adapterId),
      roles: rolesOf(node),
      widthMm: object.dimensions.widthMm,
      heightMm: object.dimensions.heightMm,
      yMm: node.positionMm.y,
    }];
  });
}

/** Derived run countertops compiled with the golden floor cabinets. */
export function listGoldenSceneCountertops(project: InteriorProject): GoldenSceneCountertop[] {
  return compileLivingRoomScene(project).nodes.flatMap((node) => {
    if (node.metadata.role !== "countertop") return [];
    return [{
      id: String(node.metadata.countertopId ?? node.id.replace(/^countertop-node:/, "")),
      nodeId: node.id,
      geometry: node.adapterId,
      cabinetIds: String(node.metadata.cabinetIds ?? "").split(",").filter(Boolean),
      widthMm: Number(node.metadata.widthMm) || 0,
      depthMm: Number(node.metadata.depthMm) || 0,
      thicknessMm: Number(node.metadata.thicknessMm) || 0,
      role: "countertop" as const,
    }];
  });
}
