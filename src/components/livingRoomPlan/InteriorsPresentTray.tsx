import type { InteriorsPresentStep } from "../../domain/desktopUx";

export function InteriorsPresentTray({ step }: { step: InteriorsPresentStep }) {
  return (
    <div className="lr-draw-tray lr-present-tray" data-testid="interiors-present-tray">
      <span>
        {step === "freeze" ? "Markup, tax, discount, and validity stay on this revision until you freeze." : null}
        {step === "capture" ? "Capture a client view of this 3D scene, then create the proposal." : null}
        {step === "proposal" ? "Create the proposal against the frozen revision." : null}
        {step === "approve" ? "Record client approval before engineering receives the cabinet IDs." : null}
        {step === "send" ? "Engineering opens the same room, cabinets, run, fillers, and countertop." : null}
        {step === "done" ? "This revision is frozen, approved, and sent." : null}
      </span>
    </div>
  );
}
