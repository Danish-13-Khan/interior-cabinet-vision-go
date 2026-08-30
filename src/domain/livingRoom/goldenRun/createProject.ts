import { createDefaultJobMeta } from "../../jobMeta";
import { validateInteriorProject, type InteriorProject } from "../../interiorProject";
import { writeProposalCommercial } from "../proposal/commercialState";
import { placeGoldenRunCabinets } from "./cabinets";
import { createGoldenRunRoomProject } from "./room";
import {
  GOLDEN_CABINET_RUN_FIXTURE_VERSION,
  GOLDEN_CABINET_RUN_ID,
  GOLDEN_CABINET_RUN_NOW,
  GOLDEN_RUN_CAMERA_ID,
  GOLDEN_RUN_JOB,
  GOLDEN_RUN_ROOM_ID,
} from "./types";

function goldenRunCamera(roomId: string) {
  return {
    id: GOLDEN_RUN_CAMERA_ID,
    roomId,
    name: "Run elevation",
    position: { x: 0, y: 1600, z: 1400 },
    target: { x: 0, y: 900, z: -1800 },
    fieldOfViewDegrees: 40,
    isDefault: true,
  };
}

/** Deterministic Golden Cabinet Run v1 project — room, run, fillers, camera, job. */
export function createGoldenCabinetRunProject(
  now = GOLDEN_CABINET_RUN_NOW,
): InteriorProject {
  const room = createGoldenRunRoomProject(now);
  const camera = goldenRunCamera(GOLDEN_RUN_ROOM_ID);
  const furnished = placeGoldenRunCabinets({
    ...room,
    cameras: [camera],
    renderSettings: {
      ...room.renderSettings,
      activeCameraId: camera.id,
      packageCameraBookmarks: [{ cameraId: camera.id, viewName: "Run elevation" }],
    },
    extensions: {
      ...room.extensions,
      goldenCabinetRun: {
        id: GOLDEN_CABINET_RUN_ID,
        fixtureVersion: GOLDEN_CABINET_RUN_FIXTURE_VERSION,
      },
    },
  });
  const withJob = writeProposalCommercial(furnished, {
    job: createDefaultJobMeta({
      ...GOLDEN_RUN_JOB,
      createdAt: now,
      updatedAt: now,
    }),
  });
  const result = validateInteriorProject({ ...withJob, updatedAt: now });
  const errors = result.issues.filter((issue) => issue.severity === "error");
  if (errors.length) {
    throw new Error(`Invalid golden run: ${errors.map((issue) => issue.message).join("; ")}`);
  }
  return { ...result.project, updatedAt: now, createdAt: now };
}
