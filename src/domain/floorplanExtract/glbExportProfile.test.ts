import { describe, expect, it } from "vitest";
import {
  fingerprintFloorplanGlbRequest,
  hashFingerprintSeed,
} from "./glbExportFingerprint";
import {
  DEFAULT_FLOORPLAN_GLB_FLAGS,
  FLOORPLAN_GLB_EXPORT_PROFILE_VERSION,
  floorplanGlbQuery,
  mergeFloorplanGlbFlags,
} from "./glbExportProfile";
import { glbDraftA, glbDraftN } from "./glbExport.testHelpers";

const draftB = glbDraftN(3);

describe("glb export profile", () => {
  it("emits flags in stable query order", () => {
    expect(floorplanGlbQuery(DEFAULT_FLOORPLAN_GLB_FLAGS)).toBe(
      "strict=0&props=1&floors=1&doors=1&frames=1&glass=1&trim=1&union=1",
    );
  });

  it("mergeFloorplanGlbFlags overlays without dropping defaults", () => {
    expect(mergeFloorplanGlbFlags({ props: 0 }).props).toBe(0);
    expect(mergeFloorplanGlbFlags({ props: 0 }).union).toBe(1);
  });
});

describe("fingerprintFloorplanGlbRequest", () => {
  it("is stable for the same request", () => {
    const a = fingerprintFloorplanGlbRequest({
      draft: glbDraftA,
      apiBase: "https://cabinet-floorplan.onrender.com",
    });
    const b = fingerprintFloorplanGlbRequest({
      draft: glbDraftA,
      apiBase: "https://cabinet-floorplan.onrender.com",
    });
    expect(a).toBe(b);
  });

  it("changes when draft, flags, base, or profile version change", () => {
    const base = fingerprintFloorplanGlbRequest({
      draft: glbDraftA,
      apiBase: "https://cabinet-floorplan.onrender.com",
    });
    expect(fingerprintFloorplanGlbRequest({
      draft: draftB,
      apiBase: "https://cabinet-floorplan.onrender.com",
    })).not.toBe(base);
    expect(fingerprintFloorplanGlbRequest({
      draft: glbDraftA,
      apiBase: "https://cabinet-floorplan.onrender.com",
      flags: { union: 0 },
    })).not.toBe(base);
    expect(fingerprintFloorplanGlbRequest({
      draft: glbDraftA,
      apiBase: "http://127.0.0.1:8080",
    })).not.toBe(base);
    expect(fingerprintFloorplanGlbRequest({
      draft: glbDraftA,
      apiBase: "https://cabinet-floorplan.onrender.com",
      profileVersion: "999",
    })).not.toBe(base);
    expect(FLOORPLAN_GLB_EXPORT_PROFILE_VERSION).toBe("1");
  });

  it("hashFingerprintSeed is deterministic", () => {
    expect(hashFingerprintSeed("abc")).toBe(hashFingerprintSeed("abc"));
    expect(hashFingerprintSeed("abc")).not.toBe(hashFingerprintSeed("abd"));
  });
});
