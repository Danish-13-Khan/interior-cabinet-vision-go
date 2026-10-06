import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { InteriorProject } from "../domain/interiorProject";
import { pickModelViewCameraId } from "../domain/livingRoom";
import type { RoomSceneLookup } from "../domain/livingRoom/roomSceneCache";
import { lightingRecipeForMood, viewLightingMood, type LightingMood } from "../domain/livingRoom/lightingMood";
import { glbLoadsPending } from "../domain/livingRoom/glbLoadTracker";
import { showcaseTourAvailable, showcaseTourStops } from "../domain/apartmentTemplates/showcaseTour";
import {
  IDLE_SHOWCASE_TOUR,
  ShowcaseTourSession,
  type ShowcaseTourState,
} from "../domain/apartmentTemplates/showcaseTourSession";
import {
  showcaseCameraFraming,
  showcaseMoodOffered,
  showcaseMoodOverride,
} from "../domain/apartmentTemplates/showcaseTourView";

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const GLB_WAIT_LIMIT_MS = 5000;

/**
 * Warm-up wait for one room: a few drawn frames, every GLB loaded (up to 5 s),
 * then a few more frames so freshly mounted models are drawn and their shaders
 * compiled. Returns at the next frame once the tour is stopped.
 */
async function waitForRoomReady(signal: AbortSignal): Promise<void> {
  const frames = async (count: number) => {
    for (let frame = 0; frame < count && !signal.aborted; frame += 1) await nextFrame();
  };
  await frames(3);
  const deadline = performance.now() + GLB_WAIT_LIMIT_MS;
  while (!signal.aborted && glbLoadsPending() > 0 && performance.now() < deadline) await nextFrame();
  await frames(4);
}

/**
 * Showcase tour for Model View. Everything here is view state: the toured room
 * replaces the document's active room only for rendering, the camera follows
 * the Showcase jump signal, and the Day/Evening choice is a local override —
 * nothing is written to the project, so no undo step, dirty flag or autosave.
 */
export function useShowcaseTour<P extends string>(args: {
  project: InteriorProject;
  /** Per-room scenes of this project revision (shared with Model View). */
  sceneFor: RoomSceneLookup;
  presentation: boolean;
  viewPreset: P;
  setViewPreset: (preset: P) => void;
  activeCameraId: string | null;
  setActiveCameraId: (cameraId: string | null) => void;
  canvasHostRef: RefObject<HTMLElement | null>;
}) {
  const { project, sceneFor, presentation, viewPreset } = args;
  const stops = useMemo(() => showcaseTourStops(project), [project]);
  const [tour, setTour] = useState<ShowcaseTourState>(IDLE_SHOWCASE_TOUR);
  const [moodOverride, setMoodOverride] = useState<LightingMood | null>(null);
  const mode = { touring: tour.active, presentation };
  const showMood = showcaseMoodOffered(mode);

  const latest = useRef({ ...args, stops });
  latest.current = { ...args, stops };
  const sessionRef = useRef<ShowcaseTourSession<P> | null>(null);

  useEffect(() => {
    const session = new ShowcaseTourSession<P>({
      setTour,
      setViewPreset: (preset) => latest.current.setViewPreset(preset),
      setActiveCameraId: (cameraId) => latest.current.setActiveCameraId(cameraId),
      restoreCameraId: (cameraBefore) => {
        const current = latest.current;
        const cameras = current.sceneFor(current.project.activeRoomId).cameras;
        return pickModelViewCameraId(cameras, [cameraBefore, current.project.renderSettings.activeCameraId]);
      },
      waitForRoomReady,
    });
    sessionRef.current = session;
    return () => {
      session.dispose();
      sessionRef.current = null;
    };
  }, []);

  // Forget the view-only mood once its toggle goes away, so it never comes back on its own.
  useEffect(() => {
    if (!showMood) setMoodOverride(null);
  }, [showMood]);

  useEffect(() => {
    sessionRef.current?.observe({ activeRoomId: project.activeRoomId ?? null, viewPreset });
  }, [project.activeRoomId, viewPreset, tour.active]);

  const start = useCallback(() => {
    const current = latest.current;
    const host = current.canvasHostRef.current;
    sessionRef.current?.start(
      current.stops,
      { activeRoomId: current.project.activeRoomId ?? null, viewPreset: current.viewPreset, cameraId: current.activeCameraId },
      host ? { canvasHost: host, keyboard: window } : undefined,
    );
  }, []);
  const stop = useCallback(() => sessionRef.current?.stop("user"), []);

  const mood = viewLightingMood(project, showcaseMoodOverride(moodOverride, mode));
  const roomScene = sceneFor(tour.roomId);
  const scene = useMemo(() => {
    const lightingRecipeId = lightingRecipeForMood(roomScene.lightingRecipeId, mood);
    return lightingRecipeId === roomScene.lightingRecipeId ? roomScene : { ...roomScene, lightingRecipeId };
  }, [roomScene, mood]);

  return {
    stops,
    available: showcaseTourAvailable(stops),
    tour,
    scene,
    mood,
    setMood: setMoodOverride,
    showMood,
    ...showcaseCameraFraming(mode),
    start,
    stop,
  };
}
