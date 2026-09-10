import { interiorsPresentHint, type InteriorsPresentStep } from "../../domain/desktopUx";

export function InteriorsPresentTitlebar({
  step,
  unit,
}: {
  step: InteriorsPresentStep;
  unit: string;
}) {
  return (
    <div className="lr-draw-titlebar lr-plan-titlebar lr-present-titlebar" data-testid="interiors-present-titlebar">
      <span>
        <strong>Present and Send</strong>
        {" · "}
        {interiorsPresentHint(step)}
      </span>
      <small>Client 3D · Units: {unit}</small>
    </div>
  );
}
