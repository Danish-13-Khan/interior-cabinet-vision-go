import type { PlanReadabilitySettings } from "../../domain/livingRoom";
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
  return (
    <>
      <InteriorsPresentTitlebar step={commands.step} unit={readability.unit} />
      <InteriorsPresentTray step={commands.step} />
    </>
  );
}
