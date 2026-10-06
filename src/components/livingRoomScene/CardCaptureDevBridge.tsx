import type { RefObject } from "react";
import type { InteriorProject, RenderQuality } from "../../domain/interiorProject";
import type { RoomSceneLookup } from "../../domain/livingRoom/roomSceneCache";
import type { LightingMood } from "../../domain/livingRoom/lightingMood";
import { useCardCaptureHook } from "../../hooks/useCardCaptureHook";

type Props = {
  project: InteriorProject;
  sceneFor: RoomSceneLookup;
  canvasHostRef: RefObject<HTMLElement | null>;
  onPatchDocument?: (mutate: (project: InteriorProject) => InteriorProject, label: string) => void;
  setViewportQuality: (quality: RenderQuality) => void;
  setMoodOverride: (mood: LightingMood | null) => void;
  setCaptureOverview: (overview: boolean) => void;
  setActiveCameraId: (cameraId: string | null) => void;
};

export function CardCaptureDevBridge(props: Props) {
  useCardCaptureHook({ enabled: true, ...props });
  return null;
}
