import { useEffect, useState } from "react";
import {
  interiorsPresentAuthoringView,
  isInteriorsChromeToolReady,
  mapInteriorsChromeTool,
  type InteriorsChromeTool,
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

  useEffect(() => {
    if (!input.project || input.projectHomeOpen || plannerMode !== "project") return;
    setPlannerMode("build");
    setWorkspaceView("plan");
    setStudioPanel("build");
    setChromeTool(input.project.rooms.length ? "select" : "room");
  }, [plannerMode, input.project, input.projectHomeOpen]);

  useEffect(() => {
    if (plannerMode !== "build" || !input.project || input.project.rooms.length > 0) return;
    input.selectBuildTool("draw-room");
    setChromeTool("room");
  }, [plannerMode, input.project]);

  function changePlannerMode(mode: PlannerMode) {
    setPlannerMode(mode);
    if (mode === "project") {
      input.onOpenProjectHome();
      return;
    }
    input.onCloseProjectHome();
    if (mode === "render") {
      setWorkspaceView("model");
      return;
    }
    setWorkspaceView("plan");
    setStudioPanel(mode === "build" ? "build" : "cabinets");
    setChromeTool(mode === "build" ? "select" : "cabinet");
    input.selectBuildTool("select");
  }

  function changeWorkspaceView(view: LivingRoomWorkspaceView) {
    if (plannerMode === "render" && view === "plan") {
      setPlannerMode("design");
      input.onCloseProjectHome();
      setStudioPanel(studioPanel === "build" ? "cabinets" : studioPanel);
    }
    setWorkspaceView(view);
  }

  function applyChromeTool(tool: InteriorsChromeTool) {
    if (!isInteriorsChromeToolReady(tool)) return;
    const target = mapInteriorsChromeTool(tool);
    setChromeTool(tool);
    if (target.plannerMode) setPlannerMode(target.plannerMode);
    else setPlannerMode((mode) => (mode === "project" ? "build" : mode === "render" ? "design" : mode));
    if (target.studioPanel) setStudioPanel(target.studioPanel);
    setWorkspaceView((current) => interiorsPresentAuthoringView(plannerMode, current));
    input.onCloseProjectHome();
    input.selectBuildTool(target.buildTool);
  }

  function present() {
    changePlannerMode("render");
  }

  function showRenderStudio() {
    input.onCloseProjectHome();
    setPlannerMode("design");
    setWorkspaceView("render");
  }

  return {
    workspaceView,
    plannerMode,
    studioPanel,
    chromeTool,
    setStudioPanel,
    changePlannerMode,
    changeWorkspaceView,
    applyChromeTool,
    present,
    showRenderStudio,
  };
}
