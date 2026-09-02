import type { InteriorsChromeTool } from "../../domain/desktopUx";
import type { BuildTool } from "../../domain/livingRoom";
import { OpeningCatalogPanel } from "./OpeningCatalogPanel";
import { RoomDrawingPanel } from "./RoomDrawingPanel";

export function InteriorsDrawRoomTray({
  tool,
  activeBuildTool,
  wallId,
  openingCatalogItemId,
  roomPolygonPointCount,
  onOpeningCatalogItem,
  onCloseRoomPolygon,
  onCommitOpening,
}: {
  tool: InteriorsChromeTool;
  activeBuildTool?: BuildTool;
  wallId: string | null;
  openingCatalogItemId?: string;
  roomPolygonPointCount: number;
  onOpeningCatalogItem?: (catalogItemId: string) => void;
  onCloseRoomPolygon?: () => void;
  onCommitOpening?: (wallId: string, kind: "door" | "window") => void;
}) {
  if (activeBuildTool === "draw-surface") {
    return (
      <div className="lr-draw-tray" data-testid="interiors-draw-tray">
        <button type="button" disabled={roomPolygonPointCount < 3} onClick={onCloseRoomPolygon}>
          Close surface polygon ({roomPolygonPointCount})
        </button>
      </div>
    );
  }
  if (tool === "room") {
    return (
      <div className="lr-draw-tray" data-testid="interiors-draw-tray">
        <RoomDrawingPanel pointCount={roomPolygonPointCount} onClosePolygon={onCloseRoomPolygon} />
      </div>
    );
  }
  if ((tool === "door" || tool === "window") && openingCatalogItemId && onOpeningCatalogItem) {
    const kind = tool === "door" ? "door" : "window";
    return (
      <div className="lr-draw-tray" data-testid="interiors-draw-tray">
        <OpeningCatalogPanel kind={kind} selectedId={openingCatalogItemId} onSelect={onOpeningCatalogItem} />
        <button type="button" disabled={!wallId} onClick={() => wallId && onCommitOpening?.(wallId, kind)}>
          {kind === "door" ? "+ Place door on selected wall" : "+ Place window on selected wall"}
        </button>
      </div>
    );
  }
  return null;
}
