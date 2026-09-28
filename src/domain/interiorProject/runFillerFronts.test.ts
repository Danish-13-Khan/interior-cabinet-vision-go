import { describe, expect, it } from "vitest";
import { createGoldenCabinetRunProject } from "../livingRoom/goldenRun/createProject";
import { seatRunFillersAtFronts } from "./runFillerFronts";

const isFiller = (object: { extensions?: Record<string, unknown> }) => Boolean(object.extensions?.cabinetRunFiller);

describe("seatRunFillersAtFronts", () => {
  const golden = createGoldenCabinetRunProject();

  it("leaves fillers that are already flush untouched", () => {
    expect(seatRunFillersAtFronts(golden)).toBe(golden);
  });

  it("moves wall-backed fillers from older files to the cabinet fronts", () => {
    const flushZ = golden.objects.filter(isFiller).map((object) => object.position.z);
    const legacy = {
      ...golden,
      objects: golden.objects.map((object) => (
        isFiller(object) ? { ...object, position: { ...object.position, z: -1931 } } : object
      )),
    };
    const seated = seatRunFillersAtFronts(legacy);
    const fillers = seated.objects.filter(isFiller);
    expect(fillers.map((object) => object.position.z)).toEqual(flushZ);
    expect(fillers.map((object) => object.position.x)).toEqual(golden.objects.filter(isFiller).map((object) => object.position.x));
    expect(fillers.map((object) => object.id)).toEqual(golden.objects.filter(isFiller).map((object) => object.id));
  });
});
