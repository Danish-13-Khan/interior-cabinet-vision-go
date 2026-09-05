import {
  INTERIORS_DRAW_ROOM_ARCHITECTURE_TOOLS,
  INTERIORS_DRAW_ROOM_NAV_TOOLS,
  interiorsDrawRoomShowArchitecture,
  interiorsDrawRoomShowUnderlay,
} from "../../domain/desktopUx";
import { BuildRoomManager } from "./BuildRoomManager";
import { PlanUnderlayControls } from "./PlanUnderlayControls";
import type { InteriorsDrawRoomManageProps } from "./interiorsDrawRoomCommands";

export function InteriorsDrawRoomManage({
  project,
  tool,
  activeBuildTool,
  commands,
}: InteriorsDrawRoomManageProps) {
  const showArch = interiorsDrawRoomShowArchitecture(tool, activeBuildTool);
  const showUnderlay = interiorsDrawRoomShowUnderlay(tool);
  return (
    <div className="lr-draw-tray lr-draw-manage" data-testid="interiors-draw-manage">
      {commands.onActiveRoom && commands.onRenameRoom ? (
        <BuildRoomManager
          project={project}
          onActiveRoom={commands.onActiveRoom}
          onRenameRoom={commands.onRenameRoom}
          onDeleteRoom={commands.onDeleteRoom}
          onMergeRooms={commands.onMergeRooms}
        />
      ) : null}
      <div className="lr-draw-nav-tools" aria-label="Plan tools">
        {INTERIORS_DRAW_ROOM_NAV_TOOLS.map((item) => (
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
      {showUnderlay ? (
        <>
          <PlanUnderlayControls
            underlay={commands.underlay}
            onChange={commands.onSetPlanUnderlay}
            onReplace={commands.onReplaceUnderlay}
          />
          {commands.importError ? <p className="lr-import-error">{commands.importError}</p> : null}
        </>
      ) : null}
    </div>
  );
}
