import type { InteriorProject } from "../../domain/interiorProject";
import "./RoomLightFixturesPanel.css";
import { resolveLightAttachment } from "../../domain/livingRoom/lightAttachments";
import {
  LIGHT_FIXTURE_CATEGORY_LABELS,
  type LightFixtureCategory,
} from "../../domain/livingRoom/lightFixtureTypes";
import {
  addRoomLightFixture,
  isRoomLightFixture,
  ROOM_LIGHT_FIXTURES,
} from "../../domain/livingRoom/roomLightFixtures";
import { LightFixtureInspector } from "../livingRoomPlan/LightFixtureInspector";
import type { LightDocumentPatch } from "../livingRoomPlan/lightFixtureEdits";

const CATEGORIES: readonly LightFixtureCategory[] = ["wall", "ceiling", "cabinet"];

export type RoomLightFixturesPanelProps = {
  project: InteriorProject;
  onPatchDocument: LightDocumentPatch;
  onSelectLight?: (id: string) => void;
};

export function RoomLightFixturesPanel({ project, onPatchDocument, onSelectLight }: RoomLightFixturesPanelProps) {
  const lights = project.lights
    .filter((light) => light.roomId === project.activeRoomId && isRoomLightFixture(light))
    .map((light) => resolveLightAttachment(project, light));
  return (
    <section className="lr-room-light-fixtures" aria-label="Room light fixtures">
      <h3>Room lights</h3>
      <p>Add a fixture, then position it in this room. Place LED strips beneath cabinets or along a ceiling recess.</p>
      {CATEGORIES.map((category) => (
        <div key={category}>
          <h4>{LIGHT_FIXTURE_CATEGORY_LABELS[category]}</h4>
          <div className="lr-render-quality-grid">
            {ROOM_LIGHT_FIXTURES.filter((preset) => preset.category === category).map((preset) => (
              <button type="button" key={preset.id}
                onClick={() => onPatchDocument((current) => addRoomLightFixture(current, preset.id), `Added ${preset.name.toLowerCase()}.`)}>
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      ))}
      {lights.map((light) => (
        <details key={light.id} open>
          <summary>{light.name}</summary>
          <LightFixtureInspector
            project={project}
            light={light}
            onPatchDocument={onPatchDocument}
            onSelect={onSelectLight ? () => onSelectLight(light.id) : undefined}
          />
        </details>
      ))}
    </section>
  );
}
