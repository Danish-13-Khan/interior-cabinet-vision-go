import { useCallback, useEffect, useState } from "react";
import {
  clampDesktopLayout,
  persistDesktopLayout,
  readDesktopLayout,
  type DesktopLayoutPrefs,
  type WorkspaceTabId,
} from "../domain/desktopUx";

export function useDesktopLayout() {
  const [layout, setLayoutState] = useState<DesktopLayoutPrefs>(() =>
    readDesktopLayout(),
  );

  useEffect(() => {
    persistDesktopLayout(layout);
  }, [layout]);

  const setLayout = useCallback(
    (patch: Partial<DesktopLayoutPrefs>) => {
      setLayoutState((current) => clampDesktopLayout({ ...current, ...patch }));
    },
    [],
  );

  const setWorkspaceTab = useCallback((workspaceTab: WorkspaceTabId) => {
    setLayout({ workspaceTab });
  }, [setLayout]);

  const toggleToolRail = useCallback(() => {
    setLayoutState((current) =>
      clampDesktopLayout({
        ...current,
        toolRailVisible: !current.toolRailVisible,
      }),
    );
  }, []);

  const toggleInspector = useCallback(() => {
    setLayoutState((current) =>
      clampDesktopLayout({
        ...current,
        inspectorVisible: !current.inspectorVisible,
      }),
    );
  }, []);

  const cycleWorkspaceTab = useCallback(() => {
    const order: WorkspaceTabId[] = ["plan", "front", "side", "3d"];
    setLayoutState((current) => {
      const index = order.indexOf(current.workspaceTab);
      const next = order[(index + 1) % order.length] ?? "plan";
      return clampDesktopLayout({ ...current, workspaceTab: next });
    });
  }, []);

  return {
    layout,
    setLayout,
    setWorkspaceTab,
    toggleToolRail,
    toggleInspector,
    cycleWorkspaceTab,
  };
}
