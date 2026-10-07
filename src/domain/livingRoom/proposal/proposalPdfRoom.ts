import { optimizeSceneImage } from "../../pdfExport/helpers";
import { drawProposalSectionTitle, drawRows, pdfMoney } from "./proposalPdfDraw";
import {
  drawPageFooter,
  INK,
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

async function drawStill(layout: ProposalPdfLayout, frame: ProposalViewFrame | null, y: number): Promise<number> {
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
  const width = Math.min(contentWidth, STILL_MAX_HEIGHT_MM * aspect);
  const height = width / aspect;
  doc.addImage(image, imageFormat(image), margin + (contentWidth - width) / 2, y, width, height);
  return y + height + 8;
}

/**
 * One page per printed view (roadmap D3): the room's still at its own aspect,
 * what is in the room with marks, the finishes used there, and the itemized
 * subtotal. Project-wide lines never appear here.
 */
export async function drawRoomPage(
  layout: ProposalPdfLayout,
  proposal: ProposalDocument,
  room: ProposalRoomPage,
  frame: ProposalViewFrame | null,
): Promise<void> {
  const { doc, margin, contentWidth } = layout;
  let y = newPage(layout);
  setType(layout, 18, INK.title, "bold");
  writeText(layout, room.roomName, margin, y + 6, { maxChars: 40 });
  setType(layout, 8, INK.muted);
  writeText(layout, room.viewName, margin + contentWidth, y + 6, { align: "right", maxChars: 48 });
  y += 14;
  y = await drawStill(layout, frame, y);
  if (room.cabinets.length) {
    y = drawProposalSectionTitle(layout, y, "In this room", 12);
    y = drawRows(layout, y, roomLineRows(layout, proposal, room.cabinets));
  } else {
    setType(layout, 8.5, INK.muted);
    writeText(layout, "No priced joinery in this room.", margin, y + 2);
    y += 10;
  }
  if (room.finishes.length) {
    y = drawProposalSectionTitle(layout, y, "Finishes here", 12);
    y = drawRows(layout, y, room.finishes.slice(0, 8).map((line) => ({ left: line.name, right: line.role })));
  }
  if (room.subtotal != null && room.cabinets.length) {
    stroke(doc, INK.rule);
    doc.line(margin, y, margin + contentWidth, y);
    y += 6;
    setType(layout, 10, INK.title, "bold");
    writeText(layout, "Room subtotal", margin, y);
    writeText(layout, pdfMoney(layout, proposal, room.subtotal), margin + contentWidth, y, { align: "right" });
  }
  drawPageFooter(layout, proposal.brand.name, `Page ${doc.getNumberOfPages()}`);
}
