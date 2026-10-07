import { optimizeSceneImage } from "../../pdfExport/helpers";
import { drawProposalSectionTitle, drawRows, pdfMoney } from "./proposalPdfDraw";
import {
  INK,
  drawPageFooter,
  fill,
  imageAspect,
  imageFormat,
  newPage,
  setType,
  stroke,
  writeText,
  type ProposalPdfLayout,
} from "./proposalPdfTheme";
import type { ProposalCabinetLine, ProposalDocument, ProposalRoomPage, ProposalViewFrame } from "./types";

const STILL_MAX_HEIGHT_MM = 118;
const STILL_MIN_HEIGHT_MM = 48;
const TITLE_MM = 14;
const SECTION_TITLE_MM = 6;
const ROW_MM = 5;
const ROWS_TAIL_MM = 3;
const SUBTOTAL_MM = 12;
const FOOTER_MM = 10;
const MAX_FINISH_ROWS = 8;
const INTERIOR_MARK = /^I\d+$/;

/** Cabinets one per line with their mark; the per-surface finish lines fold into one row. */
export function roomLineRows(
  layout: ProposalPdfLayout,
  proposal: ProposalDocument,
  lines: ProposalCabinetLine[],
): Array<{ left: string; right: string }> {
  const itemized = proposal.priceDetail === "itemized";
  const price = (amount: number) => (itemized ? pdfMoney(layout, proposal, amount) : "Included");
  const rows: Array<{ left: string; right: string }> = [];
  let finishes = 0;
  let finishAmount = 0;
  for (const line of lines) {
    if (INTERIOR_MARK.test(line.mark)) {
      finishes += 1;
      finishAmount += line.sellPrice;
      continue;
    }
    rows.push({ left: `${line.mark} · ${line.name}`, right: price(line.sellPrice) });
  }
  if (finishes) {
    rows.push({
      left: `${finishes} room finish${finishes === 1 ? "" : "es"} (floor, ceiling, walls)`,
      right: price(finishAmount),
    });
  }
  return rows;
}

/** Keep the first rows that fit and fold the rest into one "+n more items" row with their sum. */
function foldRows(
  layout: ProposalPdfLayout,
  proposal: ProposalDocument,
  rows: Array<{ left: string; right: string }>,
  lines: ProposalCabinetLine[],
  maxRows: number,
): Array<{ left: string; right: string }> {
  if (rows.length <= maxRows) return rows;
  const keep = Math.max(1, maxRows - 1);
  const shown = new Set(rows.slice(0, keep).map((row) => row.left.split(" · ")[0]));
  const rest = lines.filter((line) => !shown.has(line.mark));
  const amount = rest.reduce((sum, line) => sum + line.sellPrice, 0);
  return [
    ...rows.slice(0, keep),
    {
      left: `+${rest.length} more item${rest.length === 1 ? "" : "s"}`,
      right: proposal.priceDetail === "itemized" ? pdfMoney(layout, proposal, amount) : "Included",
    },
  ];
}

async function drawStill(layout: ProposalPdfLayout, frame: ProposalViewFrame | null, y: number, maxHeight: number): Promise<number> {
  const { doc, margin, contentWidth } = layout;
  const image = frame ? await optimizeSceneImage(frame.dataUrl) : null;
  if (!image) {
    fill(doc, INK.card);
    doc.roundedRect(margin, y, contentWidth, 24, 2, 2, "F");
    setType(layout, 9, INK.muted);
    writeText(layout, "View not captured yet", margin + 4, y + 13);
    return y + 30;
  }
  const aspect = imageAspect(doc, image);
  const width = Math.min(contentWidth, maxHeight * aspect);
  const height = width / aspect;
  doc.addImage(image, imageFormat(image), margin + (contentWidth - width) / 2, y, width, height);
  return y + height + 8;
}

/**
 * One page per printed view (roadmap D3), and exactly one: the still gives way
 * first, then long lists fold, so page counts and labels stay true.
 */
export async function drawRoomPage(
  layout: ProposalPdfLayout,
  proposal: ProposalDocument,
  room: ProposalRoomPage,
  frame: ProposalViewFrame | null,
): Promise<void> {
  const { doc, margin, contentWidth, pageHeight } = layout;
  const finishRows = room.finishes.slice(0, MAX_FINISH_ROWS).map((line) => ({ left: line.name, right: line.role }));
  const fixedMm = TITLE_MM + SECTION_TITLE_MM + ROWS_TAIL_MM + 8
    + (finishRows.length ? SECTION_TITLE_MM + finishRows.length * ROW_MM + ROWS_TAIL_MM : 0)
    + (room.subtotal != null ? SUBTOTAL_MM : 0);
  const budget = pageHeight - margin * 2 - FOOTER_MM - fixedMm;
  let rows = roomLineRows(layout, proposal, room.cabinets);
  let stillMax = Math.min(STILL_MAX_HEIGHT_MM, budget - rows.length * ROW_MM);
  if (stillMax < STILL_MIN_HEIGHT_MM) {
    stillMax = STILL_MIN_HEIGHT_MM;
    rows = foldRows(layout, proposal, rows, room.cabinets, Math.floor((budget - stillMax) / ROW_MM));
  }
  let y = newPage(layout);
  setType(layout, 18, INK.title, "bold");
  writeText(layout, room.roomName, margin, y + 6, { maxChars: 40 });
  setType(layout, 8, INK.muted);
  writeText(layout, room.viewName, margin + contentWidth, y + 6, { align: "right", maxChars: 48 });
  y += TITLE_MM;
  y = await drawStill(layout, frame, y, stillMax);
  if (rows.length) {
    y = drawProposalSectionTitle(layout, y, "In this room");
    y = drawRows(layout, y, rows);
  } else {
    setType(layout, 8.5, INK.muted);
    writeText(
      layout,
      proposal.staleDisclosed ? "Itemized pricing follows in the revised quote." : "No priced joinery in this room.",
      margin,
      y + 2,
    );
    y += 10;
  }
  if (finishRows.length) {
    y = drawProposalSectionTitle(layout, y, "Finishes here");
    y = drawRows(layout, y, finishRows);
  }
  if (room.subtotal != null && rows.length) {
    stroke(doc, INK.rule);
    doc.line(margin, y, margin + contentWidth, y);
    y += 6;
    setType(layout, 10, INK.title, "bold");
    writeText(layout, "Room subtotal", margin, y);
    writeText(layout, pdfMoney(layout, proposal, room.subtotal), margin + contentWidth, y, { align: "right" });
  }
  drawPageFooter(layout, proposal.brand.name, `Page ${doc.getNumberOfPages()}`);
}
