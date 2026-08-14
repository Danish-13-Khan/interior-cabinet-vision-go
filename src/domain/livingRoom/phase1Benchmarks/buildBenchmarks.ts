import {
  validateInteriorProject,
  type CameraEntity,
  type InteriorProject,
} from "../../interiorProject";
import { defaultLivingRoomIdFactory } from "../ids";
import {
  moveLivingRoomObject,
  rotateLivingRoomObject,
} from "../planCommands";
import { createLivingRoomStarterProject } from "../preset";
import { applyLivingRoomStyle } from "../stylePresets";
import {
  getPhase1BenchmarkDefinition,
  PHASE1_BENCHMARK_DEFINITIONS,
  PHASE1_BENCHMARK_NOW,
} from "./definitions";
import type {
  Phase1BenchmarkFrameId,
  Phase1BenchmarkId,
  Phase1CameraKey,
} from "./types";

function catalogObjectId(project: InteriorProject, catalogItemId: string) {
  const object = project.objects.find((item) => item.catalogItemId === catalogItemId);
  if (!object) throw new Error(`Benchmark project missing ${catalogItemId}.`);
  return object.id;
}

function lockedCameras(
  roomId: string,
  benchmarkId: Phase1BenchmarkId,
): { cameras: CameraEntity[]; cameraIds: Record<Phase1CameraKey, string> } {
  const definition = getPhase1BenchmarkDefinition(benchmarkId);
  const cameraIds = {} as Record<Phase1CameraKey, string>;
  const cameras = definition.cameras.map((camera, index) => {
    const id = defaultLivingRoomIdFactory("camera", `${benchmarkId}-${camera.key}`);
    cameraIds[camera.key] = id;
    return {
      id,
      roomId,
      name: camera.name,
      position: camera.position,
      target: camera.target,
      fieldOfViewDegrees: camera.fieldOfViewDegrees,
      isDefault: index === 0,
    };
  });
  return { cameras, cameraIds };
}

function arrangeDaylightSofa(project: InteriorProject): InteriorProject {
  const sofaId = catalogObjectId(project, "living:sofa-3-seat");
  const tableId = catalogObjectId(project, "living:coffee-table");
  const chairId = catalogObjectId(project, "living:lounge-chair");
  let next = moveLivingRoomObject(project, sofaId, { x: -200, y: 0, z: 1100 });
  next = rotateLivingRoomObject(next, sofaId, 0);
  next = moveLivingRoomObject(next, tableId, { x: -180, y: 0, z: -40 });
  next = moveLivingRoomObject(next, chairId, { x: -2100, y: 0, z: 180 });
  return rotateLivingRoomObject(next, chairId, 28);
}

function arrangeMillworkMedia(project: InteriorProject): InteriorProject {
  const tvId = catalogObjectId(project, "living:tv-unit");
  const chairId = catalogObjectId(project, "living:lounge-chair");
  const sofaId = catalogObjectId(project, "living:sofa-3-seat");
  let next = moveLivingRoomObject(project, tvId, { x: 0, y: 0, z: -1980 });
  next = moveLivingRoomObject(next, sofaId, { x: 120, y: 0, z: 1050 });
  next = moveLivingRoomObject(next, chairId, { x: -1950, y: 0, z: 40 });
  return rotateLivingRoomObject(next, chairId, 35);
}

function arrangeEveningLamp(project: InteriorProject): InteriorProject {
  const lampId = catalogObjectId(project, "living:floor-lamp");
  const sideId = catalogObjectId(project, "living:side-table");
  const sofaId = catalogObjectId(project, "living:sofa-3-seat");
  let next = moveLivingRoomObject(project, sofaId, { x: -80, y: 0, z: 1080 });
  next = moveLivingRoomObject(next, lampId, { x: 2350, y: 0, z: -1100 });
  return moveLivingRoomObject(next, sideId, { x: -2050, y: 0, z: -980 });
}

function arrangeForBenchmark(
  project: InteriorProject,
  benchmarkId: Phase1BenchmarkId,
): InteriorProject {
  if (benchmarkId === "bench-daylight-sofa") return arrangeDaylightSofa(project);
  if (benchmarkId === "bench-millwork-media") return arrangeMillworkMedia(project);
  return arrangeEveningLamp(project);
}

/** Stable Phase 1 scorecard project — deterministic ids and locked cameras. */
export function createPhase1BenchmarkProject(
  benchmarkId: Phase1BenchmarkId,
): InteriorProject {
  const definition = getPhase1BenchmarkDefinition(benchmarkId);
  const starter = createLivingRoomStarterProject({
    projectId: `phase1-${benchmarkId}`,
    projectName: `Phase 1 · ${definition.name}`,
    now: PHASE1_BENCHMARK_NOW,
  });
  const styled = applyLivingRoomStyle(starter, definition.styleId);
  const arranged = arrangeForBenchmark(styled, benchmarkId);
  const roomId = arranged.activeRoomId;
  const { cameras, cameraIds } = lockedCameras(roomId, benchmarkId);
  return validateInteriorProject({
    ...arranged,
    cameras,
    updatedAt: PHASE1_BENCHMARK_NOW,
    renderSettings: {
      ...arranged.renderSettings,
      activeCameraId: cameras[0]?.id ?? null,
      quality: "client-preview",
      widthPx: 1920,
      heightPx: 1080,
    },
    extensions: {
      ...arranged.extensions,
      phase1Benchmark: {
        id: benchmarkId,
        version: 1,
        styleId: definition.styleId,
        cameraIds,
      },
    },
  }).project;
}

function readBenchmarkMeta(project: InteriorProject): {
  id: Phase1BenchmarkId;
  cameraIds: Record<Phase1CameraKey, string>;
} {
  const meta = project.extensions?.phase1Benchmark;
  if (!meta || typeof meta !== "object") {
    throw new Error("Project is missing phase1Benchmark extensions.");
  }
  const record = meta as {
    id?: Phase1BenchmarkId;
    cameraIds?: Record<Phase1CameraKey, string>;
  };
  if (!record.id || !record.cameraIds?.["camera-a"] || !record.cameraIds?.["camera-b"]) {
    throw new Error("phase1Benchmark extensions are incomplete.");
  }
  return { id: record.id, cameraIds: record.cameraIds };
}

export function listPhase1BenchmarkProjects(): InteriorProject[] {
  return PHASE1_BENCHMARK_DEFINITIONS.map((item) =>
    createPhase1BenchmarkProject(item.id),
  );
}

export function listPhase1BenchmarkFrames(): Array<{
  frameId: Phase1BenchmarkFrameId;
  benchmarkId: Phase1BenchmarkId;
  cameraKey: Phase1CameraKey;
  cameraId: string;
  project: InteriorProject;
}> {
  return listPhase1BenchmarkProjects().flatMap((project) => {
    const meta = readBenchmarkMeta(project);
    return (["camera-a", "camera-b"] as const).map((cameraKey) => ({
      frameId: `${meta.id}/${cameraKey}` as Phase1BenchmarkFrameId,
      benchmarkId: meta.id,
      cameraKey,
      cameraId: meta.cameraIds[cameraKey],
      project,
    }));
  });
}

export function resolvePhase1BenchmarkCameraId(
  project: InteriorProject,
  cameraKey: Phase1CameraKey,
): string {
  const cameraId = readBenchmarkMeta(project).cameraIds[cameraKey];
  if (!project.cameras.some((camera) => camera.id === cameraId)) {
    throw new Error(`Benchmark camera not found: ${cameraKey}`);
  }
  return cameraId;
}
