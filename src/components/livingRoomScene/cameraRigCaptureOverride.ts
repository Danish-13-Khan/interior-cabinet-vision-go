import { useEffect, useState } from "react";
import type { Camera } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { CompiledSceneBounds } from "../../domain/livingRoom/sceneTypes";
import {
  cardCaptureRigRevision,
  readCardCapturePose,
  subscribeCardCaptureRig,
} from "../../domain/templateCardsCapture/cardCaptureRig";
import { applyCameraPose, publishLiveCameraFrame } from "./cameraRigPose";

export function useCardCaptureRigRevision(): number {
  const [revision, setRevision] = useState(() => cardCaptureRigRevision());
  useEffect(() => subscribeCardCaptureRig(() => setRevision(cardCaptureRigRevision())), []);
  return revision;
}

export function applyCardCaptureOverride(args: {
  camera: Camera;
  controls: OrbitControlsImpl | null;
  canvas: HTMLCanvasElement;
  bounds: CompiledSceneBounds;
  viewport: { widthPx: number; heightPx: number };
  walkthrough: boolean;
}): boolean {
  const captureOverride = readCardCapturePose();
  if (!captureOverride) return false;
  applyCameraPose(args.camera, args.controls, captureOverride.pose);
  publishLiveCameraFrame(
    args.canvas,
    args.bounds,
    args.camera,
    args.controls,
    false,
    args.viewport,
    args.walkthrough,
  );
  return true;
}
