import type { InteriorProject, Size3Mm } from "../interiorProject";
import { LIVING_ROOM_CATALOG, type LivingRoomCatalogId } from "./catalog";
import type { LivingRoomPlanUnderlay } from "./planUnderlay";

export type AdvancedFloor = { id: string; name: string };
export type AdvancedReviewNote = { id: string; text: string; createdAt: string };
export type AdvancedStudioState = {
  floors: AdvancedFloor[];
  reviewNotes: AdvancedReviewNote[];
  shareLabel: string;
};

export type LayoutSuggestion = {
  id: string;
  title: string;
  detail: string;
  catalogIds: LivingRoomCatalogId[];
};

export type VendorEstimate = { vendor: string; total: number; currency: string };

const DEFAULT_STATE: AdvancedStudioState = {
  floors: [{ id: "floor-1", name: "Floor 1" }],
  reviewNotes: [],
  shareLabel: "Client review",
};

export function getAdvancedStudioState(project: InteriorProject): AdvancedStudioState {
  const value = project.extensions?.advancedStudio;
  if (!value || typeof value !== "object") return DEFAULT_STATE;
  const source = value as Partial<AdvancedStudioState>;
  return {
    floors: Array.isArray(source.floors) && source.floors.length
      ? source.floors.filter((floor): floor is AdvancedFloor => Boolean(floor?.id && floor?.name))
      : DEFAULT_STATE.floors,
    reviewNotes: Array.isArray(source.reviewNotes)
      ? source.reviewNotes.filter((note): note is AdvancedReviewNote => Boolean(note?.id && note?.text)).slice(0, 40)
      : [],
    shareLabel: typeof source.shareLabel === "string" ? source.shareLabel.slice(0, 60) : DEFAULT_STATE.shareLabel,
  };
}

export function setAdvancedStudioState(project: InteriorProject, state: AdvancedStudioState): InteriorProject {
  return { ...project, extensions: { ...project.extensions, advancedStudio: state } };
}

export function recognizePlanUnderlay(underlay: LivingRoomPlanUnderlay | null, room: Size3Mm) {
  if (!underlay) return { confidence: 0, dimensions: room, message: "Import a PNG, JPG, or WebP plan to start recognition." };
  const ratio = underlay.heightMm / Math.max(1, underlay.widthMm);
  const dimensions = { ...room, depthMm: Math.max(2500, Math.round(room.widthMm * ratio / 50) * 50) };
  return { confidence: 72, dimensions, message: "Draft geometry inferred from the calibrated image ratio. Confirm dimensions before building." };
}

export function listLayoutSuggestions(project: InteriorProject): LayoutSuggestion[] {
  const has = (id: string) => project.objects.some((item) => item.catalogItemId === id);
  return [
    { id: "conversation", title: "Conversation zone", detail: has("living:sofa-3-seat") ? "Sofa already placed; add a table to complete the group." : "Anchor the room with a sofa, coffee table, and lounge chair.", catalogIds: has("living:sofa-3-seat") ? ["living:coffee-table", "living:lounge-chair"] : ["living:sofa-3-seat", "living:coffee-table", "living:lounge-chair"] },
    { id: "media", title: "Media wall", detail: "Pair the feature wall with a floating TV console.", catalogIds: ["living:feature-wall-fluted", "living:tv-unit"] },
    { id: "storage", title: "Storage wall", detail: "Create a wardrobe and lit display pairing along the active wall.", catalogIds: ["living:wardrobe-wall", "living:display-niche"] },
  ];
}

export function estimateVendorPricing(project: InteriorProject): VendorEstimate[] {
  const base = project.objects.reduce((sum, object) => {
    const catalog = LIVING_ROOM_CATALOG.find((item) => item.id === object.catalogItemId);
    const area = object.dimensions.widthMm * object.dimensions.heightMm / 1_000_000;
    return sum + (catalog?.kind === "cabinet" ? 420 * Math.max(1, area) : 180 * Math.max(1, area));
  }, 0);
  return [
    { vendor: "Studio Select", total: Math.round(base * 1.08), currency: "USD" },
    { vendor: "Trade Partner", total: Math.round(base * 0.96), currency: "USD" },
  ];
}

export function clientShareBrief(project: InteriorProject, state: AdvancedStudioState) {
  return `${state.shareLabel}\n${project.name} · ${project.rooms.length} room(s) · ${project.objects.length} placed item(s)\nOpen the Client Package from Render Studio to review the PDF, render, materials, and project data.`;
}
