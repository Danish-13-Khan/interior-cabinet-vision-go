import { interiorsPresentHint, type InteriorsPresentStep } from "../../domain/desktopUx";
import type { PlanReadabilitySettings } from "../../domain/livingRoom";
import { PlanReadabilityToolbar } from "./PlanReadabilityToolbar";

export function InteriorsPresentTitlebar({
  step,
  readability,
  onReadability,
}: {
  step: InteriorsPresentStep;
  readability: PlanReadabilitySettings;
  onReadability: (patch: Partial<PlanReadabilitySettings>) => void;
}) {
  return (
    <div className="lr-draw-titlebar lr-plan-titlebar lr-present-titlebar has-readability" data-testid="interiors-present-titlebar">
      <span>
        <strong>Present and Send</strong>
        {" · "}
        {interiorsPresentHint(step)}
      </span>
      <PlanReadabilityToolbar settings={readability} onChange={onReadability} />
      <small>Client 3D · Units: {readability.unit}</small>
    </div>
  );
}
