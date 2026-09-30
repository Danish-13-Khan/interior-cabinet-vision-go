import {
  addWallPanel as addWallPanelCommand,
  arrangeCabinetRun,
  completeCabinetRun,
  setCabinetInlineDimensions,
  setPanelVisible as setPanelVisibleCommand,
  updateCabinetRunLayout,
  updatePanelAttachment as updatePanelAttachmentCommand,
} from "../../domain/livingRoom";
import type { EditorCommandContext } from "./context";

type RunLayoutOptions = {
  gapMm?: number;
  alignment?: "start" | "center" | "end";
  extendToWall?: boolean;
  fillersEnabled?: boolean;
};

/** Cabinet runs, inline cabinet sizes, and wall panels. */
export function cabinetRunCommands(ctx: EditorCommandContext) {
  const { document, commitDocument, selectedObjectIds, setSelectedObjectIds, onStatus } = ctx;

  function completeRun(runId: string) {
    let leftover: string | null = null;
    commitDocument((current) => {
      const result = completeCabinetRun(current, runId);
      leftover = result?.leftoverMessage ?? null;
      return result?.project ?? current;
    }, leftover ? `Completed cabinet run — ${leftover}` : "Completed cabinet run.");
    if (leftover) onStatus?.(leftover);
  }

  return {
    createLivingRoomCabinetRun: (wallId: string) => {
      if (selectedObjectIds.length < 2) return;
      commitDocument((current) => arrangeCabinetRun(current, selectedObjectIds, wallId), "Created cabinet run.");
    },
    updateLivingRoomCabinetRun: (runId: string, options: RunLayoutOptions) => {
      commitDocument((current) => updateCabinetRunLayout(current, runId, options), "Updated cabinet run.");
    },
    completeLivingRoomCabinetRun: completeRun,
    setLivingRoomCabinetInlineDims: (objectId: string, dims: { widthMm?: number; depthMm?: number; heightMm?: number }) => {
      commitDocument(
        (current) => setCabinetInlineDimensions(current, objectId, dims),
        "Updated cabinet dimensions.",
      );
    },
    addLivingRoomWallPanel: (wallId: string) => {
      if (!document) return;
      let createdId: string | null = null;
      commitDocument((current) => {
        const next = addWallPanelCommand(current, wallId);
        const existing = new Set(current.objects.map((object) => object.id));
        createdId = next.objects.find((object) => !existing.has(object.id))?.id ?? null;
        return next;
      }, "Added wall panel.");
      if (createdId) setSelectedObjectIds([createdId]);
    },
    updateLivingRoomPanelAttachment: (
      objectId: string,
      patch: Parameters<typeof updatePanelAttachmentCommand>[2],
    ) => {
      commitDocument(
        (current) => updatePanelAttachmentCommand(current, objectId, patch),
        "Updated wall panel.",
      );
    },
    setLivingRoomPanelVisible: (objectId: string, visible: boolean) => {
      commitDocument(
        (current) => setPanelVisibleCommand(current, objectId, visible),
        visible ? "Showed wall panel." : "Hid wall panel.",
      );
    },
  };
}
