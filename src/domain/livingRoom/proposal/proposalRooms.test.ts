import { describe, expect, it } from "vitest";
import { COMPOSER_TEST_NOW } from "../../apartmentTemplates/composers/bareRoom";
import { composeApartment } from "../../apartmentTemplates/composeApartment";
import { THREE_BHK_SHELL_SPEC } from "../../apartmentTemplates/specs/threeBhkShell";
import { readInteriorEstimate, writeInteriorEstimate } from "../../interiorEstimate/state";
import { BRAND_LOGO_MAX_BYTES, clampBrandLogo } from "../../quoteSettings";
import { patchProposalQuoteSettings } from "./commercialState";
import { PROPOSAL_TEST_PNG } from "./goldenProposal";
import { buildProposalDocument } from "./proposalDocument";

const NOW = "2026-10-08T09:00:00.000Z";
// The quote spans every room only with the interior estimate on, as the app's apartment projects have it.
const composed = composeApartment(THREE_BHK_SHELL_SPEC, { now: COMPOSER_TEST_NOW });
const project = writeInteriorEstimate(composed, { ...readInteriorEstimate(composed), enabled: true });

describe("proposal room pages and brand (roadmap D3, D5)", () => {
  it("builds one room page per printed view with that room's cabinets and finishes", () => {
    const proposal = buildProposalDocument(project, { now: NOW });
    expect(proposal.rooms.map((room) => room.roomName)).toEqual([
      "Living", "Kitchen", "Guest", "Foyer", "Study", "Kids", "Master",
    ]);
    const kitchen = proposal.rooms.find((room) => room.roomName === "Kitchen")!;
    expect(kitchen.cabinets.filter((line) => /^C\d+$/.test(line.mark))).toHaveLength(8);
    expect(kitchen.finishes.length).toBeGreaterThan(0);
    expect(kitchen.finishes.every((line) => line.rooms?.includes("Kitchen"))).toBe(true);
    const living = proposal.rooms.find((room) => room.roomName === "Living")!;
    expect(living.cabinets.filter((line) => /^C\d+$/.test(line.mark))).toEqual([]);
    // Summary pricing: no room subtotal; itemized pricing sums the room's lines.
    expect(kitchen.subtotal).toBeNull();
    const itemized = buildProposalDocument(
      patchProposalQuoteSettings(project, { priceDetail: "itemized" }),
      { now: NOW },
    );
    const itemizedKitchen = itemized.rooms.find((room) => room.roomName === "Kitchen")!;
    expect(itemizedKitchen.subtotal).toBe(itemizedKitchen.cabinets.reduce((sum, line) => sum + line.sellPrice, 0));
    // Every cabinet line lands on exactly one room page.
    const paged = itemized.rooms.flatMap((room) => room.cabinets.map((line) => line.mark));
    expect(new Set(paged).size).toBe(paged.length);
  });

  it("carries swatch colours and room usage on the finish lines", () => {
    const proposal = buildProposalDocument(project, { now: NOW });
    expect(proposal.materials.length).toBeGreaterThan(0);
    expect(proposal.materials.some((line) => /^#[0-9a-f]{6}$/i.test(line.color ?? ""))).toBe(true);
    expect(proposal.materials.every((line) => (line.rooms?.length ?? 0) > 0)).toBe(true);
  });

  it("prints the studio identity from quote settings and keeps only raster logos under the cap", () => {
    const branded = patchProposalQuoteSettings(project, {
      brandName: "Mitra Interiors",
      brandContact: "hello@mitra.example · +91 98765 43210",
      brandLogoDataUrl: PROPOSAL_TEST_PNG,
    });
    const proposal = buildProposalDocument(branded, { now: NOW });
    expect(proposal.brand).toEqual({
      name: "Mitra Interiors",
      contact: "hello@mitra.example · +91 98765 43210",
      logoDataUrl: PROPOSAL_TEST_PNG,
    });
    expect(clampBrandLogo("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=")).toBe("");
    const oversized = `data:image/png;base64,${"A".repeat(Math.ceil((BRAND_LOGO_MAX_BYTES + 3) / 3) * 4)}`;
    expect(clampBrandLogo(oversized)).toBe("");
    expect(buildProposalDocument(project, { now: NOW }).brand.name).toBe("Cabinet Studio");
  });
});
