import { performance } from "node:perf_hooks";
import { describe, expect, it } from "vitest";
import { easeTowardCameraGoal, type CameraPoseMeters } from "../../components/livingRoomScene/cameraRigPose";
import type { CameraEntity } from "../interiorProject";
import { compileApartmentScene } from "../livingRoom/apartmentScene";
import { sceneWithOverviewCameras } from "../livingRoom/overviewCameras";
import { createRoomSceneCache } from "../livingRoom/roomSceneCache";
import { MODEL_VIEW_CAMERA_EASE_MS } from "../livingRoom/modelViewCameraEase";
import { COMPOSER_TEST_NOW } from "./composers/bareRoom";
import { instantiateApartmentTemplate } from "./instantiateApartmentTemplate";
import { showcaseTourStops, type ShowcaseTourStop } from "./showcaseTour";
import { SHOWCASE_TOUR_TIMING } from "./showcaseTourController";

const FRAME_MS = 1000 / 60;
const STALL_BUDGET_MS = 100;
const project = instantiateApartmentTemplate("template:apartment:3bhk:v1", { now: COMPOSER_TEST_NOW });
const stops = showcaseTourStops(project);
// Since 8.5 the first stop is the whole-apartment overview; its camera lives in the apartment scene.
const overviewCameras = sceneWithOverviewCameras(compileApartmentScene(project)).cameras;
const roomStops = stops.filter((stop) => !stop.overview);

function cameraForStop(stop: ShowcaseTourStop): CameraEntity {
  const cameras = stop.overview ? overviewCameras : project.cameras;
  const camera = cameras.find((item) => item.id === stop.cameraId);
  if (!camera) throw new Error(`No camera ${stop.cameraId} for stop ${stop.roomName}`);
  return camera;
}

function poseOf(camera: CameraEntity): CameraPoseMeters {
  const m = (point: CameraEntity["position"]) => ({ x: point.x / 1000, y: point.y / 1000, z: point.z / 1000 });
  return { position: m(camera.position), target: m(camera.target), fieldOfViewDegrees: camera.fieldOfViewDegrees, orthographic: false };
}

const distance = (a: CameraPoseMeters["position"], b: CameraPoseMeters["position"]) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

describe("Showcase tour motion (3 BHK frame-time check)", () => {
  it("glides between every stop (overview, then rooms) at 60 fps with no jumps and settles before the hold ends", () => {
    expect(stops[0]?.overview).toBe(true);
    const { glideMs, holdMs } = SHOWCASE_TOUR_TIMING;
    expect(glideMs).toBeGreaterThan(MODEL_VIEW_CAMERA_EASE_MS);
    let current = poseOf(cameraForStop(stops[0]!));
    let frames = 0;
    for (const stop of stops) {
      const from = current;
      const goal = poseOf(cameraForStop(stop));
      const span = Math.max(distance(from.position, goal.position), distance(from.target, goal.target));
      // easeInOutCubic peaks at 3× the average speed mid-glide; a little slack for frame alignment.
      const maxStep = span * 3 * (FRAME_MS / glideMs) * 1.05 + 1e-9;
      let settledAt: number | null = null;
      for (let elapsed = FRAME_MS; elapsed <= glideMs + holdMs; elapsed += FRAME_MS) {
        const step = easeTowardCameraGoal(from, goal, elapsed, glideMs);
        expect(distance(step.pose.position, current.position)).toBeLessThanOrEqual(maxStep);
        expect(distance(step.pose.target, current.target)).toBeLessThanOrEqual(maxStep);
        current = step.pose;
        frames += 1;
        if (step.settled && settledAt === null) settledAt = elapsed;
      }
      expect(settledAt).not.toBeNull();
      expect(settledAt!).toBeLessThanOrEqual(glideMs + FRAME_MS);
      expect(distance(current.position, goal.position)).toBeLessThan(1e-9);
    }
    expect(frames).toBeGreaterThan(stops.length * 200);
  });

  it("each room change costs far less than a 100 ms frame stall, and revisits are free", () => {
    // Room stops only: the overview scene is compiled once in the tour warm-up, behind the veil.
    // That warm-up also runs every compile path once, so time the steady state the tour sees:
    // a throwaway cache compiles the first room first, which keeps a cold JIT or a busy vitest
    // worker from counting as a frame stall (seen at 50.6 ms once on 2026-10-07; the real cost is 0.1–4 ms).
    createRoomSceneCache(project)(roomStops[0]!.roomId);
    const sceneFor = createRoomSceneCache(project);
    const costs: number[] = [];
    for (const stop of roomStops) {
      const started = performance.now();
      sceneFor(stop.roomId);
      costs.push(performance.now() - started);
    }
    expect(Math.max(...costs)).toBeLessThan(STALL_BUDGET_MS / 2);
    for (const stop of roomStops) {
      const started = performance.now();
      expect(sceneFor(stop.roomId).cameras.some((camera) => camera.id === stop.cameraId)).toBe(true);
      expect(performance.now() - started).toBeLessThan(1);
    }
    // The overview stop's camera comes from the apartment scene built from the same room cache.
    const overview = stops.find((stop) => stop.overview)!;
    const apartment = sceneWithOverviewCameras(compileApartmentScene(project, sceneFor));
    expect(apartment.cameras.some((camera) => camera.id === overview.cameraId)).toBe(true);
    // Ease math per frame is negligible next to a 16.7 ms frame.
    const from = poseOf(project.cameras[0]!);
    const goal = poseOf(project.cameras.at(-1)!);
    const started = performance.now();
    for (let frame = 0; frame < 1000; frame += 1) easeTowardCameraGoal(from, goal, frame, SHOWCASE_TOUR_TIMING.glideMs);
    expect((performance.now() - started) / 1000).toBeLessThan(1);
  });
});
