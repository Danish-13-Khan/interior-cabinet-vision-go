import type { LightFixtureKind } from "../../domain/livingRoom/lightFixtureTypes";
import type { LightFixtureActions } from "../../hooks/livingRoomPlanEditor/lightCommands";

const CEILING: readonly { kind: LightFixtureKind; label: string }[] = [
  { kind: "panel", label: "Panel light" },
  { kind: "cob", label: "COB downlight" },
  { kind: "track", label: "Track light" },
];

/** Room inspector. Each button mounts the fixture on the ceiling and selects it. */
export function CeilingLightingSection(props: {
  actions: LightFixtureActions;
  onSelectLight: (id: string) => void;
}) {
  return (
    <div className="lr-wall-panel-actions" data-testid="ceiling-lighting">
      <h4>Ceiling lighting</h4>
      {CEILING.map((item) => (
        <button type="button" key={item.kind} onClick={() => {
          const id = props.actions.addLight(item.kind, { kind: "ceiling" });
          if (id) props.onSelectLight(id);
        }}>{item.label}</button>
      ))}
    </div>
  );
}
