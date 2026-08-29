import { describe, expect, it } from "vitest";
import { clientPreviewExportStatusMessage } from "./exportStatusMessage";

describe("clientPreviewExportStatusMessage", () => {
  it("mentions accepted stills even when no hero render exists", () => {
    expect(clientPreviewExportStatusMessage(false, 1, 2)).toMatch(/accepted stills/i);
    expect(clientPreviewExportStatusMessage(false, 0, 0)).not.toMatch(/accepted stills/i);
  });

  it("includes PNG only when a package hero PNG was delivered", () => {
    expect(clientPreviewExportStatusMessage(true, 1, 2)).toMatch(/PNG.*accepted stills/i);
    expect(clientPreviewExportStatusMessage(false, 1, 2)).not.toMatch(/PNG/);
    expect(clientPreviewExportStatusMessage(false, 0, 0)).not.toMatch(/PNG/);
  });

  it("mentions the bundled millwork schedule", () => {
    expect(clientPreviewExportStatusMessage(false, 0, 3)).toMatch(/millwork schedule \(3 pieces\)/i);
    expect(clientPreviewExportStatusMessage(true, 0, 0)).toMatch(/millwork schedule/i);
  });
});
