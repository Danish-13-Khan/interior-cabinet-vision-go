import {
  interiorsDrawRoomPlacementWallId,
  interiorsDrawRoomRoomWallIds,
  type InteriorsChromeTool,
} from "../../domain/desktopUx";
import type { InteriorProject } from "../../domain/interiorProject";
import type { BuildTool, PlanReadabilitySettings } from "../../domain/livingRoom";
import { InteriorsDrawRoomManage } from "./InteriorsDrawRoomManage";
import { InteriorsDrawRoomTitlebar } from "./InteriorsDrawRoomTitlebar";
import { InteriorsDrawRoomTray } from "./InteriorsDrawRoomTray";
import type { InteriorsDrawRoomCommands } from "./interiorsDrawRoomCommands";

export function InteriorsDrawRoomChrome({
  tool,
  project,
  activeBuildTool,
  activeWallId,
  openingCatalogItemId,
  roomPolygonPointCount,
  showGrid,
  snapSizeMm,
  readability,
  commands,
  onShowGrid,
  onSnapSize,
  onReadability,
  onOpeningCatalogItem,
  onCloseRoomPolygon,
  onCommitOpening,
}: {
  tool: InteriorsChromeTool;
  project: InteriorProject;
  activeBuildTool?: BuildTool;
  activeWallId: string | null;
  openingCatalogItemId?: string;
  roomPolygonPointCount: number;
  showGrid: boolean;
  snapSizeMm: number;
  readability: PlanReadabilitySettings;
  commands: InteriorsDrawRoomCommands;
  onShowGrid: (value: boolean) => void;
  onSnapSize: (value: number) => void;
  onReadability: (patch: Partial<PlanReadabilitySettings>) => void;
  onOpeningCatalogItem?: (catalogItemId: string) => void;
  onCloseRoomPolygon?: () => void;
  onCommitOpening?: (wallId: string, kind: "door" | "window") => void;
}) {
  const wallId = interiorsDrawRoomPlacementWallId(activeWallId, interiorsDrawRoomRoomWallIds(project));
  return (
    <>
      <InteriorsDrawRoomTitlebar
        projectName={project.name} tool={tool} buildTool={activeBuildTool} showGrid={showGrid} snapSizeMm={snapSizeMm}
        readability={readability} onShowGrid={onShowGrid} onSnapSize={onSnapSize} onReadability={onReadability}
      />
      <InteriorsDrawRoomManage project={project} tool={tool} activeBuildTool={activeBuildTool} commands={commands} />
      <InteriorsDrawRoomTray
        tool={tool} activeBuildTool={activeBuildTool} wallId={wallId}
        openingCatalogItemId={openingCatalogItemId} roomPolygonPointCount={roomPolygonPointCount}
        onOpeningCatalogItem={onOpeningCatalogItem} onCloseRoomPolygon={onCloseRoomPolygon}
        onCommitOpening={onCommitOpening}
      />
    </>
  );
}
