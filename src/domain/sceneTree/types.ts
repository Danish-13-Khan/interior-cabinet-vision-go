import type { CabinetRunSide } from "../cabinetLibrary";
import type { CabinetType } from "../cabinetDimensions";
import type { OpeningContentType } from "../cabinetOpeningStructure";

export type SceneTreeNodeKind = "room" | "wall" | "run" | "cabinet" | "opening";

export type SceneTreeWallId = CabinetRunSide;

export type SceneTreeNode = {
  id: string;
  kind: SceneTreeNodeKind;
  label: string;
  detail: string;
  /** Short family / node glyph shown in the tree. */
  icon: string;
  /** CSS accent token key for family icons. */
  iconTone: string;
  roomId: string;
  wallId?: SceneTreeWallId;
  runId?: string;
  cabinetId?: string;
  openingId?: string;
  cabinetType?: CabinetType;
  openingContentType?: OpeningContentType;
  /** Descendant cabinet ids (for select / isolate / focus). */
  cabinetIds: string[];
  children: SceneTreeNode[];
};
