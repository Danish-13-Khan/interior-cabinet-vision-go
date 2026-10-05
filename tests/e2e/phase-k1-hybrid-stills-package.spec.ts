import { acceptHybridStill, captureClientPackageDownloads, expect, openRenderStudio, test } from "./phase-k1-hybrid-stills.helpers";

// One fresh browser per K1 spec file; see the helpers for why.
test.use({ freshBrowserSlot: 2 });

test("K1 hybrid stills: client package exports accepted still manifest and PNG", async ({ page }) => {
  test.setTimeout(180_000);
  await openRenderStudio(page);
  await acceptHybridStill(page);

  const downloads = await captureClientPackageDownloads(page);
  const provenanceFile = downloads.find((item) => item.name.includes("stills-provenance"));
  expect(provenanceFile?.text).toBeTruthy();
  const provenance = JSON.parse(provenanceFile!.text!) as Array<Record<string, unknown>>;
  expect(provenance).toHaveLength(1);
  expect(provenance[0]?.acceptanceStatus).toBe("accepted");
  expect(provenance[0]?.engine).toEqual({ id: "stilljob-hero", version: "1.0.0" });

  const manifestFile = downloads.find((item) => item.name.endsWith("-manifest.json"));
  expect(manifestFile?.text).toBeTruthy();
  const manifest = JSON.parse(manifestFile!.text!) as { acceptedStills: Array<Record<string, unknown>> };
  expect(manifest.acceptedStills).toHaveLength(1);
  expect(manifest.acceptedStills[0]?.jobId).toBe(provenance[0]?.jobId);
  expect(manifest.files.some((name: string) => name.endsWith("-millwork-schedule.pdf"))).toBe(true);
  expect(manifest.files.some((name: string) => name.endsWith("-millwork-schedule.csv"))).toBe(true);
  expect((manifest as { workshopSchedule?: { lineCount: number } }).workshopSchedule?.lineCount).toBeGreaterThan(0);

  expect(downloads.some((item) => item.name.endsWith("-still.png"))).toBe(true);
  expect(downloads.some((item) => item.name.endsWith("-millwork-schedule.pdf"))).toBe(true);
});
