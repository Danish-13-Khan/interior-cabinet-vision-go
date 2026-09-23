import { useEffect, useState } from "react";
import {
  studioSidebarCollapsed,
  type ProjectWorkflow,
  type StudioSection,
  type StudioSurface,
} from "../domain/studio/navigation";

export function useStudioNav(projectOpen: boolean) {
  const [surface, setSurface] = useState<StudioSurface>(projectOpen ? "project" : "studio");
  const [section, setSection] = useState<StudioSection>("projects");
  const [workflow, setWorkflow] = useState<ProjectWorkflow>("design");
  const [sidebarPinned, setSidebarPinned] = useState(false);

  useEffect(() => {
    if (projectOpen) {
      setSurface("project");
      setWorkflow("design");
      setSidebarPinned(false);
    } else {
      setSurface("studio");
      setSection("projects");
    }
  }, [projectOpen]);

  function openSection(next: StudioSection) {
    setSection(next);
    setSurface("studio");
  }

  function openWorkflow(next: ProjectWorkflow) {
    setWorkflow(next);
    setSurface("project");
    if (next === "design") setSidebarPinned(false);
  }

  const collapsed = studioSidebarCollapsed(surface, workflow) && !sidebarPinned;

  return {
    surface,
    section,
    workflow,
    collapsed,
    sidebarPinned,
    openSection,
    openWorkflow,
    toggleSidebar: () => setSidebarPinned((current) => !current),
  };
}
