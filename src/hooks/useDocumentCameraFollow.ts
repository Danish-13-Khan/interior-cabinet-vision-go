import { useEffect, useRef } from "react";
import { onShowcaseCameraJump } from "../domain/apartmentTemplates/showcaseJump";
import type { ModelViewPresetId } from "../domain/livingRoom";

/**
 * Follow the document activeCameraId, and re-apply on Showcase jump even when
 * the id is unchanged (orbit left the local pose user-owned).
 */
export function useDocumentCameraFollow(args: {
  projectCameraId: string | null;
  knownCameraIds: readonly string[];
  setActiveCameraId: (id: string | null) => void;
  setViewPreset?: (preset: ModelViewPresetId) => void;
}): void {
  const { projectCameraId, knownCameraIds, setActiveCameraId, setViewPreset } = args;
  const seenProjectCameraId = useRef(projectCameraId);
  const idsRef = useRef(knownCameraIds);
  idsRef.current = knownCameraIds;
  const cameraIdRef = useRef(projectCameraId);
  cameraIdRef.current = projectCameraId;

  useEffect(() => {
    if (seenProjectCameraId.current === projectCameraId) return;
    seenProjectCameraId.current = projectCameraId;
    if (!projectCameraId) setActiveCameraId(null);
    else if (idsRef.current.includes(projectCameraId)) setActiveCameraId(projectCameraId);
  }, [projectCameraId, setActiveCameraId]);

  useEffect(() => onShowcaseCameraJump(() => {
    setViewPreset?.("perspective");
    const id = cameraIdRef.current;
    // Clear then restore so CameraRig sees an intent change after orbit.
    setActiveCameraId(null);
    queueMicrotask(() => {
      if (!id) return;
      // Keep this guard: on a room switch `id` is the old room's camera, and the
      // follow effect above applies the new one.
      if (idsRef.current.includes(id)) setActiveCameraId(id);
    });
  }), [setActiveCameraId, setViewPreset]);
}
