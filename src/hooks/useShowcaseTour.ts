import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { InteriorProject, RenderComposition } from "../domain/interiorProject";
import type { CabinetRunAudience } from "../domain/livingRoom/cabinetRunFrame";
import { compileLivingRoomScene, preferModelViewCameraId } from "../domain/livingRoom";
import type { CompiledLivingRoomScene } from "../domain/livingRoom/sceneTypes";
import { viewLightingMood, type LightingMood } from "../domain/livingRoom/lightingMood";
import { showcaseTourAvailable, showcaseTourStops } from "../domain/apartmentTemplates/showcaseTour";
import { glbLoadsPending } from "../domain/livingRoom/glbLoadTracker";
import {
  IDLE_SHOWCASE_TOUR,
  ShowcaseTourSession,
  type ShowcaseTourState,
} from "../domain/apartmentTemplates/showcaseTourSession";

/**
 * Scenes compiled per room for one document revision. The tour revisits rooms
 * without recompiling, and the scene object for a room keeps its identity, so
 * Model View never regenerates geometry it already built.
 */
function useRoomSceneCache(project: InteriorProject) {
  const cache = useMemo(() => new Map<string, CompiledLivingRoomScene>(), [project]);
  return useCallback((roomId: string | null | undefined) => {
    const key = roomId ?? "";
    let scene = cache.get(key);
    if (!scene) {
      const viewProject = key === (project.activeRoomId ?? "") ? project : { ...project, activeRoomId: key };
      scene = compileLivingRoomScene(viewProject);
      cache.set(key, scene);
    }
    return scene;
  }, [cache, project]);
}

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

/** While touring, show each showcase camera as authored: no cabinet-run framing, no architectural re-frame. */
function cameraFraming(touring: boolean, presentation: boolean): {
  frameRun?: CabinetRunAudience;
  composition?: RenderComposition;
} {
  return touring ? { composition: "project-camera" } : { frameRun: presentation ? "client" : "author" };
}

/**
 * Showcase tour for Model View. Everything here is view state: the toured room
 * replaces the document's active room only for rendering, the camera follows
 * the Showcase jump signal, and the Day/Evening choice is a local override —
 * nothing is written to the project, so no undo step, dirty flag or autosave.
 */
export function useShowcaseTour<P extends string>(args: {
  project: InteriorProject;
  presentation: boolean;
  viewPreset: P;
  setViewPreset: (preset: P) => void;
  setActiveCameraId: (cameraId: string | null) => void;
  canvasHostRef: RefObject<HTMLElement | null>;
}) {
  const { project, presentation, viewPreset } = args;
  const stops = useMemo(() => showcaseTourStops(project), [project]);
  const [tour, setTour] = useState<ShowcaseTourState>(IDLE_SHOWCASE_TOUR);
  const [moodOverride, setMoodOverride] = useState<LightingMood | null>(null);
  const sceneFor = useRoomSceneCache(project);
  const scene = sceneFor(tour.roomId ?? project.activeRoomId);

  const latest = useRef({ ...args, stops });
  latest.current = { ...args, stops };
  const sceneForRef = useRef(sceneFor);
  sceneForRef.current = sceneFor;
  const sessionRef = useRef<ShowcaseTourSession<P> | null>(null);

  useEffect(() => {
    const session = new ShowcaseTourSession<P>({
      setTour: (next) => {
        setTour(next);
        if (!next.active && !latest.current.presentation) setMoodOverride(null);
      },
      setViewPreset: (preset) => latest.current.setViewPreset(preset),
      setActiveCameraId: (cameraId) => latest.current.setActiveCameraId(cameraId),
      restoreCameraId: () => {
        const current = latest.current.project;
        const cameras = sceneForRef.current(current.activeRoomId).cameras;
        const documentCameraId = current.renderSettings.activeCameraId ?? null;
        return cameras.some((camera) => camera.id === documentCameraId)
          ? documentCameraId
          : preferModelViewCameraId(cameras);
      },
      waitForRoomReady,
    });
    sessionRef.current = session;
    return () => {
      session.dispose();
      sessionRef.current = null;
    };
  }, []);

  useEffect(() => {
    sessionRef.current?.observe({ activeRoomId: project.activeRoomId ?? null, viewPreset });
  }, [project.activeRoomId, viewPreset, tour.active]);

  const start = useCallback(() => {
    const host = latest.current.canvasHostRef.current;
    sessionRef.current?.start(
      latest.current.stops,
      { activeRoomId: latest.current.project.activeRoomId ?? null, viewPreset: latest.current.viewPreset },
      host ? { canvasHost: host, keyboard: window } : undefined,
    );
  }, []);
  const stop = useCallback(() => sessionRef.current?.stop("user"), []);

  return {
    stops,
    available: showcaseTourAvailable(stops),
    tour,
    scene,
    mood: viewLightingMood(project, moodOverride),
    setMood: setMoodOverride,
    showMood: tour.active || presentation,
    ...cameraFraming(tour.active, presentation),
    start,
    stop,
  };
}
