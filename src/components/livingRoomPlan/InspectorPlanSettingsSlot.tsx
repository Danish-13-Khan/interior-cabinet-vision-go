import { createPortalSlot } from "./portalSlot";

/** Room & plan settings while the inspector shows room essentials (nothing selected). */
const planSettings = createPortalSlot("lr-inspector-plan-settings", "inspector-plan-settings");
export const InspectorPlanSettingsSlot = planSettings.Slot;
export const useInspectorPlanSettingsSlot = planSettings.useSlot;

/** 3D-only extras (cabinet fronts, style picker on the Materials step). */
const modelExtras = createPortalSlot("lr-inspector-model-extras", "inspector-model-extras");
export const InspectorModelExtrasSlot = modelExtras.Slot;
export const useInspectorModelExtrasSlot = modelExtras.useSlot;

/** 3D view presets and framing tools in the canvas header. */
const canvasHeaderTools = createPortalSlot("lr-canvas-header-tools", "canvas-header-tools");
export const CanvasHeaderToolsSlot = canvasHeaderTools.Slot;
export const useCanvasHeaderToolsSlot = canvasHeaderTools.useSlot;
