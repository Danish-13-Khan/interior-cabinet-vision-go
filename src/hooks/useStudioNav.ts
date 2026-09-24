import { useEffect, useState } from "react";
import type { ProjectWorkflow, StudioSection, StudioSurface } from "../domain/studio/navigation";

export function useStudioNav(projectOpen: boolean) {
  const [surface, setSurface] = useState<StudioSurface>(projectOpen ? "project" : "studio");
  const [section, setSection] = useState<StudioSection>("projects");
  const [workflow, setWorkflow] = useState<ProjectWorkflow>("design");
  const [sidebarPinned, setSidebarPinned] = useState(true);

  useEffect(() => {
    if (projectOpen) {
      setSurface("project");
      setWorkflow("design");
      return;
    }
    setSurface("studio");
  }, [projectOpen]);

  function openSection(next: StudioSection) {
    setSection(next);
    setSurface("studio");
  }

  function openWorkflow(next: ProjectWorkflow) {
    setWorkflow(next);
    setSurface("project");
  }

  const collapsed = !sidebarPinned;

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
