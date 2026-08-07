import { describe, expect, it } from "vitest";
import {
  defaultCabinetProject,
  getDefaultCabinetConfig,
  type CabinetInstance,
} from "./cabinetDimensions";
import {
  createMachineJobDocument,
  exportProjectMachineFile,
  listImplementedMachineExportAdapters,
  listPreviewOperations,
} from "./machineExport";

function makeCabinet(id: string, type: "base" | "drawer" | "tall" = "base"): CabinetInstance {
  return {
    id,
    name: id,
    placement: { x: 0, y: 0, z: 0, rotation: 0, attachment: "floor" },
    config: {
      ...getDefaultCabinetConfig(type),
      construction:
        type === "drawer"
          ? {
              carcassStyle: "frameless",
              caseJoinery: "dado",
              doorMount: "overlay",
              shelfMount: "adjustable-pins",
              drawerBoxStyle: "dado-bottom",
              faceFrame: { stileWidthMm: 50, railWidthMm: 50 },
            }
          : {
              carcassStyle: "frameless",
              caseJoinery: "dado",
              doorMount: "overlay",
              shelfMount: "adjustable-pins",
              drawerBoxStyle: "butt-screw",
              faceFrame: { stileWidthMm: 50, railWidthMm: 50 },
            },
    },
  };
}

describe("machine export architecture", () => {
  it("builds machine-export-ready parts with operations and orientation", () => {
    const project = {
      ...defaultCabinetProject,
      cabinets: [makeCabinet("cab-1", "base"), makeCabinet("cab-2", "drawer")],
    };
    const doc = createMachineJobDocument(project);

    expect(doc.format).toBe("cabinet-designer-machine-json");
    expect(doc.disclaimer.toLowerCase()).toContain("not verified");
    expect(doc.parts.length).toBeGreaterThan(0);
    expect(doc.summary.cutIntentCount).toBe(doc.parts.length);
    expect(doc.summary.operationCount).toBeGreaterThan(doc.parts.length);

    const side = doc.parts.find((part) => part.category === "Side");
    expect(side?.orientation.originCorner).toBe("bottom-left");
    expect(side?.operations.some((op) => op.kind === "drill" || op.kind === "groove")).toBe(
      true,
    );

    const previewRows = listPreviewOperations(doc.parts);
    expect(previewRows.length).toBe(doc.summary.operationCount);
  });

  it("exports preview JSON and CSV adapters without claiming CNC programs", () => {
    const adapters = listImplementedMachineExportAdapters();
    expect(adapters.map((item) => item.id)).toEqual([
      "json-preview",
      "csv-ops-preview",
    ]);

    const json = exportProjectMachineFile(defaultCabinetProject, "json-preview");
    expect(json.fileExtension).toBe("json");
    expect(json.contents).toContain("cabinet-designer-machine-json");
    expect(json.contents).toContain("Intent / preview only");

    const csv = exportProjectMachineFile(defaultCabinetProject, "csv-ops-preview");
    expect(csv.fileExtension).toBe("csv");
    expect(csv.contents.split("\n")[0]).toContain("opKind");
    expect(csv.contents).toContain("cut-outline");
  });
});
