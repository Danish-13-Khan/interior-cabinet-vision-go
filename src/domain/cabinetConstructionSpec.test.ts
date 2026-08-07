import { describe, expect, it } from "vitest";
import { clampCabinetConfig, getDefaultCabinetConfig } from "./cabinetDimensions";
import { createCabinetConstruction } from "./cabinetConstruction";
import {
  normalizeConstructionSpec,
  shelfMountFromAdjustable,
} from "./cabinetConstructionSpec";
import { applyCabinetEditorChange, getCabinetEditorSections } from "./cabinetEditorSchema";

describe("cabinet construction authoring", () => {
  it("normalizes construction defaults per family", () => {
    const wall = normalizeConstructionSpec("wall", undefined);
    const drawer = normalizeConstructionSpec("drawer", undefined);
    expect(wall.caseJoinery).toBe("dado");
    expect(drawer.drawerBoxStyle).toBe("dado-bottom");
  });

  it("keeps shelf mount and adjustable flag in sync through clamp", () => {
    const clamped = clampCabinetConfig({
      ...getDefaultCabinetConfig("base"),
      construction: {
        ...normalizeConstructionSpec("base", undefined),
        shelfMount: "fixed-dado",
      },
      composition: {
        ...getDefaultCabinetConfig("base").composition!,
        shelves: { count: 2, adjustable: true },
      },
    });

    // Composition adjustable wins when provided during normalize options path via clamp.
    expect(clamped.construction?.shelfMount).toBe("adjustable-pins");
    expect(clamped.composition?.shelves.adjustable).toBe(true);

    const fixed = clampCabinetConfig({
      ...getDefaultCabinetConfig("base"),
      construction: {
        ...normalizeConstructionSpec("base", { shelfMount: "fixed-screw" }),
        shelfMount: "fixed-screw",
      },
      composition: {
        openings: [],
        shelves: { count: 2, adjustable: false },
        dividers: { count: 0 },
        doors: { enabled: true, style: "double", hinge: "left", count: 2 },
        drawers: { count: 0, equalHeights: true },
        toeKick: { enabled: true, heightMm: 100, insetMm: 60 },
        fillers: { leftMm: 0, rightMm: 0 },
        endPanels: { left: false, right: false },
      },
    });
    expect(fixed.construction?.shelfMount).toBe("fixed-screw");
    expect(fixed.composition?.shelves.adjustable).toBe(false);
    expect(shelfMountFromAdjustable(false)).toBe("fixed-dado");
  });

  it("sizes overlay vs inset doors differently and notes mount style", () => {
    const overlay = createCabinetConstruction({
      ...getDefaultCabinetConfig("base"),
      construction: normalizeConstructionSpec("base", { doorMount: "overlay" }),
    });
    const inset = createCabinetConstruction({
      ...getDefaultCabinetConfig("base"),
      construction: normalizeConstructionSpec("base", { doorMount: "inset" }),
    });

    const overlayDoor = overlay.parts.find((part) => part.category === "Door")!;
    const insetDoor = inset.parts.find((part) => part.category === "Door")!;
    expect(insetDoor.widthMm).toBeLessThan(overlayDoor.widthMm);
    expect(overlayDoor.notes).toContain("Overlay");
    expect(insetDoor.notes).toContain("Inset");
  });

  it("adds face-frame parts and joinery notes on sides", () => {
    const construction = createCabinetConstruction({
      ...getDefaultCabinetConfig("base"),
      construction: normalizeConstructionSpec("base", {
        carcassStyle: "face-frame",
        caseJoinery: "dado",
        faceFrame: { stileWidthMm: 50, railWidthMm: 50 },
      }),
    });

    expect(construction.parts.filter((part) => part.category === "FaceFrame")).toHaveLength(4);
    expect(construction.parts.find((part) => part.id === "left-side")?.notes).toMatch(/dado/i);
    expect(
      construction.parts.find((part) => part.category === "Shelf")?.notes,
    ).toBeTruthy();
  });

  it("applies drawer box style notes and dado bottom oversize", () => {
    const construction = createCabinetConstruction({
      ...getDefaultCabinetConfig("drawer"),
      construction: normalizeConstructionSpec("drawer", {
        drawerBoxStyle: "dado-bottom",
      }),
    });
    const bottom = construction.parts.find((part) => part.id === "drawer-bottom")!;
    expect(bottom.notes).toMatch(/groove/i);
    const butt = createCabinetConstruction({
      ...getDefaultCabinetConfig("drawer"),
      construction: normalizeConstructionSpec("drawer", {
        drawerBoxStyle: "butt-screw",
      }),
    });
    const buttBottom = butt.parts.find((part) => part.id === "drawer-bottom")!;
    expect(bottom.lengthMm).toBeGreaterThan(buttBottom.lengthMm);
  });

  it("exposes construction fields in the property grid schema", () => {
    const sections = getCabinetEditorSections(getDefaultCabinetConfig("base"));
    const construction = sections.find((section) => section.id === "construction");
    expect(construction).toBeTruthy();
    expect(construction?.fields.some((field) => field.id === "caseJoinery")).toBe(true);

    const next = applyCabinetEditorChange(getDefaultCabinetConfig("base"), "doorMount", "inset");
    expect(next.construction?.doorMount).toBe("inset");
  });
});
