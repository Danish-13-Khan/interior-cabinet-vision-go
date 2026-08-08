import type { ComponentProps, RefObject } from "react";
import { AppToolRail } from "./AppToolRail";
import { AppWorkspace } from "./AppWorkspace";
import { AppInspector } from "./AppInspector";
import { PaneResizeHandle } from "./PaneResizeHandle";
import type { CabinetSceneHandle } from "./CabinetScene";

type AppMainBodyProps = {
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
  return (
    <div className="app-body">
      {toolRailVisible ? (
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

      <AppWorkspace ref={sceneRef} {...workspaceProps} />

      {inspectorVisible ? (
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
