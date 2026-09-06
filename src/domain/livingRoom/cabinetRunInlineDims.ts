import type { InteriorProject, Size3Mm } from "../interiorProject";
import { persistCabinetIdentityOnObject } from "../cabinetIdentity";
import { cabinetRunForObject } from "./cabinetRunLayout";
import { updateCabinetRunLayout } from "./cabinetRunFillers";
import { finalizeGoldenRunObjects } from "./goldenRun/cabinetsLossless";
import { resizeLivingRoomObject } from "./planCommands";

/**
 * Update cabinet/filler footprint dims from the plan canvas.
 * When the object belongs to a cabinet run, reflow members (and fillers if enabled).
 */
export function setCabinetInlineDimensions(
  project: InteriorProject,
  objectId: string,
  dimensions: Partial<Pick<Size3Mm, "widthMm" | "depthMm" | "heightMm">>,
): InteriorProject {
  const object = project.objects.find((item) => item.id === objectId);
  if (!object) return project;
  const nextDims: Size3Mm = {
    widthMm: Math.max(40, Math.round(dimensions.widthMm ?? object.dimensions.widthMm)),
    depthMm: Math.max(18, Math.round(dimensions.depthMm ?? object.dimensions.depthMm)),
    heightMm: Math.max(10, Math.round(dimensions.heightMm ?? object.dimensions.heightMm)),
  };
  let next = resizeLivingRoomObject(project, objectId, nextDims);
  const resized = next.objects.find((item) => item.id === objectId);
  if (resized?.kind === "cabinet") {
    next = {
      ...next,
      objects: next.objects.map((item) => (
        item.id === objectId ? persistCabinetIdentityOnObject(item) : item
      )),
    };
  }
  const run = resized ? cabinetRunForObject(resized) : null;
  if (run) {
    next = updateCabinetRunLayout(next, run.runId, {});
  }
  // Reflow updates poses; re-clamp golden planning extensions so Engineering handoff stays lossless.
  return { ...next, objects: finalizeGoldenRunObjects(next.objects) };
}
