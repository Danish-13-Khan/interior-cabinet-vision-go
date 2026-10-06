import { describe, expect, it } from "vitest";
import { getDefaultCabinetConfig, type CabinetConfig } from "../cabinetDimensions";
import { normalizeConstructionSpec } from "../cabinetConstructionSpec";
import { renderElevationFaceGraphics } from "../elevationFace";
import { createHardwareSchedule, csvFromHardwareSchedule, UNCONFIRMED_DEFAULT_LABEL } from "../hardwareSystem";
import { applyFrontSystemParameters, golaParametersPatch, pushParametersPatch } from "./frontSystemParameters";
import { defaultGolaProfiles } from "./golaProfiles";
import { SLIDING_PULL_ID, SLIDING_ROLLER_HARDWARE, SLIDING_TRACK_HARDWARE } from "./slidingDefaults";
import { hingedParametersPatch, slidingDoorsOf, slidingParametersPatch } from "./slidingSpec";
import { hardwareFor, slidingWardrobe } from "./slidingTestSupport";

const SLIDING_IDS = [SLIDING_TRACK_HARDWARE["bottom-roll"], SLIDING_ROLLER_HARDWARE["bottom-roll"], SLIDING_PULL_ID];

function elevationSvg(config: CabinetConfig) {
  const cabinet = { id: "w", name: "Wardrobe", config, placement: { x: 0, y: 0, z: 0, rotation: 0 as const, attachment: "floor" as const } };
  return renderElevationFaceGraphics(cabinet, 0, 0, config.dimensions.width, config.dimensions.height, { scale: 1, showDetails: true }).join("");
}

describe("Phase 3 sliding shutters: hardware schedule", () => {
  it("2400 wardrobe: track (metres = W), roller set + flush pull per leaf, zero hinges, no handles", () => {
    const lines = hardwareFor(slidingWardrobe(2400));
    expect(lines.find((line) => line.id === SLIDING_TRACK_HARDWARE["bottom-roll"])?.quantity).toBe(2.4);
    expect(lines.find((line) => line.id === SLIDING_ROLLER_HARDWARE["bottom-roll"])?.quantity).toBe(3);
    expect(lines.find((line) => line.id === SLIDING_PULL_ID)?.quantity).toBe(3);
    expect(lines.filter((line) => line.kind === "hinge")).toEqual([]);
    expect(lines.filter((line) => line.kind === "handle")).toEqual([]);
  });

  it("top-hung track override schedules the top-hung set; hinged wardrobes keep hinges and no track", () => {
    const lines = hardwareFor(slidingWardrobe(1800, { trackKind: "top-hung" }));
    expect(lines.find((line) => line.id === SLIDING_TRACK_HARDWARE["top-hung"])?.quantity).toBe(1.8);
    expect(lines.find((line) => line.id === SLIDING_ROLLER_HARDWARE["top-hung"])?.quantity).toBe(2);
    const hinged = hardwareFor(applyFrontSystemParameters(slidingWardrobe(900), hingedParametersPatch()));
    expect(hinged.some((line) => line.kind === "hinge")).toBe(true);
    expect(hinged.some((line) => SLIDING_IDS.includes(line.id))).toBe(false);
  });

  it("every sliding and push line is flagged unconfirmed default in the schedule and CSV export", () => {
    const sliding = hardwareFor(slidingWardrobe(1800));
    for (const line of sliding.filter((item) => SLIDING_IDS.includes(item.id))) expect(line.unconfirmedDefault, line.id).toBe(true);
    const base = getDefaultCabinetConfig("base");
    const push = hardwareFor(applyFrontSystemParameters(base, pushParametersPatch("tip-on")));
    for (const id of ["tip-on-door", "hinge-spring-free"]) {
      expect(push.find((line) => line.id === id)?.unconfirmedDefault, id).toBe(true);
    }
    expect(hardwareFor(base).some((line) => line.unconfirmedDefault)).toBe(false);
    const cabinet = { id: "w", name: "W", config: slidingWardrobe(1800), placement: { x: 0, y: 0, z: 0, rotation: 0 as const, attachment: "floor" as const } };
    const schedule = createHardwareSchedule([cabinet], new Map([["w", sliding]])).project;
    expect(schedule.find((row) => row.hardwareId === SLIDING_PULL_ID)?.unconfirmedDefault).toBe(true);
    const csv = csvFromHardwareSchedule(schedule);
    expect(csv.split("\n")[0]).toContain('"Status"');
    expect(csv).toContain(UNCONFIRMED_DEFAULT_LABEL);
  });
});

describe("Phase 3 sliding shutters: elevations and front-system rules", () => {
  it("elevation draws overlapping leaves with flush pulls and no hinge marks or swings", () => {
    const svg = elevationSvg(slidingWardrobe(2400));
    expect(svg.match(/twod-sliding-leaf/g)).toHaveLength(3);
    expect(svg.match(/twod-sliding-pull/g)).toHaveLength(3);
    expect(svg).toContain("twod-sliding-overlap");
    expect(svg).not.toContain("twod-door-hinge");
    expect(svg).not.toContain("twod-door-swing");
    const hinged = elevationSvg(applyFrontSystemParameters(slidingWardrobe(900), hingedParametersPatch()));
    expect(hinged).toContain("twod-door-hinge");
    expect(hinged).not.toContain("twod-sliding-leaf");
  });

  it("hinged → sliding → hinged round-trips cleanly through object parameters", () => {
    const base = getDefaultCabinetConfig("almirah");
    let parameters: Record<string, string | number | boolean> = {};
    const before = applyFrontSystemParameters(base, parameters);
    parameters = { ...parameters, ...slidingParametersPatch() };
    const sliding = applyFrontSystemParameters(base, parameters);
    expect(slidingDoorsOf(sliding)).not.toBeNull();
    expect(JSON.stringify(sliding.composition?.openingStructure)).toContain('"doorStyle":"sliding"');
    parameters = { ...parameters, ...hingedParametersPatch() };
    const after = applyFrontSystemParameters(base, parameters);
    expect(slidingDoorsOf(after)).toBeNull();
    expect(after.composition).toEqual(before.composition);
    expect(normalizeConstructionSpec("almirah", after.construction))
      .toEqual(normalizeConstructionSpec("almirah", before.construction));
  });

  it("sliding never coexists with gola or push, and is wardrobe-only", () => {
    const gola = slidingWardrobe(1800, {}, golaParametersPatch(defaultGolaProfiles()));
    expect(normalizeConstructionSpec("almirah", gola.construction).frontSystem).toBeUndefined();
    const pushLater = applyFrontSystemParameters(slidingWardrobe(1800), pushParametersPatch());
    expect(normalizeConstructionSpec("almirah", pushLater.construction).frontSystem).toBeUndefined();
    expect(slidingDoorsOf(pushLater)).not.toBeNull();
    const base = applyFrontSystemParameters(getDefaultCabinetConfig("base"), slidingParametersPatch());
    expect(slidingDoorsOf(base)).toBeNull();
    expect(normalizeConstructionSpec("tall", { sliding: { overlapMm: 40 } } as never).sliding).toBeUndefined();
  });
});
