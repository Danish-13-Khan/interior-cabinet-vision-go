import { PRINTABLE_SHEET_SET } from "../printLayout";
import { rasterizePdfPages } from "../livingRoom/proposal/proposalPdfRaster";
import {
  collectImagePaintGaps,
  collectRasterLayoutIssues,
} from "../livingRoom/proposal/proposalVerifyPages";
import { compactPdfText } from "../livingRoom/proposal/proposalVerifyVisual";
import type { ProjectReport } from "../projectReport";

export type PacketVisualCheck = {
  ok: boolean;
  missing: string[];
  pageCount: number;
  text: string;
  pages: ReturnType<typeof collectRasterLayoutIssues>["pages"];
};

export async function verifyProductionPacketPages(
  blob: Blob,
  report: ProjectReport,
  extra: string[] = [],
  expectedViewImages = PRINTABLE_SHEET_SET.length,
): Promise<PacketVisualCheck> {
  const missing: string[] = [];
  let rasters: Awaited<ReturnType<typeof rasterizePdfPages>> = [];
  try {
    rasters = await rasterizePdfPages(new Uint8Array(await blob.arrayBuffer()));
  } catch {
    missing.push("pdf-render-failed");
  }
  const text = rasters.map((page) => page.text).join(" ");
  const compact = compactPdfText(text);
  const required = [
    "Production Packet",
    report.summary.projectNumber,
    `Rev ${report.summary.revision}`,
    "Production Cutlist",
    "Hardware Schedule",
    "Fallback warnings: none",
    ...report.cabinetSchedule.map((row) => row.cabinetId),
    ...report.cabinetSchedule.map((row) => String(row.widthMm)),
    ...extra,
  ];
  missing.push(...required.filter((item) => item && !text.includes(item) && !compact.includes(item)));
  const layout = collectRasterLayoutIssues(rasters);
  missing.push(...layout.missing);
  missing.push(...collectImagePaintGaps(rasters, expectedViewImages));
  if (!rasters.length && !missing.includes("pdf-render-failed")) missing.push("no-raster-pages");
  return {
    ok: missing.length === 0,
    missing,
    pageCount: rasters.length,
    text,
    pages: layout.pages,
  };
}
