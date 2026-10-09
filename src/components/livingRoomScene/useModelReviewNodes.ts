import { useMemo } from "react";
import type { CompiledLivingRoomScene, ModelViewPresetId } from "../../domain/livingRoom";
import { resolveCabinetRunFrame, type CabinetRunAudience } from "../../domain/livingRoom/cabinetRunFrame";
import {
  filterModelReviewNodes, modelCutawayNodeIds, modelViewCutsNearWall, modelViewHidesCeiling,
  resolveModelCutawaySides,
} from "../../domain/livingRoom/modelReviewNodes";
import { useOrbitCutawaySides } from "./useOrbitCutawaySides";

const NONE: ReadonlySet<string> = new Set();

type Input = {
  scene: CompiledLivingRoomScene;
  center: { x: number; z: number };
  renderCamera: { position: { x: number; z: number } } | null;
  viewPreset: ModelViewPresetId | undefined;
  cutawayWalls: boolean;
  /** "ghost" keeps cut walls as translucent shells (live view); "remove" drops them (captures). */
  cutawayStyle: "ghost" | "remove";
  showCeiling: boolean;
  interactive: boolean;
  frameRun: CabinetRunAudience | undefined;
  selectedOpeningId: string | null;
  selectedWallId: string | null;
  selectedLightId: string | null;
};

/**
 * Which compiled nodes the model view draws, which draw as cutaway ghosts, and
 * which let rays through (the ceiling slab when the Ceiling toggle keeps it in
 * an overhead preset, so clicking from above still reaches the room).
 */
export function useModelReviewNodes(input: Input) {
  const {
    scene, center, renderCamera, viewPreset, cutawayWalls, cutawayStyle, showCeiling,
    interactive, frameRun, selectedOpeningId, selectedWallId, selectedLightId,
  } = input;
  const savedCutawaySides = resolveModelCutawaySides(renderCamera?.position ?? null, center);
  const cutNearWall = modelViewCutsNearWall(viewPreset);
  const orbitCutawaySides = useOrbitCutawaySides(
    (cutawayWalls && interactive) || cutNearWall,
    center.x, center.z,
    renderCamera?.position.x ?? null, renderCamera?.position.z ?? null,
  );
  const clientCutaway = useMemo(
    () => (frameRun === "client"
      ? resolveCabinetRunFrame(scene, { widthPx: 16, heightPx: 9 }, { audience: "client" })?.cutawaySides ?? null
      : null),
    [scene, frameRun],
  );
  const cutawaySides = clientCutaway
    ?? ((cutawayWalls && interactive) || cutNearWall ? orbitCutawaySides : savedCutawaySides);
  const hideCeiling = modelViewHidesCeiling(viewPreset, showCeiling) || Boolean(clientCutaway);
  // A selected wall light keeps its host wall standing, as selecting the wall would.
  const selectedLightHost = selectedLightId
    ? scene.lights.find((light) => light.id === selectedLightId)?.parameters.hostWallId
    : undefined;
  const keepWallId = selectedWallId ?? (typeof selectedLightHost === "string" ? selectedLightHost : null);
  const cutawayActive = cutawayWalls || cutNearWall || Boolean(clientCutaway);
  // Ghosted cutaway keeps every wall in the scene and only changes how it draws,
  // so a freshly drawn room never reads as a box with a missing face.
  const nodes = filterModelReviewNodes(
    scene.nodes, cutawayActive && cutawayStyle === "remove", cutawaySides,
    selectedOpeningId, hideCeiling, keepWallId,
  );
  const cutawaySidesKey = [...cutawaySides].sort().join(",");
  const ghostIds = useMemo(
    () => (cutawayActive && cutawayStyle === "ghost"
      ? modelCutawayNodeIds(nodes, cutawaySides, selectedOpeningId, keepWallId)
      : NONE),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cutawaySidesKey stands in for the Set
    [nodes, cutawayActive, cutawayStyle, cutawaySidesKey, selectedOpeningId, keepWallId],
  );
  const ceilingHeldOpen = !hideCeiling && modelViewHidesCeiling(viewPreset);
  const pickThroughIds = useMemo(
    () => (ceilingHeldOpen
      ? new Set(nodes.filter((node) => node.metadata.surface === "ceiling").map((node) => node.id))
      : NONE),
    [nodes, ceilingHeldOpen],
  );
  return { nodes, ghostIds, pickThroughIds };
}
