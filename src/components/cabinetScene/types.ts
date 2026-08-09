import type { RefObject } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { CabinetInstance, CabinetProject } from "../../domain/cabinetDimensions";
import type { CabinetSceneItem, PanelName } from "../../domain/cabinetGeometry";
import type { CountertopSegment, RunFiller } from "../../domain/cabinetLibrary";
import type { RoomConfig } from "../../domain/roomModel";

export type ViewPreset = "iso" | "front" | "side" | "top";
export type ResizeAxis = "width" | "height" | "depth";

export type CabinetSceneHandle = {
  captureThumbnail: () => string | null;
  setViewPreset: (preset: ViewPreset) => void;
  fitView: () => void;
};

export type CabinetSceneProps = {
  project: CabinetProject;
  snapSizeMm: number;
  showGrid?: boolean;
  room?: RoomConfig;
  countertops?: CountertopSegment[];
  fillers?: RunFiller[];
  onCabinetMove: (cabinetId: string, placement: CabinetInstance["placement"]) => boolean;
  onCabinetRotate?: (cabinetId: string, rotation: number) => void;
  selectedCabinetIds: string[];
  activeCabinetId: string | null;
  selectedPanelName: PanelName | null;
  onCabinetResize: (cabinetId: string, dimensions: CabinetInstance["config"]["dimensions"]) => void;
  onSelectedCabinetChange: (cabinetId: string | null, additive?: boolean) => void;
  onSelectedPanelChange: (cabinetId: string | null, name: PanelName | null, additive?: boolean) => void;
  onMarqueeSelect?: (cabinetIds: string[], additive?: boolean) => void;
};

export type RoomShellDims = {
  widthMm: number;
  depthMm: number;
  heightMm: number;
  showBackWall: boolean;
  showLeftWall: boolean;
  showRightWall: boolean;
};

export type CameraControllerProps = {
  items: CabinetSceneItem[];
  roomDimensions: RoomShellDims;
  selectedCabinetId: string | null;
  viewPreset: ViewPreset;
  fitVersion: number;
  controlsRef: RefObject<OrbitControlsImpl | null>;
};

export type ResizeHandleProps = {
  axis: ResizeAxis;
  cabinet: CabinetSceneItem;
  onResize: (dimensions: CabinetInstance["config"]["dimensions"]) => void;
};

export type MoveHandleProps = {
  cabinet: CabinetSceneItem;
  roomDimensions: RoomShellDims;
  snapSizeMm: number;
  allCabinets?: CabinetSceneItem[];
  onMove: (placement: CabinetInstance["placement"]) => boolean;
  onDragStateChange?: (dragging: boolean) => void;
};

export type RotateHandleProps = {
  cabinet: CabinetSceneItem;
  onRotate: (placement: CabinetInstance["placement"]) => void;
  onDragStateChange?: (dragging: boolean) => void;
};
