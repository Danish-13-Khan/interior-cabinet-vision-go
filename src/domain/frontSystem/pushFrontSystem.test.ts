import { describe, expect, it } from "vitest";
import {
  clampCabinetConfig,
  getDefaultCabinetConfig,
  type CabinetConfig,
} from "../cabinetDimensions";
import { createCabinetConstruction } from "../cabinetConstruction/createConstruction";
import {
  handledFrontCount,
  pushFrontCount,
  resolveFrontGaps,
} from "../cabinetConstruction/frontGaps";
import { normalizeConstructionSpec } from "../cabinetConstructionSpec";
import { DEFAULT_COSTING_SETTINGS } from "../costingSettings";
import { createCabinetGeometry } from "../cabinetGeometry";
import { buildHardwareLines } from "../hardwareSystem";
import {
  DEFAULT_PUSH_MECHANISM,
  PUSH_DRAWER_SLIDE_ID,
  PUSH_LATCH_BUFFER_MM,
  PUSH_MECHANISM_HARDWARE,
  applyFrontSystemParameters,
  defaultGolaProfiles,
  frontSystemFromParameters,
  normalizeFrontSystem,
  pushParametersPatch,
  type FrontSystem,
} from "./index";

function withFront(frontSystem: FrontSystem): CabinetConfig {
  const config = getDefaultCabinetConfig("base");
  return clampCabinetConfig({
    ...config,
    construction: {
      ...normalizeConstructionSpec("base", config.construction),
      frontSystem,
    },
  });
}

function scheduled(config: CabinetConfig) {
  const cabinet = {
    id: "c",
    name: "Kitchen base",
    config,
    placement: { x: 0, y: 0, z: 0, rotation: 0, attachment: "floor" as const },
  };
  return buildHardwareLines(
    cabinet,
    createCabinetConstruction(config),
    DEFAULT_COSTING_SETTINGS,
  );
}

const PUSH: FrontSystem = { kind: "push", mechanism: DEFAULT_PUSH_MECHANISM };
const GOLA: FrontSystem = { kind: "gola", profiles: defaultGolaProfiles() };

describe("Phase 2 push-to-open front system", () => {
  it("normalises push and round-trips handled → push → gola via parameters", () => {
    expect(normalizeFrontSystem({ kind: "push", mechanism: "push-latch" })).toEqual({
      kind: "push",
      mechanism: "push-latch",
    });
    expect(normalizeFrontSystem({ kind: "push" }).kind).toBe("push");

    let parameters: Record<string, string | number | boolean> = { frontSystem: "handled" };
    expect(frontSystemFromParameters(parameters)).toEqual({ kind: "handled" });

    parameters = { ...parameters, ...pushParametersPatch("tip-on") };
    expect(frontSystemFromParameters(parameters)).toEqual({
      kind: "push",
      mechanism: "tip-on",
    });

    parameters = { ...parameters, frontSystem: "gola" };
    expect(frontSystemFromParameters(parameters)?.kind).toBe("gola");

    const fromParams = applyFrontSystemParameters(
      getDefaultCabinetConfig("base"),
      pushParametersPatch("push-latch"),
    );
    expect(normalizeConstructionSpec("base", fromParams.construction).frontSystem).toEqual({
      kind: "push",
      mechanism: "push-latch",
    });
  });

  it("resolver: push doors share one gap rule with latch buffer; no handles in 3D or schedule", () => {
    const handled = resolveFrontGaps(withFront({ kind: "handled" }));
    const push = resolveFrontGaps(withFront(PUSH));
    expect(pushFrontCount(push)).toBeGreaterThan(0);
    expect(handledFrontCount(push)).toBe(0);
    expect(handledFrontCount(handled)).toBeGreaterThan(0);

    const pushLeaf = push.openings[0]!.leaves[0]!;
    const handledLeaf = handled.openings[0]!.leaves[0]!;
    // Latch buffer shrinks the leaf vs handled (same mount).
    expect(pushLeaf.widthMm).toBeLessThan(handledLeaf.widthMm);
    expect(pushLeaf.heightMm).toBeLessThan(handledLeaf.heightMm);
    expect(PUSH_LATCH_BUFFER_MM).toBe(3);

    const geometry = createCabinetGeometry(withFront(PUSH));
    expect(geometry.filter((panel) => panel.name.startsWith("handle-"))).toHaveLength(0);

    const lines = scheduled(withFront(PUSH));
    expect(lines.filter((line) => line.kind === "handle")).toEqual([]);
    const latch = lines.find((line) => line.id === PUSH_MECHANISM_HARDWARE["tip-on"]);
    expect(latch?.quantity).toBe(push.openings.filter((o) => o.kind === "door")
      .reduce((sum, o) => sum + o.leaves.length, 0));
  });

  it("Q2: drawers on push fronts use push-open runners, not a per-drawer latch", () => {
    const drawer = withFront(PUSH);
    drawer.type = "drawer";
    const config = clampCabinetConfig({
      ...getDefaultCabinetConfig("drawer"),
      construction: {
        ...normalizeConstructionSpec("drawer", getDefaultCabinetConfig("drawer").construction),
        frontSystem: PUSH,
      },
    });
    const lines = scheduled(config);
    expect(lines.some((line) => line.id === PUSH_DRAWER_SLIDE_ID)).toBe(true);
    expect(lines.some((line) => line.id === PUSH_MECHANISM_HARDWARE["tip-on"])).toBe(false);
    expect(createCabinetGeometry(config).filter((p) => p.name.startsWith("handle-"))).toHaveLength(0);
  });

  it("cut list door sizes match the resolver for push kitchen bases", () => {
    const config = withFront(PUSH);
    const fronts = resolveFrontGaps(config);
    const construction = createCabinetConstruction(config);
    const doorParts = construction.parts.filter((part) => part.category === "Door");
    expect(doorParts.length).toBeGreaterThan(0);
    const leafWidths = fronts.openings
      .filter((entry) => entry.kind === "door")
      .flatMap((entry) => entry.leaves.map((leaf) => Math.round(leaf.widthMm)));
    for (const part of doorParts) {
      expect(leafWidths).toContain(Math.round(part.widthMm));
    }
  });

  it("3D handle count stays aligned for handled and gola after push lands", () => {
    for (const system of [{ kind: "handled" } as FrontSystem, GOLA, PUSH]) {
      const config = withFront(system);
      const drawn = createCabinetGeometry(config).filter((panel) => panel.name.startsWith("handle-"));
      const handleQty = scheduled(config)
        .filter((line) => line.kind === "handle")
        .reduce((sum, line) => sum + line.quantity, 0);
      expect(drawn, system.kind).toHaveLength(handleQty);
    }
  });
});
