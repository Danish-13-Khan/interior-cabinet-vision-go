import { useEffect, useMemo, useRef, type RefObject } from "react";
import type { InteriorProject, RenderQuality } from "../domain/interiorProject";
import { setActiveInteriorRoom } from "../domain/interiorProject";
import type { RoomSceneLookup } from "../domain/livingRoom/roomSceneCache";
import type { LightingMood } from "../domain/livingRoom/lightingMood";
import {
  cardCapturePathsForProject,
  publishCardCapturePose,
  resolveCardCaptureView,
  type CardCaptureHook,
} from "../domain/templateCardsCapture";
import { glbLoadsPending } from "../domain/livingRoom/glbLoadTracker";

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

type Args = {
  enabled: boolean;
  project: InteriorProject;
  sceneFor: RoomSceneLookup;
  canvasHostRef: RefObject<HTMLElement | null>;
  onPatchDocument?: (mutate: (project: InteriorProject) => InteriorProject, label: string) => void;
  setViewportQuality: (quality: RenderQuality) => void;
  setMoodOverride: (mood: LightingMood | null) => void;
  setCaptureOverview: (overview: boolean) => void;
  setActiveCameraId: (cameraId: string | null) => void;
};

async function waitForFrameSettled(host: HTMLElement | null, timeoutMs = 45_000): Promise<void> {
  const deadline = performance.now() + timeoutMs;
  while (performance.now() < deadline) {
    const canvas = host?.querySelector("canvas");
    if (canvas?.dataset.frameSettled === "1") return;
    await nextFrame();
  }
  throw new Error("Timed out waiting for frameSettled");
}

async function waitForAssets(): Promise<void> {
  const deadline = performance.now() + 8000;
  while (performance.now() < deadline && glbLoadsPending() > 0) await nextFrame();
  for (let i = 0; i < 6; i += 1) await nextFrame();
}

export function useCardCaptureHook(args: Args): void {
  const latest = useRef(args);
  latest.current = args;
  const paths = useMemo(
    () => (args.enabled ? cardCapturePathsForProject(args.project) : []),
    [args.enabled, args.project],
  );

  useEffect(() => {
    if (!args.enabled) {
      delete window.__cardCapture;
      publishCardCapturePose(null);
      return;
    }
    const hook: CardCaptureHook = {
      paths: () => paths,
      async ready() {
        await waitForAssets();
        await waitForFrameSettled(latest.current.canvasHostRef.current);
      },
      async setLook(look) {
        latest.current.setViewportQuality(look.quality);
        latest.current.setMoodOverride(look.mood);
        await waitForAssets();
        await waitForFrameSettled(latest.current.canvasHostRef.current);
      },
      async readSurfaces() {
        const read = window.__stillSurfaceProbe;
        if (!read) throw new Error("Still surface probe is not mounted");
        return read();
      },
      async pose(path, t, options) {
        const current = latest.current;
        const view = resolveCardCaptureView(current.project, current.sceneFor, path, t, options?.scene);
        if (view.roomId && view.roomId !== current.project.activeRoomId) {
          current.onPatchDocument?.(
            (doc) => setActiveInteriorRoom(doc, view.roomId!),
            "Card capture switched room.",
          );
        }
        current.setCaptureOverview(view.overview);
        current.setActiveCameraId(view.cameraId);
        publishCardCapturePose(view.pose);
        await waitForAssets();
        await waitForFrameSettled(current.canvasHostRef.current);
      },
    };
    window.__cardCapture = hook;
    return () => {
      delete window.__cardCapture;
      publishCardCapturePose(null);
    };
  }, [args.enabled, paths]);
}
