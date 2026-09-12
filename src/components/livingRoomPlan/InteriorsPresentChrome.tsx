import type { PlanReadabilitySettings } from "../../domain/livingRoom";
import { presentChromeForStep } from "../../domain/desktopUx";
import type { InteriorsPresentCommands } from "./interiorsPresentCommands";
import { InteriorsPresentTitlebar } from "./InteriorsPresentTitlebar";
import { InteriorsPresentTray } from "./InteriorsPresentTray";

export function InteriorsPresentChrome({
  readability,
  commands,
}: {
  readability: PlanReadabilitySettings;
  commands: InteriorsPresentCommands;
  onReadability?: (patch: Partial<PlanReadabilitySettings>) => void;
}) {
  const surfaces = presentChromeForStep(commands.step);
  return (
    <>
      {surfaces.titlebar ? (
        <InteriorsPresentTitlebar step={commands.step} unit={readability.unit} />
      ) : null}
      {surfaces.tray ? <InteriorsPresentTray step={commands.step} /> : null}
    </>
  );
}
