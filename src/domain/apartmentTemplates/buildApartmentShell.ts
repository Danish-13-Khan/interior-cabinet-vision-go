import {
  validateInteriorProject,
  type InteriorProject,
} from "../interiorProject";
import { writeLightingMood } from "../livingRoom/lightingMood";
import { applyLivingRoomStyle } from "../livingRoom/stylePresets";
import { buildOuterRectangle } from "./buildOuterShell";
import { applyGuillotineSplit, type CellRoomMap } from "./guillotine";
import { apartmentIdFactory } from "./ids";
import { applyApartmentOpenings } from "./openings";
import { applyRoomSpecs } from "./renameRooms";
import type { ApartmentTemplateSpec } from "./types";

export type BuildApartmentShellOptions = {
  now?: string;
  idFactory?: ReturnType<typeof apartmentIdFactory>;
};

const OPENING_FAIL_CODES = new Set([
  "opening-out-of-range",
  "opening-overlap",
  "opening-vertical-out-of-range",
  "opening-unknown-wall",
]);

/**
 * Outer rectangle → guillotine splits → rename/type rooms → openings.
 * Pure and deterministic when `now` + id factory are fixed (D3).
 */
export function buildApartmentShell(
  spec: ApartmentTemplateSpec,
  options: BuildApartmentShellOptions = {},
): InteriorProject {
  const now = options.now ?? "2026-10-05T00:00:00.000Z";
  const idFactory = options.idFactory ?? apartmentIdFactory(spec.id);
  const { project: outer, rootRoomId } = buildOuterRectangle(spec, idFactory, now);

  const cells: CellRoomMap = new Map([["root", rootRoomId]]);
  let project = outer;
  for (const split of spec.splits) {
    project = applyGuillotineSplit(
      project,
      split,
      cells,
      spec.shell.internalWallMm,
    );
  }

  const named = applyRoomSpecs(project, spec.rooms, cells);
  project = applyApartmentOpenings(
    named.project,
    spec.openings,
    named.roomKeyToId,
    idFactory,
  );

  const heroId = named.roomKeyToId.get(spec.heroRoomKey);
  if (!heroId) throw new Error(`Unknown hero room key "${spec.heroRoomKey}"`);
  project = {
    ...project,
    activeRoomId: heroId,
    renderSettings: {
      ...project.renderSettings,
      lightingRecipeId: spec.lightingRecipeId,
    },
    extensions: {
      ...project.extensions,
      apartmentTemplateId: spec.id,
      finishRoles: { ...spec.finishRoles },
    },
  };

  project = applyLivingRoomStyle(project, spec.styleId);
  project = writeLightingMood(project, spec.mood);

  const result = validateInteriorProject(project);
  const repairs = result.issues.filter((issue) => issue.repaired);
  if (repairs.length) {
    throw new Error(
      `Apartment shell required repairs: ${repairs.map((i) => i.code).join(", ")}`,
    );
  }
  const fatal = result.issues.filter(
    (issue) =>
      issue.severity === "error"
      || OPENING_FAIL_CODES.has(issue.code),
  );
  if (fatal.length) {
    throw new Error(
      `Apartment shell invalid: ${fatal.map((i) => i.message).join("; ")}`,
    );
  }
  return result.project;
}
