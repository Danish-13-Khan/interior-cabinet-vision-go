import { describe, expect, it } from "vitest";
import { clampCabinetConfig, getDefaultCabinetConfig, type CabinetConfig, type CabinetType } from "../cabinetDimensions";
import { resolveCabinetComposition } from "../cabinetComposition";
import { normalizeConstructionSpec, type DoorMount } from "../cabinetConstructionSpec";
import { createCabinetCutlist, createCabinetGeometry } from "../cabinetGeometry";
import { collectOpeningLeaves, setOpeningContentType, splitOpening, updateOpeningLeaf } from "../cabinetOpeningStructure";
import { createCabinetConstruction } from "./createConstruction";
import { frontGapSpec, resolveFrontGaps } from "./frontGaps";

const MOUNTS: DoorMount[] = ["overlay", "full-overlay", "inset"];
const TYPES: CabinetType[] = ["base", "wall", "tall", "drawer", "sink"];

function withMount(config: CabinetConfig, doorMount: DoorMount, faceFrame = false): CabinetConfig {
  const spec = normalizeConstructionSpec(config.type, config.construction);
  return clampCabinetConfig({
    ...config,
    construction: { ...spec, doorMount, carcassStyle: faceFrame ? "face-frame" : spec.carcassStyle },
  });
}

function drawersOverDoor(): CabinetConfig {
  const config = getDefaultCabinetConfig("base");
  const width = config.dimensions.width;
  let structure = resolveCabinetComposition(config).openingStructure!;
  structure = splitOpening(structure, structure.activeOpeningId, "horizontal", "base", width);
  const leaves = collectOpeningLeaves(structure.root);
  structure = updateOpeningLeaf(structure, leaves[0]!.id, { drawerCount: 3 }, "base", width);
  structure = setOpeningContentType(structure, leaves[1]!.id, "door", "base", width);
  return { ...config, composition: { ...resolveCabinetComposition(config), openingStructure: structure } };
}

const sorted = (sizes: string[]) => [...sizes].sort();

function productionFronts(config: CabinetConfig) {
  return sorted(createCabinetConstruction(config).parts
    .filter((part) => part.category === "Door" || part.category === "DrawerFront")
    .flatMap((part) => Array.from({ length: part.quantity }, () => `${part.lengthMm}x${part.widthMm}`)));
}

const toMm = (metres: number) => Math.round(Number((metres * 1000).toFixed(6)));

function modelFronts(config: CabinetConfig) {
  return sorted(createCabinetGeometry(config)
    .filter((panel) => panel.material === "door")
    .map((panel) => `${toMm(panel.size[1])}x${toMm(panel.size[0])}`));
}

function legacyFronts(config: CabinetConfig) {
  return sorted(createCabinetCutlist(config)
    .filter((item) => item.key.startsWith("doors") || item.key.startsWith("drawer-fronts"))
    .flatMap((item) => Array.from({ length: item.quantity }, () => `${item.lengthMm}x${item.widthMm}`)));
}

describe("resolveFrontGaps — one front rule for 3D, production and the legacy cut list", () => {
  const cases: Array<[string, CabinetConfig]> = [
    ...TYPES.map((type) => [type, getDefaultCabinetConfig(type)] as [string, CabinetConfig]),
    ["drawers over door", drawersOverDoor()],
  ];

  for (const mount of MOUNTS) {
    for (const [name, base] of cases) {
      it(`${name} · ${mount}: 3D front sizes equal production part sizes`, () => {
        const config = withMount(base, mount);
        const production = productionFronts(config);
        expect(modelFronts(config)).toEqual(production);
        expect(legacyFronts(config)).toEqual(production);
      });
    }
  }

  it("inset fronts in a face-frame carcass match too", () => {
    const config = withMount(getDefaultCabinetConfig("base"), "inset", true);
    expect(modelFronts(config)).toEqual(productionFronts(config));
  });

  it("overlay full-face doors cover the carcass with no top gap", () => {
    const config = withMount(getDefaultCabinetConfig("tall"), "overlay");
    const { openings, gaps } = resolveFrontGaps(config);
    const leaf = openings[0]!.leaves[0]!;
    expect(gaps).toEqual(frontGapSpec("overlay"));
    expect(gaps.topMm).toBe(0);
    expect(leaf.yMm + leaf.heightMm).toBeCloseTo(config.dimensions.height - config.toeKickHeight, 6);
  });
});
