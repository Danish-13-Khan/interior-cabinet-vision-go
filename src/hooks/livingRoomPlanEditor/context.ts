import type { Dispatch, SetStateAction } from "react";
import type { CabinetProject } from "../../domain/cabinetDimensions";
import { syncHostedAppliances } from "../../domain/hostedAppliances";
import { cabinetProjectFromInteriorProject, type InteriorProject } from "../../domain/interiorProject";
import type { CommitProjectChange } from "../projectCommit";

export type CommitDocument = (
  update: (current: InteriorProject) => InteriorProject,
  status: string,
  cabinetIds?: string[],
) => void;

/** What every command group needs. Rebuilt each render, like the inline functions it replaced. */
export type EditorCommandContext = {
  document: InteriorProject | null;
  commitDocument: CommitDocument;
  selectedObjectIds: string[];
  setSelectedObjectIds: Dispatch<SetStateAction<string[]>>;
  setPreDropReason: Dispatch<SetStateAction<string | null>>;
  onStatus?: (status: string) => void;
};

export function uniqueObjectId(category: string) {
  const suffix = globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `living-object-${category}-${suffix}`;
}

export function currentLivingRoomDocument(project: CabinetProject) {
  return project.interiorDocument ?? null;
}

/** The wall a snapped cabinet attached to, if any. */
export function attachedWallId(extensions: Record<string, unknown> | undefined): string | undefined {
  const wallAttachment = extensions?.wallAttachment;
  return wallAttachment && typeof wallAttachment === "object"
    ? (wallAttachment as { wallId?: string }).wallId
    : undefined;
}

export function createCommitDocument(commitProjectChange: CommitProjectChange): CommitDocument {
  return (update, status, cabinetIds) => {
    commitProjectChange((currentProject) => {
      const current = currentLivingRoomDocument(currentProject);
      if (!current) return null;
      const next = {
        ...syncHostedAppliances(update(current)),
        updatedAt: new Date().toISOString(),
      };
      const compatible = cabinetProjectFromInteriorProject(next);
      const selected = cabinetIds ?? [];
      return {
        project: compatible.project,
        room: compatible.room,
        selectedCabinetIds: selected,
        activeCabinetId: selected[0] ?? null,
        selectedPanelName: null,
      };
    }, status);
  };
}
