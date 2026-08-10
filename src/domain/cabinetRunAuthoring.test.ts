import { describe, expect, it } from "vitest";
import {
  getDefaultCabinetConfig,
  type CabinetInstance,
  type CabinetProject,
} from "./cabinetDimensions";
import { detectCabinetRuns, getRunExtent } from "./cabinetRuns";
import {
  createRunAuthoringModel,
  replaceCabinetFamily,
  splitCabinetInRun,
} from "./cabinetRunAuthoring";

const bounds = { widthMm: 6000, depthMm: 4000, heightMm: 2800 };

function cabinet(id: string, x: number, width = 900): CabinetInstance {
  const config = getDefaultCabinetConfig("base");
  return {
    id,
    name: id,
    config: {
      ...config,
      dimensions: { ...config.dimensions, width },
    },
    placement: { x, y: 0, z: -1720, rotation: 0, attachment: "floor" },
    layerId: "layer-default",
    groupId: null,
  };
}

describe("cabinet run authoring", () => {
  it("reports ordered members and exact internal gaps", () => {
    const project: CabinetProject = {
      version: 1,
      cabinets: [cabinet("left", -1000), cabinet("right", 0)],
    };
    const run = detectCabinetRuns(project.cabinets, bounds)[0]!;
    const model = createRunAuthoringModel({
      project,
      run,
      activeCabinetId: "left",
    });

    expect(model.members.map((item) => item.id)).toEqual(["left", "right"]);
    expect(model.gaps).toHaveLength(1);
    expect(model.gaps[0]!.widthMm).toBe(100);
    expect(model.health).toBe("open");
  });

  it("splits a cabinet without changing the run footprint", () => {
    const original = cabinet("wide", 0, 1200);
    const project: CabinetProject = { version: 1, cabinets: [original] };
    const run = detectCabinetRuns(project.cabinets, bounds)[0]!;
    const pair = splitCabinetInRun({
      cabinet: original,
      run,
      firstId: "wide-a",
      secondId: "wide-b",
    });

    expect(pair).not.toBeNull();
    expect(pair![0].config.dimensions.width + pair![1].config.dimensions.width).toBe(1200);
    expect(getRunExtent(pair![0], run.axis).start).toBe(
      getRunExtent(original, run.axis).start,
    );
    expect(getRunExtent(pair![1], run.axis).end).toBe(
      getRunExtent(original, run.axis).end,
    );
  });

  it("replaces a family while enforcing the replacement engineering limits", () => {
    const original = cabinet("base", 0, 1100);
    const replacement = replaceCabinetFamily(original, {
      config: getDefaultCabinetConfig("drawer"),
    });

    expect(replacement.config.type).toBe("drawer");
    expect(replacement.config.dimensions.width).toBe(1000);
    expect(replacement.id).toBe(original.id);
  });
});
