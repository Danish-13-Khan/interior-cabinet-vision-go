import type { ComponentProps, ReactNode, RefObject } from "react";
import { AppToolRail } from "./AppToolRail";
import { AppWorkspace } from "./AppWorkspace";
import { AppInspector } from "./AppInspector";
import { PaneResizeHandle } from "./PaneResizeHandle";
import type { CabinetSceneHandle } from "./CabinetScene";
import type { WorkbenchMode } from "../domain/desktopUx";

type AppMainBodyProps = {
  workbenchMode: WorkbenchMode;
  reportWorkspace: ReactNode;
  jobWorkspace: ReactNode;
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
  const showToolRail = toolRailVisible && workbenchMode !== "drawings" && !isOutputWorkspace;

  return (
    <div className="app-body">
      {showToolRail ? (
        <>
          <AppToolRail {...toolRailProps} style={{ width: toolRailWidthPx }} />
          <PaneResizeHandle
            axis="x"
            value={toolRailWidthPx}
            min={160}
            ariaLabel="Resize tool rail"
            onChange={onToolRailWidthChange}
          />
        </>
      ) : null}

      {isOutputWorkspace
        ? reportWorkspace
        : workbenchMode === "job"
          ? jobWorkspace
          : <AppWorkspace ref={sceneRef} {...workspaceProps} />}

      {!isOutputWorkspace && inspectorVisible ? (
        <>
          <PaneResizeHandle
            axis="x"
            value={inspectorWidthPx}
            min={160}
            invert
            ariaLabel="Resize inspector"
            onChange={onInspectorWidthChange}
          />
          <AppInspector {...inspectorProps} style={{ width: inspectorWidthPx }} />
        </>
      ) : null}
    </div>
  );
}
