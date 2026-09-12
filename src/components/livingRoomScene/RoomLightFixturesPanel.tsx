import type { InteriorProject } from "../../domain/interiorProject";
import "./RoomLightFixturesPanel.css";
import { addRoomLightFixture, isRoomLightFixture, removeRoomLightFixture, ROOM_LIGHT_FIXTURES, updateRoomLightFixture, type RoomLightPatch } from "../../domain/livingRoom/roomLightFixtures";

export type RoomLightFixturesPanelProps = {
  project: InteriorProject;
  onPatchDocument: (update: (current: InteriorProject) => InteriorProject, status: string) => void;
};

export function RoomLightFixturesPanel({ project, onPatchDocument }: RoomLightFixturesPanelProps) {
  const lights = project.lights.filter((light) => light.roomId === project.activeRoomId && isRoomLightFixture(light));
  const update = (id: string, patch: RoomLightPatch) => onPatchDocument((current) => updateRoomLightFixture(current, id, patch), "Updated room light.");
  return <section className="lr-room-light-fixtures" aria-label="Room light fixtures">
    <h3>Room lights</h3>
    <p>Add a fixture, then position it in this room. Place LED strips beneath cabinets or along a ceiling recess.</p>
    <div className="lr-render-quality-grid">
      {ROOM_LIGHT_FIXTURES.map((preset) => <button type="button" key={preset.id}
        onClick={() => onPatchDocument((current) => addRoomLightFixture(current, preset.id), `Added ${preset.name.toLowerCase()}.`)}>{preset.name}</button>)}
    </div>
    {lights.map((light) => <details key={light.id} open>
      <summary>{light.name}</summary>
      <label className="lr-render-field"><span>Name</span><input value={light.name} maxLength={100} onChange={(e) => update(light.id, { name: e.target.value })} /></label>
      <label className="lr-render-check"><input type="checkbox" checked={light.enabled} onChange={(e) => update(light.id, { enabled: e.target.checked })} />Light on</label>
      <label className="lr-render-field"><span>Colour</span><input type="color" value={light.color} onChange={(e) => update(light.id, { color: e.target.value })} /></label>
      <label className="lr-render-field"><span>Brightness</span><input type="number" min={0} max={100} step={0.5} value={light.intensity} onChange={(e) => update(light.id, { intensity: e.target.valueAsNumber })} /></label>
      {(["x", "y", "z"] as const).map((axis) => <label className="lr-render-field" key={axis}>
        <span>{axis === "y" ? "Height" : axis.toUpperCase()} (mm)</span><input type="number" step={10} value={light.position[axis]} onChange={(e) => update(light.id, { position: { ...light.position, [axis]: e.target.valueAsNumber } })} />
      </label>)}
      {(["x", "y", "z"] as const).map((axis) => <label className="lr-render-field" key={`rotation-${axis}`}>
        <span>Rotate {axis.toUpperCase()} (°)</span><input type="number" step={5} value={light.rotation[axis]} onChange={(e) => update(light.id, { rotation: { ...light.rotation, [axis]: e.target.valueAsNumber } })} />
      </label>)}
      {light.kind === "area" && <label className="lr-render-field"><span>Strip length (mm)</span><input type="number" min={1} max={100000} step={50} value={Number(light.parameters.widthMm)} onChange={(e) => update(light.id, { parameters: { widthMm: e.target.valueAsNumber } })} /></label>}
      <button type="button" onClick={() => onPatchDocument((current) => removeRoomLightFixture(current, light.id), "Removed room light.")}>Remove {light.name}</button>
    </details>)}
  </section>;
}
