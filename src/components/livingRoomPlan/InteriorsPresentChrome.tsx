import type { PlanReadabilitySettings } from "../../domain/livingRoom";
import type { InteriorsPresentCommands } from "./interiorsPresentCommands";
import { InteriorsPresentTitlebar } from "./InteriorsPresentTitlebar";
import { InteriorsPresentTray } from "./InteriorsPresentTray";

export function InteriorsPresentChrome({
  readability,
  commands,
  onReadability,
}: {
  readability: PlanReadabilitySettings;
  commands: InteriorsPresentCommands;
  onReadability: (patch: Partial<PlanReadabilitySettings>) => void;
}) {
  return (
    <>
      <InteriorsPresentTitlebar
        step={commands.step} readability={readability} onReadability={onReadability}
      />
      <InteriorsPresentTray step={commands.step} />
    </>
  );
}
