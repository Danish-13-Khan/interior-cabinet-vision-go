import {
  MODEL_VIEW_PRESETS,
  type ModelViewPresetId,
} from "../../domain/livingRoom";

type ClientModePreset = Extract<
  (typeof MODEL_VIEW_PRESETS)[number],
  { clientMode: true }
>;
type ClientModePresetId = ClientModePreset["id"];

const CLIENT_MODE_STEPS: Record<
  ClientModePresetId,
  { number: string; action: string }
> = {
  dollhouse: { number: "01", action: "Drag to turn · Scroll to zoom" },
  orbit: { number: "02", action: "Drag around · Right-drag to pan" },
  walkthrough: { number: "03", action: "Drag to look · WASD or arrows to move" },
};

type ModelViewOnboardingProps = {
  activePreset: ModelViewPresetId;
  onChoosePreset: (preset: ModelViewPresetId) => void;
  onDismiss: () => void;
};

export function ModelViewOnboarding({
  activePreset,
  onChoosePreset,
  onDismiss,
}: ModelViewOnboardingProps) {
  const modes = MODEL_VIEW_PRESETS.filter(
    (preset): preset is ClientModePreset => preset.clientMode,
  );

  return (
    <section className="lr-model-onboarding" aria-label="Welcome to the 3D room">
      <header>
        <div>
          <small>3D ROOM GUIDE</small>
          <h2>How would you like to explore?</h2>
          <p>Pick a view below. You can switch at any time.</p>
        </div>
        <button type="button" className="lr-onboarding-close" aria-label="Close 3D guide" onClick={onDismiss}>×</button>
      </header>

      <div className="lr-onboarding-modes">
        {modes.map((mode) => {
          const step = CLIENT_MODE_STEPS[mode.id];
          const active = mode.id === activePreset;
          return (
            <button
              type="button"
              key={mode.id}
              className={active ? "is-active" : ""}
              aria-label={`Try ${mode.label} — ${mode.purpose}`}
              aria-pressed={active}
              onClick={() => onChoosePreset(mode.id)}
            >
              <span className="lr-onboarding-mode-number">{step.number}</span>
              <span className="lr-onboarding-mode-symbol" aria-hidden="true">{mode.symbol}</span>
              <strong>{mode.label}</strong>
              <span>{mode.purpose}</span>
              <small>{step.action}</small>
            </button>
          );
        })}
      </div>

      <footer>
        <span><kbd>Esc</kbd> returns to Dollhouse</span>
        <button type="button" className="lr-onboarding-start" onClick={onDismiss}>Start exploring</button>
      </footer>
    </section>
  );
}
