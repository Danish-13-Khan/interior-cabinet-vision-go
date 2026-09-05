export type InteriorsCabinetRunCommands = {
  wallId: string | null;
  snapWarning: string | null;
  selectedCount: number;
  selectedRunId: string | null;
  fillerCount: number;
  fillersEnabled: boolean;
  runLengthMm: number | null;
  remainingMm: number | null;
  completeSummary: string | null;
  leftoverMessage: string | null;
  planMarksEnabled: boolean;
  onCreateRun: () => void;
  onUpdateRun: (runId: string, options: {
    gapMm?: number;
    alignment?: "start" | "center" | "end";
    extendToWall?: boolean;
    fillersEnabled?: boolean;
  }) => void;
  onCompleteRun: (runId: string) => void;
  onTogglePlanMarks: (enabled: boolean) => void;
};
