import { useCallback, useEffect, useRef, useState } from "react";
import type { ModelViewPresetId } from "../domain/livingRoom";
import {
  overviewCameraId,
  type OverviewCorner,
} from "../domain/livingRoom/overviewCameras";
import { waitForOverviewWarm } from "../domain/livingRoom/overviewWarmup";

export type OverviewPhase = "idle" | "warming-in" | "overview" | "warming-out";

type ApartmentOverviewArgs = {
  enabled: boolean;
  viewPreset: ModelViewPresetId;
  setViewPreset: (preset: ModelViewPresetId) => void;
  activeCameraId: string | null;
  setActiveCameraId: (cameraId: string | null) => void;
  stopTour: () => void;
  /** Fit the active room after a click-to-enter warm-up. View state only. */
  onFrameRoom: () => void;
};

/**
 * Whole-apartment view mode. Entering, orbiting and leaving never touch the
 * document. Clicking a room is the caller's job (the normal room switch).
 */
export function useApartmentOverview(args: ApartmentOverviewArgs) {
  const [phase, setPhase] = useState<OverviewPhase>("idle");
  const [corner, setCorner] = useState<OverviewCorner>("ne");
  const argsRef = useRef(args);
  argsRef.current = args;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const abortRef = useRef<AbortController | null>(null);
  const presetBefore = useRef(args.viewPreset);
  const cameraBefore = useRef(args.activeCameraId);

  const replaceAbort = () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    return controller;
  };

  const leave = useCallback((frameRoom: boolean) => {
    if (phaseRef.current === "idle" || phaseRef.current === "warming-out") return;
    const current = argsRef.current;
    const controller = replaceAbort();
    phaseRef.current = "warming-out";
    setPhase("warming-out");
    current.setViewPreset(frameRoom ? "dollhouse" : presetBefore.current);
    current.setActiveCameraId(cameraBefore.current);
    void waitForOverviewWarm(controller.signal).then(() => {
      if (controller.signal.aborted) return;
      phaseRef.current = "idle";
      setPhase("idle");
      if (frameRoom) argsRef.current.onFrameRoom();
    });
  }, []);

  const enter = useCallback(() => {
    const current = argsRef.current;
    if (!current.enabled) return;
    presetBefore.current = current.viewPreset;
    cameraBefore.current = current.activeCameraId;
    current.stopTour();
    const controller = replaceAbort();
    setCorner("ne");
    current.setViewPreset("perspective");
    current.setActiveCameraId(overviewCameraId("ne"));
    phaseRef.current = "warming-in";
    setPhase("warming-in");
    void waitForOverviewWarm(controller.signal).then(() => {
      if (controller.signal.aborted) return;
      phaseRef.current = "overview";
      setPhase("overview");
    });
  }, []);

  const chooseCorner = useCallback((next: OverviewCorner) => {
    setCorner(next);
    argsRef.current.setViewPreset("perspective");
    argsRef.current.setActiveCameraId(overviewCameraId(next));
  }, []);

  useEffect(() => {
    if (phase === "idle") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      event.preventDefault();
      leave(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, leave]);

  useEffect(() => {
    if (!args.enabled && (phase === "overview" || phase === "warming-in")) leave(false);
  }, [args.enabled, phase, leave]);

  useEffect(() => () => abortRef.current?.abort(), []);

  return {
    phase,
    corner,
    showApartment: phase === "warming-in" || phase === "overview",
    enter,
    leave,
    chooseCorner,
  };
}
