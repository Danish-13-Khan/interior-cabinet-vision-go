import type { CabinetConfig, CabinetInstance, CabinetPlacement, CabinetGroup, CabinetLayer, ProjectPreferences } from "../../domain/cabinetDimensions";
import type { CabinetPart } from "../../domain/cabinetConstruction";
import type { CabinetDerivedMetrics, PanelName } from "../../domain/cabinetGeometry";
import type { ProductionCutlistLine } from "../../domain/productionCutlist";
import type { ManufacturingIssue } from "../../domain/manufacturingRules";

export type SavedProjectSummary = {
  id: string;
  name: string;
  thumbnail: string;
  updatedAt: string;
};

export type DimensionControlsProps = {
  cabinetCount: number;
  cabinetCutlistItems: ProductionCutlistLine[];
  cabinets: CabinetInstance[];
  config: CabinetConfig;
  derivedMetrics: CabinetDerivedMetrics;
  cutlistItems: ProductionCutlistLine[];
  projectFilePath: string | null;
  projectStatus: string;
  savedProjects: SavedProjectSummary[];
  snapSizeMm: number;
  selectedCabinetIds: string[];
  activeCabinetId: string | null;
  selectedPanelName: PanelName | null;
  selectedPlacement: CabinetPlacement | null;
  selectedLayerId: string;
  selectedGroupId: string | null;
  layers: CabinetLayer[];
  groups: CabinetGroup[];
  preferences: ProjectPreferences;
  selectionLabel: string;
  validationMessages: string[];
  manufacturingIssues: ManufacturingIssue[];
  constructionParts: CabinetPart[];
  onAttachmentChange: (attachment: CabinetPlacement["attachment"]) => void;
  onAlignSelection: (
    mode:
      | "align-left"
      | "align-center-x"
      | "align-right"
      | "align-top"
      | "align-center-z"
      | "align-bottom"
      | "distribute-x"
      | "distribute-z",
  ) => void;
  onAssignLayer: (layerId: string) => void;
  onConfigChange: (config: Partial<CabinetConfig>) => void;
  onCopySelection: () => void;
  onCreateGroup: () => void;
  onCreateLayer: () => void;
  onClearGroup: () => void;
  onDeleteSavedProject: (projectId: string) => void;
  onDuplicateCabinet: () => void;
  onDuplicateSavedProject: (projectId: string) => void;
  onExportCutlistCsv: () => Promise<void>;
  onExportProjectJson: () => Promise<void>;
  onExportPdf: () => Promise<void>;
  onLayerChange: (layerId: string, patch: Partial<CabinetLayer>) => void;
  onLoadProject: () => Promise<void>;
  onLoadSavedProject: (projectId: string) => void;
  onPasteSelection: () => void;
  onPlacementChange: (axis: "x" | "y" | "z", value: number) => void;
  onPreferenceChange: (patch: Partial<ProjectPreferences>) => void;
  onSaveCabinetTemplate?: (name?: string) => void;
  onRemoveCabinet: () => void;
  onRenameCabinet: (cabinetId: string, name: string) => void;
  onRenameSavedProject: (projectId: string, name: string) => void;
  onReset: () => void;
  onRotationChange: (rotation: number) => void;
  onSaveProject: () => Promise<void>;
  onSaveToProjectBrowser: () => void | Promise<void>;
  onSelectCabinet: (cabinetId: string, additive?: boolean) => void;
  onSelectAll: () => void;
  onUndo: () => void;
  onRedo: () => void;
};

export type NumericInputKey =
  | "width"
  | "height"
  | "depth"
  | "shelfCount"
  | "drawerCount"
  | "toeKickHeight"
  | "toeKickInset"
  | "placementX"
  | "placementY"
  | "placementZ";
