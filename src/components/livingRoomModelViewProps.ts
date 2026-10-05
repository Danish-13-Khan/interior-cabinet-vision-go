import type { InteriorProject, Point3Mm } from "../domain/interiorProject";
import type { LivingRoomStyleId } from "../domain/livingRoom";
import type { LightFixtureActions } from "../hooks/livingRoomPlanEditor/lightCommands";
import type { ModelTransformPreview } from "./livingRoomScene/ModelMoveGizmo";

export type LivingRoomModelViewProps = {
  project: InteriorProject;
  selectedIds: string[];
  activeOpeningId: string | null;
  activeWallId: string | null;
  activeLightId?: string | null;
  snapSizeMm: number;
  showGrid: boolean;
  onSelect: (objectId: string | null, additive?: boolean) => void;
  onSelectOpening: (openingId: string) => void;
  onSelectWall: (wallId: string) => void;
  onSelectLight?: (lightId: string) => void;
  lightActions?: LightFixtureActions;
  onClearSelection: () => void;
  onMove: (objectId: string, position: Point3Mm) => void;
  onMovePreview?: (objectId: string, position: Point3Mm) => { position: Point3Mm; rotationY: number } | null | void;
  onUpdateOpening?: (openingId: string, patch: { offsetMm?: number; sillHeightMm?: number }) => void;
  onTransformPreviewChange?: (preview: ModelTransformPreview | null) => void;
  onSetRotation: (objectId: string, rotationY: number) => void;
  onApplyStyle: (styleId: LivingRoomStyleId) => void;
  onSetParameters: (objectId: string | readonly string[], patch: Record<string, string | number | boolean>) => void;
  onPatchDocument?: (update: (current: InteriorProject) => InteriorProject, status: string) => void;
  presentation?: boolean;
  showStylePalette?: boolean;
};

