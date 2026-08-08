import type { OpeningContentType } from "../cabinetOpeningStructure";

export type ElevationOpeningSplitCommand =
  | { kind: "split-vertical" }
  | { kind: "split-horizontal" };

export type ElevationOpeningContentCommand = {
  kind: "set-content";
  contentType: OpeningContentType;
};

export type ElevationOpeningCommand =
  | ElevationOpeningSplitCommand
  | ElevationOpeningContentCommand;

export type ElevationOpeningToolbarState = {
  supportsOpenings: boolean;
  activeOpeningId: string | null;
  activeLabel: string | null;
  activeContentType: OpeningContentType | null;
  leafCount: number;
  maxLeaves: number;
  canSplitVertical: boolean;
  canSplitHorizontal: boolean;
  allowedContentTypes: OpeningContentType[];
};

export const ELEVATION_CONTENT_SHORT_LABELS: Record<OpeningContentType, string> = {
  door: "Door",
  "drawer-stack": "Drawers",
  "open-shelf": "Shelves",
  divider: "Divider",
  empty: "Empty",
};
