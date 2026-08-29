import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import {
  firstPickIdFromRay,
  projectedScreenPointForPickId,
  type ModelPickScreenPoint,
} from "./modelPickQuery";

export type { ModelPickScreenPoint };

type ModelPickApi = {
  screenPointForPickId: (pickId: string) => ModelPickScreenPoint | null;
  /** True when the first scene hit at that screen point is the pick id. */
  raycastHitsPickId: (pickId: string) => boolean;
};

declare global {
  interface Window {
    __lrModelPickApi?: ModelPickApi;
  }
}

/** Dev/test harness only: project a first-hit-visible mesh point for Playwright. */
export function ModelPickHarness() {
  const { camera, gl, scene } = useThree();

  useEffect(() => {
    const api: ModelPickApi = {
      screenPointForPickId(pickId) {
        return projectedScreenPointForPickId(scene, camera, gl.domElement, pickId);
      },
      raycastHitsPickId(pickId) {
        const point = api.screenPointForPickId(pickId);
        if (!point) return false;
        return firstPickIdFromRay(scene, camera, gl.domElement, point.x, point.y) === pickId;
      },
    };
    window.__lrModelPickApi = api;
    return () => {
      if (window.__lrModelPickApi === api) delete window.__lrModelPickApi;
    };
  }, [camera, gl, scene]);

  return null;
}
