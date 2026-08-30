import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadInteriorProjectFile,
  serializeInteriorProjectFile,
  type InteriorProject,
} from "../../interiorProject";
import { createGoldenCabinetRunProject } from "./createProject";
import { GOLDEN_CABINET_RUN_NOW } from "./types";

export const GOLDEN_RUN_FIXTURE_RELATIVE_PATH =
  "fixtures/golden-cabinet-run/v1.interior.json";

export function goldenRunFixtureDir() {
  return join(dirname(fileURLToPath(import.meta.url)), "../../../../fixtures/golden-cabinet-run");
}

export function goldenRunFixturePath() {
  return join(goldenRunFixtureDir(), "v1.interior.json");
}

export function serializeGoldenRunFixture(
  project: InteriorProject = createGoldenCabinetRunProject(),
  savedAt = GOLDEN_CABINET_RUN_NOW,
) {
  return `${serializeInteriorProjectFile(project, savedAt)}\n`;
}

export function loadGoldenRunFixture(input: string | unknown) {
  return loadInteriorProjectFile(input).document;
}

export function readGoldenRunFixtureVersion(document: InteriorProject) {
  const stamp = document.extensions?.goldenCabinetRun;
  if (!stamp || typeof stamp !== "object") return 0;
  const version = (stamp as { fixtureVersion?: unknown }).fixtureVersion;
  return typeof version === "number" ? version : 0;
}
