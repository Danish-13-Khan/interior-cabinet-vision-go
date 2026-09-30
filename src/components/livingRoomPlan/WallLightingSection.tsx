import type { LightFixtureActions } from "../../hooks/livingRoomPlanEditor/lightCommands";

/** Wall inspector. Cove fits the wall at the top; rope uses its registry centre height. */
export function WallLightingSection(props: {
  wallId: string;
  actions: LightFixtureActions;
  onSelectLight: (id: string) => void;
}) {
  const add = (kind: "cove" | "rope" | "profile", orientation?: "horizontal" | "vertical") => {
    const id = props.actions.addLight(kind, { kind: "wall", wallId: props.wallId }, orientation ? { orientation } : undefined);
    if (id) props.onSelectLight(id);
  };
  return (
    <div className="lr-wall-panel-actions" data-testid="wall-lighting">
      <h4>Lighting on this wall</h4>
      <button type="button" onClick={() => add("cove")}>Cove</button>
      <button type="button" onClick={() => add("rope")}>Rope</button>
      <button type="button" onClick={() => add("profile", "horizontal")}>Profile horizontal</button>
      <button type="button" onClick={() => add("profile", "vertical")}>Profile vertical</button>
    </div>
  );
}
