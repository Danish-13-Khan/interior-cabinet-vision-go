import { describe, expect, it } from "vitest";
import { clientPreviewExportStatusMessage } from "./exportStatusMessage";

describe("clientPreviewExportStatusMessage", () => {
  it("mentions accepted stills even when no hero render exists", () => {
    expect(clientPreviewExportStatusMessage(null, 1)).toMatch(/accepted stills/i);
    expect(clientPreviewExportStatusMessage(null, 0)).not.toMatch(/accepted stills/i);
  });

  it("includes PNG in the message when a hero render is present", () => {
    expect(clientPreviewExportStatusMessage({} as never, 1)).toMatch(/PNG.*accepted stills/i);
  });
});
