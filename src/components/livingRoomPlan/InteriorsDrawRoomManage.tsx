import {
  INTERIORS_DRAW_ROOM_ARCHITECTURE_TOOLS,
  interiorsDrawRoomShowArchitecture,
  interiorsDrawRoomShowUnderlay,
} from "../../domain/desktopUx";
import { createPortal } from "react-dom";
import { BuildRoomManager } from "./BuildRoomManager";
import { useCatalogPlanSettingsSlot } from "./InspectorPlanSettingsSlot";
import { PlanGuidesPanel } from "./PlanGuidesPanel";
import { PlanUnderlayControls } from "./PlanUnderlayControls";
import { SiteMeasureChecklist } from "./SiteMeasureChecklist";
import type { InteriorsDrawRoomManageProps } from "./interiorsDrawRoomCommands";

export function InteriorsDrawRoomManage({
  project,
  tool,
  activeBuildTool,
  commands,
  onPatchDocument,
}: InteriorsDrawRoomManageProps) {
  const showArch = interiorsDrawRoomShowArchitecture(tool, activeBuildTool);
  const showUnderlay = interiorsDrawRoomShowUnderlay(tool);
  const catalogSlot = useCatalogPlanSettingsSlot();
  const settings = (
    <details
      className={`lr-plan-secondary-settings ${catalogSlot ? "is-docked-left" : "is-floating"}`}
      data-testid="interiors-draw-manage"
      open={Boolean(catalogSlot) || showArch || showUnderlay}
    >
      <summary>Room &amp; plan settings</summary>
      <div className="lr-draw-tray lr-draw-manage">
        {commands.onActiveRoom && commands.onRenameRoom ? (
          <BuildRoomManager
            project={project}
            onActiveRoom={commands.onActiveRoom}
            onRenameRoom={commands.onRenameRoom}
            onDeleteRoom={commands.onDeleteRoom}
            onMergeRooms={commands.onMergeRooms}
            onRenderSettingsChange={commands.onRenderSettingsChange}
          />
        ) : null}
        {showArch ? (
          <div className="lr-draw-arch" aria-label="Architecture tools">
            {INTERIORS_DRAW_ROOM_ARCHITECTURE_TOOLS.map((item) => (
              <button
                key={item.id}
                type="button"
                data-build-tool={item.id}
                className={activeBuildTool === item.id ? "is-active" : ""}
                onClick={() => commands.onBuildTool(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
        {onPatchDocument ? <PlanGuidesPanel project={project} onPatchDocument={onPatchDocument} /> : null}
        {showUnderlay ? (
          <>
            <PlanUnderlayControls
              underlay={commands.underlay}
              onChange={commands.onSetPlanUnderlay}
              onReplace={commands.onReplaceUnderlay}
              onCalibrate={() => commands.onBuildTool("calibrate-underlay")}
              moveActive={activeBuildTool === "move-underlay"}
              onToggleMove={() => commands.onBuildTool(activeBuildTool === "move-underlay" ? "select" : "move-underlay")}
              onSuggestDwgWalls={commands.onSuggestDwgWalls}
              onPlaceDwgCabinets={commands.onPlaceDwgCabinets}
            />
            {commands.onToggleSiteMeasure ? (
              <SiteMeasureChecklist project={project} onToggle={commands.onToggleSiteMeasure} />
            ) : null}
            {commands.importError ? <p className="lr-import-error">{commands.importError}</p> : null}
          </>
        ) : null}
      </div>
    </details>
  );
  return catalogSlot ? createPortal(settings, catalogSlot) : settings;
}
