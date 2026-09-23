import { describe, expect, it } from "vitest";
import { cutlistPdfBlob } from "./cutlistDocument";
import type { ProductionCutlistLine } from "../productionCutlist";

const line: ProductionCutlistLine = {
  key: "cab:door",
  partId: "door",
  shopRef: "D-01",
  label: "Door",
  quantity: 2,
  lengthMm: 720,
  widthMm: 396,
  thicknessMm: 18,
  material: "Oak veneer",
  finish: "wood-oak",
  edgeBanding: "pvc-2mm-all",
  grain: "lengthwise",
  category: "door",
  cabinetId: "cab",
  cabinetName: "Base cabinet",
  cabinetIndex: 1,
  notes: "Keep the long manufacturing note about hinge boring and the second line of shop instruction",
};

async function pdfText(blob: Blob): Promise<string> {
  return new TextDecoder("latin1").decode(await blob.arrayBuffer());
}

describe("cutlistPdfBlob", () => {
  it("keeps edge banding, grain, and the full note", async () => {
    const blob = cutlistPdfBlob([line]);
    expect(blob.type).toBe("application/pdf");
    const raw = await pdfText(blob);
    expect(raw).toContain("pvc-2mm-all");
    expect(raw).toContain("lengthwise");
    expect(raw).toContain("hinge boring");
    expect(raw).toContain("shop instruction");
  });
});
