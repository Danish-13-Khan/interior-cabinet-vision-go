export type InteriorsCabinetRunCommands = {
  wallId: string | null;
  snapWarning: string | null;
  selectedCount: number;
  selectedRunId: string | null;
  fillerCount: number;
  fillersEnabled: boolean;
  runLengthMm: number | null;
  onCreateRun: () => void;
  onUpdateRun: (runId: string, options: {
    gapMm?: number;
    alignment?: "start" | "center" | "end";
    extendToWall?: boolean;
    fillersEnabled?: boolean;
  }) => void;
};
