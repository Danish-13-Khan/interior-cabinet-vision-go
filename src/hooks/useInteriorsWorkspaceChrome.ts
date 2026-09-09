import { useEffect, useState } from "react";
import {
  applyInteriorsWorkflowArea,
  interiorsPresentAuthoringView,
  interiorsWorkflowAreaForChromeTool,
  interiorsWorkflowAreaFromChrome,
  isInteriorsChromeToolReady,
  mapInteriorsChromeTool,
  type InteriorsChromeTool,
  type InteriorsWorkflowArea,
} from "../domain/desktopUx";
import type { InteriorProject } from "../domain/interiorProject";
import type { BuildTool } from "../domain/livingRoom/buildToolCommands";
import type {
  LivingRoomWorkspaceView,
  PlannerMode,
  StudioPanel,
} from "../components/livingRoomPlan/workspaceProps";

type ChromeInput = {
  project: InteriorProject | null;
  projectHomeOpen: boolean;
  onOpenProjectHome: () => void;
  onCloseProjectHome: () => void;
  selectBuildTool: (tool: BuildTool) => void;
};

export function useInteriorsWorkspaceChrome(input: ChromeInput) {
  const [workspaceView, setWorkspaceView] = useState<LivingRoomWorkspaceView>("plan");
  const [plannerMode, setPlannerMode] = useState<PlannerMode>("project");
  const [studioPanel, setStudioPanel] = useState<StudioPanel>("build");
  const [chromeTool, setChromeTool] = useState<InteriorsChromeTool>("select");
  const [workflowArea, setWorkflowAreaState] = useState<InteriorsWorkflowArea>("room");

  useEffect(() => {
    if (!input.project || input.projectHomeOpen || plannerMode !== "project") return;
    setPlannerMode("build");
    setWorkspaceView("plan");
    setStudioPanel("build");
    setChromeTool(input.project.rooms.length ? "select" : "room");
    setWorkflowAreaState("room");
  }, [plannerMode, input.project, input.projectHomeOpen]);

  useEffect(() => {
    if (plannerMode !== "build" || !input.project || input.project.rooms.length > 0) return;
    input.selectBuildTool("draw-room");
    setChromeTool("room");
  }, [plannerMode, input.project]);

  function syncAreaFromChrome(mode: PlannerMode, panel: StudioPanel, area?: InteriorsWorkflowArea) {
    setWorkflowAreaState(
      interiorsWorkflowAreaFromChrome({
        plannerMode: mode,
        studioPanel: panel,
        workflowArea: area,
      }),
    );
  }

  function setWorkflowArea(area: InteriorsWorkflowArea) {
    const target = applyInteriorsWorkflowArea(area);
    setWorkflowAreaState(area);
    setPlannerMode(target.plannerMode);
    input.onCloseProjectHome();
    setStudioPanel(target.studioPanel);
    setChromeTool(target.chromeTool);
    if (target.workspaceView === "plan") setWorkspaceView("plan");
    else if (target.workspaceView === "model") setWorkspaceView("model");
    if (target.plannerMode === "render") return;
    input.selectBuildTool("select");
  }

  function changePlannerMode(mode: PlannerMode) {
    setPlannerMode(mode);
    if (mode === "project") {
      input.onOpenProjectHome();
      return;
    }
    input.onCloseProjectHome();
    if (mode === "render") {
      setWorkspaceView("model");
      setWorkflowAreaState("present");
      return;
    }
    setWorkspaceView("plan");
    const panel = mode === "build" ? "build" : "cabinets";
    setStudioPanel(panel);
    setChromeTool(mode === "build" ? "select" : "cabinet");
    input.selectBuildTool("select");
    syncAreaFromChrome(mode, panel);
  }

  function changeWorkspaceView(view: LivingRoomWorkspaceView) {
    if (plannerMode === "render" && view === "plan") {
      setPlannerMode("design");
      input.onCloseProjectHome();
      const panel = studioPanel === "build" ? "cabinets" : studioPanel;
      setStudioPanel(panel);
      syncAreaFromChrome("design", panel, workflowArea === "review" ? "review" : undefined);
    }
    setWorkspaceView(view);
  }

  function applyChromeTool(tool: InteriorsChromeTool) {
    if (!isInteriorsChromeToolReady(tool)) return;
    const target = mapInteriorsChromeTool(tool);
    setChromeTool(tool);
    const nextMode = target.plannerMode
      ?? (plannerMode === "project" ? "build" : plannerMode === "render" ? "design" : plannerMode);
    setPlannerMode(nextMode);
    if (target.studioPanel) setStudioPanel(target.studioPanel);
    setWorkspaceView((current) => interiorsPresentAuthoringView(plannerMode, current));
    input.onCloseProjectHome();
    input.selectBuildTool(target.buildTool);
    setWorkflowAreaState(interiorsWorkflowAreaForChromeTool(tool));
  }

  function present() {
    setWorkflowArea("present");
  }

  function returnToReview() {
    setWorkflowArea("review");
  }

  function showRenderStudio() {
    input.onCloseProjectHome();
    setPlannerMode("design");
    setWorkspaceView("render");
    setWorkflowAreaState("cabinets");
  }

  return {
    workspaceView,
    plannerMode,
    studioPanel,
    chromeTool,
    workflowArea,
    setStudioPanel,
    setWorkflowArea,
    changePlannerMode,
    changeWorkspaceView,
    applyChromeTool,
    present,
    returnToReview,
    showRenderStudio,
  };
}
