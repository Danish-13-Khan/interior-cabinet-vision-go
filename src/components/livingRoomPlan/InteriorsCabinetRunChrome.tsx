import type { InteriorsChromeTool } from "../../domain/desktopUx";
import type { InteriorProject } from "../../domain/interiorProject";
import type { PlanReadabilitySettings } from "../../domain/livingRoom";
import { InteriorsCabinetRunTitlebar } from "./InteriorsCabinetRunTitlebar";
import { InteriorsCabinetRunTray } from "./InteriorsCabinetRunTray";
import type { InteriorsCabinetRunCommands } from "./interiorsCabinetRunCommands";

export function InteriorsCabinetRunChrome({
  tool,
  showGrid,
  snapSizeMm,
  readability,
  commands,
  project,
  onPatchDocument,
  onShowGrid,
  onSnapSize,
  onReadability,
}: {
  tool: InteriorsChromeTool;
  showGrid: boolean;
  snapSizeMm: number;
  readability: PlanReadabilitySettings;
  commands: InteriorsCabinetRunCommands;
  project: InteriorProject;
  onPatchDocument: (
    update: (current: InteriorProject) => InteriorProject,
    status: string,
  ) => void;
  onShowGrid: (value: boolean) => void;
  onSnapSize: (value: number) => void;
  onReadability: (patch: Partial<PlanReadabilitySettings>) => void;
}) {
  return (
    <>
      <InteriorsCabinetRunTitlebar
        tool={tool} showGrid={showGrid} snapSizeMm={snapSizeMm} readability={readability}
        commands={commands} project={project} onPatchDocument={onPatchDocument}
        onShowGrid={onShowGrid} onSnapSize={onSnapSize} onReadability={onReadability}
      />
      <InteriorsCabinetRunTray commands={commands} />
    </>
  );
}
