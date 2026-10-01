import type { InteriorProject, WallEntity } from "../../domain/interiorProject";
import { wallLengthMm } from "../../domain/livingRoom";
import { cutOpeningOffsetMm } from "../../domain/livingRoom/cutOpening";
import {
  WALL_DECORATION_PRESETS,
  type WallDecorationGroup,
} from "../../domain/livingRoom/wallDecorations";
import type { LightFixtureActions } from "../../hooks/livingRoomPlanEditor/lightCommands";
import { MaterialSwatchGrid } from "./MaterialSwatchGrid";
import { wallDeleteActionLabel } from "./wallDeleteLabel";
import { WallLightingSection } from "./WallLightingSection";

type ImportApply = { wallId?: string };

export type WallEditingActions = {
  onAddOpening: (wallId: string, kind: "opening", offset: number) => void;
  onAddDecoration: (wallId: string, presetId: string) => void;
};

type Props = {
  project: InteriorProject;
  wall: WallEntity;
  editing?: WallEditingActions;
  onSplitWall?: (wallId: string) => void;
  onDeleteWall?: (wallId: string) => void;
  onSetWallMaterial: (wallId: string, materialId: string | null) => void;
  onImportFinish: (file: File, apply?: ImportApply) => void;
  lightActions?: LightFixtureActions;
  onSelectLight?: (id: string) => void;
};

const SECTIONS: readonly { title: string; group: WallDecorationGroup }[] = [
  { title: "Mirror", group: "mirror" },
  { title: "Wall panels", group: "panels" },
  { title: "Moulding", group: "moulding" },
  { title: "Decorative", group: "decorative" },
];

function editingHeader(wall: WallEntity) {
  const side = wall.extensions?.wallSide;
  return typeof side === "string" && side.trim() ? `Editing ${side} wall` : "Editing wall";
}

function presetLabel(id: string, label: string) {
  return id === "mirror" ? "Add mirror" : label;
}

export function WallEditingPanel(props: Props) {
  const { wall } = props;
  const presets = (group: WallDecorationGroup) =>
    WALL_DECORATION_PRESETS.filter((preset) => preset.group === group);
  return (
    <div className="lr-wall-editing" data-testid="wall-editing-panel">
      <h3>{editingHeader(wall)}</h3>
      <div className="lr-wall-panel-actions" data-testid="wall-edit-cut">
        <h4>Cut / opening</h4>
        {props.editing ? (
          <button type="button" data-testid="wall-edit-cut-opening" onClick={() => props.editing?.onAddOpening(
            wall.id, "opening", cutOpeningOffsetMm(wallLengthMm(wall)),
          )}>Cut opening</button>
        ) : null}
        {props.onSplitWall ? (
          <button type="button" onClick={() => props.onSplitWall?.(wall.id)}>Split wall</button>
        ) : null}
        {props.onDeleteWall ? (
          <button type="button" onClick={() => props.onDeleteWall?.(wall.id)}>{wallDeleteActionLabel(wall)}</button>
        ) : null}
      </div>
      {SECTIONS.map((section) => (
        <div key={section.group} className="lr-wall-panel-actions" data-testid={`wall-edit-${section.group}`}>
          <h4>{section.title}</h4>
          {presets(section.group).map((preset) => (
            <button
              key={preset.id}
              type="button"
              data-testid={`wall-decor-${preset.id}`}
              disabled={!props.editing}
              onClick={() => props.editing?.onAddDecoration(wall.id, preset.id)}
            >{presetLabel(preset.id, preset.label)}</button>
          ))}
          {section.group === "decorative" ? (
            <p className="lr-authoring-hint">Lit niche is surface-mounted. A true recess is not supported.</p>
          ) : null}
        </div>
      ))}
      {props.lightActions && props.onSelectLight ? (
        <WallLightingSection wallId={wall.id} actions={props.lightActions} onSelectLight={props.onSelectLight} />
      ) : null}
      <div data-testid="wall-edit-material">
        <h4>Material</h4>
        <p className="lr-authoring-hint">A split wall section keeps its own material.</p>
        <MaterialSwatchGrid materials={props.project.materials} activeMaterialId={wall.materialId ?? null} compact
          onPick={(materialId) => props.onSetWallMaterial(wall.id, materialId)}
          onImport={(file) => props.onImportFinish(file, { wallId: wall.id })} />
        <button type="button" className="lr-clear-material" onClick={() => props.onSetWallMaterial(wall.id, null)}>Clear wall material</button>
      </div>
    </div>
  );
}
