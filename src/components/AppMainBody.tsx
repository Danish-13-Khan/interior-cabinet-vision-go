import { useRef, type ComponentProps, type ReactNode, type RefObject } from "react";
import { AppToolRail } from "./AppToolRail";
import { AppWorkspace } from "./lazyWorkspaces";
import { AppInspector } from "./AppInspector";
import { PaneResizeHandle } from "./PaneResizeHandle";
import type { CabinetSceneHandle } from "./CabinetScene";
import type { WorkbenchMode } from "../domain/desktopUx";
import { fitStudioPanes, STUDIO_PANE_MIN } from "../domain/desktopUx/studioPaneFit";
import { useElementWidth } from "../hooks/useElementWidth";

type AppMainBodyProps = {
  workbenchMode: WorkbenchMode;
  reportWorkspace: ReactNode;
  jobWorkspace: ReactNode;
  interiorWorkspace: ReactNode;
  engineeringWorkspace: ReactNode;
  toolRailVisible: boolean;
  inspectorVisible: boolean;
  toolRailWidthPx: number;
  inspectorWidthPx: number;
  onToolRailWidthChange: (widthPx: number) => void;
  onInspectorWidthChange: (widthPx: number) => void;
  sceneRef: RefObject<CabinetSceneHandle | null>;
  toolRailProps: Omit<ComponentProps<typeof AppToolRail>, "style">;
  workspaceProps: Omit<ComponentProps<typeof AppWorkspace>, "ref">;
  inspectorProps: Omit<ComponentProps<typeof AppInspector>, "style">;
};

export function AppMainBody({
  workbenchMode,
  reportWorkspace,
  jobWorkspace,
  interiorWorkspace,
  engineeringWorkspace,
  toolRailVisible,
  inspectorVisible,
  toolRailWidthPx,
  inspectorWidthPx,
  onToolRailWidthChange,
  onInspectorWidthChange,
  sceneRef,
  toolRailProps,
  workspaceProps,
  inspectorProps,
}: AppMainBodyProps) {
  const isOutputWorkspace = workbenchMode === "production" || workbenchMode === "reports";
  const showToolRail =
    toolRailVisible &&
    workbenchMode !== "drawings" &&
    workbenchMode !== "interiors" &&
    workbenchMode !== "engineering" &&
    !isOutputWorkspace;
  const showInspector =
    !isOutputWorkspace && workbenchMode !== "interiors" && workbenchMode !== "engineering" && inspectorVisible;
  const bodyRef = useRef<HTMLDivElement>(null);
  const hostWidth = useElementWidth(bodyRef, 1280);
  const panes = fitStudioPanes({
    hostWidth,
    chromeWidth: 0,
    catalog: toolRailWidthPx,
    inspector: inspectorWidthPx,
    catalogShown: showToolRail,
    inspectorShown: showInspector,
    inspectorMin: STUDIO_PANE_MIN,
  });

  return (
    <div className="app-body" ref={bodyRef}>
      {showToolRail ? (
        <>
          <AppToolRail {...toolRailProps} style={{ width: panes.catalogWidth }} />
          <PaneResizeHandle
            axis="x"
            value={panes.catalogWidth}
            min={STUDIO_PANE_MIN}
            max={panes.catalogMax}
            ariaLabel="Resize tool rail"
            onChange={onToolRailWidthChange}
          />
        </>
      ) : null}

      {isOutputWorkspace
        ? reportWorkspace
        : workbenchMode === "job"
          ? jobWorkspace
          : workbenchMode === "interiors"
            ? interiorWorkspace
          : workbenchMode === "engineering"
            ? engineeringWorkspace
          : <AppWorkspace ref={sceneRef} {...workspaceProps} />}

      {showInspector ? (
        <>
          <PaneResizeHandle
            axis="x"
            value={panes.inspectorWidth}
            min={STUDIO_PANE_MIN}
            max={panes.inspectorMax}
            invert
            ariaLabel="Resize inspector"
            onChange={onInspectorWidthChange}
          />
          <AppInspector {...inspectorProps} style={{ width: panes.inspectorWidth }} />
        </>
      ) : null}
    </div>
  );
}
