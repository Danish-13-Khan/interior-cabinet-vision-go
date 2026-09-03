import { describe, expect, it } from "vitest";
import {
  INTERIORS_CUSTOMER_EXPORTS,
  interiorsShowsEmptyInspector,
  interiorsShowsProductionChrome,
  interiorsStageTitle,
  isInteriorsQaFixture,
} from "./interiorsCustomerChrome";

describe("interiorsCustomerChrome", () => {
  it("names canvas views without Review Studio or workflow steps", () => {
    expect(interiorsStageTitle("plan")).toBe("2D plan");
    expect(interiorsStageTitle("model")).toBe("3D model");
    expect(interiorsStageTitle("render")).toBe("Client view");
  });

  it("keeps production and empty inspectors off the Interiors canvas", () => {
    expect(interiorsShowsProductionChrome()).toBe(false);
    expect(interiorsShowsEmptyInspector(false)).toBe(false);
    expect(interiorsShowsEmptyInspector(true)).toBe(true);
  });

  it("renames technical exports to customer outcomes", () => {
    expect(INTERIORS_CUSTOMER_EXPORTS.cutlist.label).toBe("Download cutlist");
    expect(INTERIORS_CUSTOMER_EXPORTS.shopPacket.label).toBe("Download shop packet");
    expect(INTERIORS_CUSTOMER_EXPORTS.machinePreview.label).toBe("Download machine preview");
    expect(INTERIORS_CUSTOMER_EXPORTS.releaseToShop.label).toBe("Release to shop");
  });

  it("keeps Golden and Render Studio behind the QA fixture only", () => {
    expect(isInteriorsQaFixture("openGoldenRun")).toBe(true);
    expect(isInteriorsQaFixture("openRenderStudio")).toBe(true);
    expect(isInteriorsQaFixture("openReleaseDemo")).toBe(true);
    expect(isInteriorsQaFixture("Golden Run")).toBe(false);
  });
});
