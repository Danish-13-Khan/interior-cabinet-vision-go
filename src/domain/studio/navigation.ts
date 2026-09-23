export const STUDIO_SECTIONS = [
  { id: "projects", label: "Projects" },
  { id: "price-book", label: "Price book" },
  { id: "clients", label: "Clients" },
  { id: "documents", label: "Documents" },
  { id: "settings", label: "Settings" },
] as const;

export const PROJECT_WORKFLOWS = [
  { id: "design", label: "Design 2D/3D" },
  { id: "quote", label: "Quote & proposal" },
  { id: "approval", label: "Approval" },
  { id: "engineering", label: "Engineering & cut list" },
  { id: "payments", label: "Payments & history" },
] as const;

export type StudioSection = (typeof STUDIO_SECTIONS)[number]["id"];
export type ProjectWorkflow = (typeof PROJECT_WORKFLOWS)[number]["id"];
export type StudioSurface = "studio" | "project";

export function studioSidebarCollapsed(surface: StudioSurface, workflow: ProjectWorkflow) {
  return surface === "project" && workflow === "design";
}

export function studioBreadcrumb(projectName: string | null, roomName: string, revision: string) {
  if (!projectName) return "Cabinet Studio";
  return `${projectName} / ${roomName} / Rev ${revision}`;
}
