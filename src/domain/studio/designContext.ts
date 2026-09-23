export type DesignWorkspaceView = "plan" | "model" | "render";

/** Fields that must survive a 2D/3D switch. View is the only field that changes. */
export type DesignWorkspaceContext = {
  view: DesignWorkspaceView;
  roomId: string;
  selectedIds: readonly string[];
  revision: string;
};

export function switchDesignView(
  context: DesignWorkspaceContext,
  view: DesignWorkspaceView,
): DesignWorkspaceContext {
  return {
    view,
    roomId: context.roomId,
    selectedIds: context.selectedIds,
    revision: context.revision,
  };
}

export function designViewToolIds(view: DesignWorkspaceView): string[] {
  if (view === "model") return ["fit-selection", "zoom-in", "zoom-out", "plan"];
  if (view === "render") return ["plan", "model"];
  return ["grid", "snap", "fit-plan", "zoom-in", "zoom-out", "model"];
}
