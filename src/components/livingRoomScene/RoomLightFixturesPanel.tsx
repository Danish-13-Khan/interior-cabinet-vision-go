import type { InteriorProject } from "../../domain/interiorProject";
import "./RoomLightFixturesPanel.css";
import { resolveLightAttachment } from "../../domain/livingRoom/lightAttachments";
import {
  LIGHT_FIXTURE_CATEGORY_LABELS,
  type LightFixtureCategory,
} from "../../domain/livingRoom/lightFixtureTypes";
import { isRoomLightFixture, ROOM_LIGHT_FIXTURES } from "../../domain/livingRoom/roomLightFixtures";
import {
  lightFixtureActions,
  type LightFixtureActions,
} from "../../hooks/livingRoomPlanEditor/lightCommands";
import { LightFixtureInspector } from "../livingRoomPlan/LightFixtureInspector";
import type { LightDocumentPatch } from "../livingRoomPlan/lightFixtureEdits";

const CATEGORIES: readonly LightFixtureCategory[] = ["wall", "ceiling", "cabinet"];

export type RoomLightFixturesPanelProps = {
  project: InteriorProject;
  /** Render Studio still patches. The model popover passes lightActions instead. */
  onPatchDocument?: LightDocumentPatch;
  lightActions?: LightFixtureActions;
  onSelectLight?: (id: string) => void;
};

export function RoomLightFixturesPanel({ project, onPatchDocument, lightActions, onSelectLight }: RoomLightFixturesPanelProps) {
  const actions = lightActions ?? (onPatchDocument ? lightFixtureActions(onPatchDocument, project) : null);
  if (!actions) return null;
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
                onClick={() => actions.addLight(preset.id)}>
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
            actions={actions}
            onSelect={onSelectLight ? () => onSelectLight(light.id) : undefined}
          />
        </details>
      ))}
    </section>
  );
}
