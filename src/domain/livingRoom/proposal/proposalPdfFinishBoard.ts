import {
  drawPageFooter,
  INK,
  fill,
  hexToRgb,
  newPage,
  setType,
  stroke,
  writeText,
  type ProposalPdfLayout,
} from "./proposalPdfTheme";
import type { ProposalDocument, ProposalMaterialLine } from "./types";

const COLUMNS = 3;
const GAP_MM = 6;
const SWATCH_MM = 24;
const CELL_MM = 46;

/** Title kept verbatim: the visual verification looks for it. */
export const FINISH_BOARD_TITLE = "Materials and finishes";

function drawSwatch(layout: ProposalPdfLayout, line: ProposalMaterialLine, x: number, y: number, width: number) {
  const { doc } = layout;
  const rgb = hexToRgb(line.color);
  fill(doc, rgb ?? INK.card);
  stroke(doc, INK.rule);
  doc.roundedRect(x, y, width, SWATCH_MM, 2, 2, rgb ? "F" : "FD");
  setType(layout, 9, INK.title, "bold");
  writeText(layout, line.name, x, y + SWATCH_MM + 6, { maxChars: 30 });
  setType(layout, 8, INK.muted);
  writeText(layout, line.role, x, y + SWATCH_MM + 11, { maxChars: 32 });
  if (line.rooms?.length) {
    setType(layout, 7.5, INK.faint);
    writeText(layout, roomsLabel(line.rooms, 34), x, y + SWATCH_MM + 16);
  }
}

/** "Foyer, Living, Kitchen +4": whole room names only, never a cut-off word. */
export function roomsLabel(rooms: readonly string[], maxChars: number): string {
  let label = "";
  for (let index = 0; index < rooms.length; index += 1) {
    const next = label ? `${label}, ${rooms[index]}` : rooms[index]!;
    const rest = rooms.length - index - 1;
    const suffix = rest ? ` +${rest}` : "";
    if (next.length + suffix.length > maxChars && index > 0) return `${label} +${rooms.length - index}`;
    label = next;
  }
  return label;
}

/** Finish board (roadmap D3): one swatch per finish, its colour, name, role and where it is used. */
export function drawFinishBoardPage(layout: ProposalPdfLayout, proposal: ProposalDocument): void {
  const { doc, margin, contentWidth } = layout;
  let y = newPage(layout);
  setType(layout, 18, INK.title, "bold");
  writeText(layout, FINISH_BOARD_TITLE, margin, y + 6);
  y += 18;
  if (!proposal.materials.length) {
    setType(layout, 8.5, INK.muted);
    writeText(layout, "Finishes are confirmed at order.", margin, y);
  }
  const cell = (contentWidth - GAP_MM * (COLUMNS - 1)) / COLUMNS;
  proposal.materials.forEach((line, index) => {
    const column = index % COLUMNS;
    const row = Math.floor(index / COLUMNS);
    drawSwatch(layout, line, margin + column * (cell + GAP_MM), y + row * CELL_MM, cell);
  });
  drawPageFooter(layout, proposal.brand.name, `Page ${doc.getNumberOfPages()}`);
}
