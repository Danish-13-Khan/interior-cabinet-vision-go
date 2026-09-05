import type { InteriorsChromeTool } from "../../domain/desktopUx";
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
  onShowGrid,
  onSnapSize,
  onReadability,
}: {
  tool: InteriorsChromeTool;
  showGrid: boolean;
  snapSizeMm: number;
  readability: PlanReadabilitySettings;
  commands: InteriorsCabinetRunCommands;
  onShowGrid: (value: boolean) => void;
  onSnapSize: (value: number) => void;
  onReadability: (patch: Partial<PlanReadabilitySettings>) => void;
}) {
  return (
    <>
      <InteriorsCabinetRunTitlebar
        tool={tool} showGrid={showGrid} snapSizeMm={snapSizeMm} readability={readability}
        commands={commands}
        onShowGrid={onShowGrid} onSnapSize={onSnapSize} onReadability={onReadability}
      />
      <InteriorsCabinetRunTray commands={commands} />
    </>
  );
}
