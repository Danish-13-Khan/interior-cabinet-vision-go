import { createPortalSlot } from "./portalSlot";

/** Room & plan settings, docked at the top of the left catalogue in every view. */
const planSettings = createPortalSlot("lr-catalog-plan-settings", "catalog-plan-settings");
export const CatalogPlanSettingsSlot = planSettings.Slot;
export const useCatalogPlanSettingsSlot = planSettings.useSlot;

/** 3D-only extras (cabinet fronts, style picker on the Materials step). */
const modelExtras = createPortalSlot("lr-inspector-model-extras", "inspector-model-extras");
export const InspectorModelExtrasSlot = modelExtras.Slot;
export const useInspectorModelExtrasSlot = modelExtras.useSlot;

/** Scene object list at the foot of the left catalogue rail. */
const sceneList = createPortalSlot("lr-catalog-scene", "catalog-scene-slot");
export const SceneListSlot = sceneList.Slot;
export const useSceneListSlot = sceneList.useSlot;

/** 3D view presets and framing tools in the canvas header. */
const canvasHeaderTools = createPortalSlot("lr-canvas-header-tools", "canvas-header-tools");
export const CanvasHeaderToolsSlot = canvasHeaderTools.Slot;
export const useCanvasHeaderToolsSlot = canvasHeaderTools.useSlot;
