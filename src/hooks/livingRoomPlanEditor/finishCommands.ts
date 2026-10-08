import type { RenderSettings } from "../../domain/interiorProject";
import type { FinishUvRebind } from "../../domain/catalog/finishRebind";
import { describeUnderlayCalibration } from "../../domain/livingRoom/planUnderlayCalibrate";
import { describeUnderlayReplace } from "../../domain/livingRoom/planUnderlayTransform";
import {
  applyLivingRoomLightingRecipe,
  applyLivingRoomStyle,
  getActiveLivingRoomStyleId,
  getLivingRoomPlanUnderlay,
  getLivingRoomStylePreset,
  paintLivingRoomSurface,
  setLivingRoomLayerVisibility,
  setLivingRoomPlanUnderlay,
  setLivingRoomWallMaterial,
  type FinishImportDraft,
  type FinishUvPatch,
  type LivingRoomLayerId,
  type LivingRoomLightingRecipeId,
  type LivingRoomPlanUnderlay,
  type LivingRoomStyleId,
} from "../../domain/livingRoom";
import {
  importLivingRoomFinish as commitImportedFinish,
  paintLivingRoomCeiling as commitCeilingPaint,
  paintLivingRoomMaterialColour as commitMaterialColour,
  setLivingRoomFinishUv as commitFinishUv,
} from "../livingRoomSketchCommands";
import type { EditorCommandContext } from "./context";

type FinishApplyTarget = {
  wallId?: string;
  floor?: boolean;
  ceiling?: boolean;
  selection?: { objectIds: readonly string[]; slotName?: string };
};

/** Surface finishes, layers, the plan underlay, interior style, and Render Studio settings. */
export function finishCommands(ctx: EditorCommandContext) {
  const { document, commitDocument, onStatus } = ctx;

  function setPlanUnderlay(underlay: LivingRoomPlanUnderlay | null) {
    const previous = document ? getLivingRoomPlanUnderlay(document) : null;
    const replaced = Boolean(underlay && previous
      && (underlay.fileName !== previous.fileName || underlay.dataUrl !== previous.dataUrl));
    const calibrated = Boolean(underlay && previous && underlay.calibration
      && JSON.stringify(underlay.calibration) !== JSON.stringify(previous.calibration ?? null));
    const lockedNow = Boolean(underlay?.locked && !previous?.locked);
    const status = !underlay
      ? "Removed plan underlay."
      : !previous
        ? "Imported plan underlay."
        : replaced
          ? describeUnderlayReplace(previous, underlay)
          : calibrated && underlay.calibration
            ? `Calibrated plan underlay — ${describeUnderlayCalibration(underlay.calibration)}.${lockedNow ? " Locked." : ""}`
            : Boolean(underlay.calibrated) && !previous.calibrated
              ? "Calibrated plan underlay."
              : "Updated plan underlay.";
    commitDocument(
      (current) => setLivingRoomPlanUnderlay(current, underlay),
      status,
    );
  }

  function setRenderSettings(patch: Partial<RenderSettings>) {
    if (!document) return;
    const changed = Object.entries(patch).some(
      ([key, value]) => document.renderSettings[key as keyof RenderSettings] !== value,
    );
    if (!changed) return;
    commitDocument(
      (current) => ({
        ...current,
        renderSettings: { ...current.renderSettings, ...patch },
      }),
      "Updated Render Studio settings.",
    );
  }

  return {
    setLivingRoomFloorMaterial: (materialId: string) => {
      if (!document?.materials.some((material) => material.id === materialId)) return;
      commitDocument((current) => paintLivingRoomSurface(current, { kind: "floor" }, materialId), "Painted floor surface.");
    },
    setLivingRoomCeilingMaterial: (materialId: string) => commitCeilingPaint(commitDocument, materialId),
    setLivingRoomWallMaterial: (wallId: string, materialId: string | null) => {
      if (!document || (materialId !== null && !document.materials.some((material) => material.id === materialId))) return;
      commitDocument((current) => setLivingRoomWallMaterial(current, wallId, materialId), "Painted wall surface.");
    },
    applyMaterialColour: (materialId: string, color: string, rebinds: FinishUvRebind[]) =>
      commitMaterialColour(commitDocument, materialId, color, rebinds),
    setLivingRoomLayerVisibility: (layer: LivingRoomLayerId, visible: boolean) => {
      commitDocument((current) => setLivingRoomLayerVisibility(current, layer, visible), `${visible ? "Showed" : "Hid"} ${layer} layer.`);
    },
    setLivingRoomPlanUnderlay: setPlanUnderlay,
    importLivingRoomFinish: (source: FinishImportDraft | File, apply?: FinishApplyTarget) =>
      commitImportedFinish(commitDocument, source, apply, onStatus),
    setLivingRoomFinishUv: (materialId: string, patch: FinishUvPatch, rebind?: FinishUvRebind) =>
      commitFinishUv(commitDocument, materialId, patch, rebind),
    setLivingRoomStyle: (styleId: LivingRoomStyleId) => {
      if (!document || getActiveLivingRoomStyleId(document) === styleId) return;
      commitDocument(
        (current) => applyLivingRoomStyle(current, styleId),
        `Applied ${getLivingRoomStylePreset(styleId).name} interior style.`,
      );
    },
    setLivingRoomRenderSettings: setRenderSettings,
    setLivingRoomLightingRecipe: (recipeId: LivingRoomLightingRecipeId) => {
      if (!document || document.renderSettings.lightingRecipeId === recipeId) return;
      commitDocument(
        (current) => applyLivingRoomLightingRecipe(current, recipeId),
        `Applied ${recipeId.split("-").join(" ")} lighting.`,
      );
    },
  };
}
