import { describe, expect, it } from "vitest";
import {
  PROJECT_WORKFLOWS,
  STUDIO_SECTIONS,
  studioBreadcrumb,
  studioSidebarCollapsed,
} from "./navigation";

describe("studio navigation", () => {
  it("lists studio sections and in-project workflows", () => {
    expect(STUDIO_SECTIONS.map((item) => item.label)).toEqual([
      "Projects",
      "Price book",
      "Clients",
      "Documents",
      "Settings",
    ]);
    expect(PROJECT_WORKFLOWS.map((item) => item.id)).toEqual([
      "design",
      "quote",
      "approval",
      "engineering",
      "payments",
    ]);
  });

  it("keeps the studio sidebar open while designing", () => {
    expect(studioSidebarCollapsed("project", "design")).toBe(false);
    expect(studioSidebarCollapsed("project", "quote")).toBe(false);
    expect(studioSidebarCollapsed("studio", "design")).toBe(false);
  });

  it("builds a project breadcrumb", () => {
    expect(studioBreadcrumb(null, "Room", "A")).toBe("Cabinet Studio");
    expect(studioBreadcrumb("Kitchen", "Living Room", "B")).toBe("Kitchen / Living Room / Rev B");
  });
});
