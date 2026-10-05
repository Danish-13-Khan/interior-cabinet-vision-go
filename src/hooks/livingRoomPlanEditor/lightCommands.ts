import type { InteriorProject } from "../../domain/interiorProject";
import { attachLightToObject, updateLightMount, type LightMount } from "../../domain/livingRoom/lightAttachments";
import { getLightFixtureDefinition, type LightFixtureKind } from "../../domain/livingRoom/lightFixtureRegistry";
import { relocateLight } from "../../domain/livingRoom/lightRelocate";
import {
  addRoomLightFixture,
  duplicateRoomLightFixture,
  removeRoomLightFixture,
  updateRoomLightFixture,
  type RoomLightMountTarget,
  type RoomLightPatch,
} from "../../domain/livingRoom/roomLightFixtures";
import type { CommitDocument, EditorCommandContext } from "./context";

export type AddLivingRoomLightOptions = {
  orientation?: "horizontal" | "vertical";
};

/** What the inspector, popover, and entry points call instead of patching the document. */
export type LightFixtureActions = {
  addLight: (
    kind: LightFixtureKind,
    mount?: RoomLightMountTarget,
    options?: AddLivingRoomLightOptions,
  ) => string | null;
  updateLight: (id: string, patch: RoomLightPatch) => void;
  removeLight: (id: string) => void;
  duplicateLight: (id: string) => void;
  setLightMount: (id: string, mount: LightMount) => void;
  /** Drag in 3D: one undo step, the mount is kept. Millimetres, world space. */
  moveLight: (id: string, point: { x: number; y: number; z: number }) => void;
};

export function lightFixtureActions(
  commitDocument: CommitDocument,
  document: InteriorProject | null,
): LightFixtureActions {
  return {
    addLight: (kind, mount, options) => addLivingRoomLight(commitDocument, document, kind, mount, options),
    updateLight: (id, patch) => {
      commitDocument((current) => updateRoomLightFixture(current, id, patch), "Updated room light.");
    },
    removeLight: (id) => {
      commitDocument((current) => removeRoomLightFixture(current, id), "Removed room light.");
    },
    duplicateLight: (id) => {
      commitDocument((current) => duplicateRoomLightFixture(current, id), "Duplicated room light.");
    },
    setLightMount: (id, mount) => {
      commitDocument((current) => applyMount(current, id, mount), "Updated light attachment.");
    },
    moveLight: (id, point) => {
      commitDocument((current) => relocateLight(current, id, point), "Moved room light.");
    },
  };
}

function applyMount(project: InteriorProject, id: string, mount: LightMount) {
  if (mount.kind === "object") return attachLightToObject(project, id, mount.hostObjectId);
  return updateLightMount(project, id, mount);
}

function addLivingRoomLight(
  commitDocument: CommitDocument,
  document: InteriorProject | null,
  kind: LightFixtureKind,
  mount?: RoomLightMountTarget,
  options?: AddLivingRoomLightOptions,
): string | null {
  if (!document) return null;
  if (addRoomLightFixture(document, kind, mount) === document) return null;
  let createdId: string | null = null;
  const name = getLightFixtureDefinition(kind).name;
  commitDocument((current) => {
    let next = addRoomLightFixture(current, kind, mount);
    const existing = new Set(current.lights.map((light) => light.id));
    createdId = next.lights.find((light) => !existing.has(light.id))?.id ?? null;
    if (createdId && options?.orientation) {
      next = updateRoomLightFixture(next, createdId, { parameters: { orientation: options.orientation } });
    }
    return next;
  }, `Added ${name.toLowerCase()}.`);
  return createdId;
}

/** Named editor commands. Spread into useLivingRoomPlanEditor. */
export function lightCommands(ctx: EditorCommandContext) {
  const actions = lightFixtureActions(ctx.commitDocument, ctx.document);
  return {
    addLivingRoomLight: actions.addLight,
    updateLivingRoomLight: actions.updateLight,
    removeLivingRoomLight: actions.removeLight,
    duplicateLivingRoomLight: actions.duplicateLight,
    setLivingRoomLightMount: actions.setLightMount,
    moveLivingRoomLight: actions.moveLight,
  };
}
