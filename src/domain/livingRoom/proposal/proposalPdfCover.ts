import { optimizeSceneImage } from "../../pdfExport/helpers";
import { drawCard } from "./proposalPdfDraw";
import {
  INK,
  fill,
  imageAspect,
  imageFormat,
  setType,
  writeText,
  type ProposalPdfLayout,
} from "./proposalPdfTheme";
import type { ProposalDocument, ProposalViewFrame } from "./types";

/** Hero still height ceiling; a 16:9 still at content width is 102 mm. */
const HERO_MAX_HEIGHT_MM = 130;
const LOGO_HEIGHT_MM = 14;
const LOGO_MAX_WIDTH_MM = 44;

function drawBrandBand(layout: ProposalPdfLayout, proposal: ProposalDocument, y: number): number {
  const { doc, margin } = layout;
  let x = margin;
  const logo = proposal.brand.logoDataUrl;
  if (logo) {
    const width = Math.min(LOGO_MAX_WIDTH_MM, LOGO_HEIGHT_MM * imageAspect(doc, logo, 1));
    try {
      doc.addImage(logo, imageFormat(logo), x, y, width, LOGO_HEIGHT_MM);
      x += width + 5;
    } catch {
      /* an unreadable logo is left out, never a broken page */
    }
  }
  setType(layout, 10, INK.muted, "bold");
  writeText(layout, proposal.brand.name.toUpperCase(), x, y + 5.5, { maxChars: 48 });
  if (proposal.brand.contact) {
    setType(layout, 8, INK.faint);
    writeText(layout, proposal.brand.contact, x, y + 11, { maxChars: 90 });
  }
  return y + LOGO_HEIGHT_MM + 10;
}

/** Without a hero still the cover opens on the dark band, so the page never starts blank. */
function drawDarkBand(layout: ProposalPdfLayout, proposal: ProposalDocument) {
  const { doc, margin, pageWidth } = layout;
  fill(doc, INK.band);
  doc.rect(0, 0, pageWidth, 28, "F");
  setType(layout, 10, INK.bandText, "bold");
  writeText(layout, proposal.brand.name.toUpperCase(), margin, 11, { maxChars: 48 });
  if (proposal.brand.contact) {
    setType(layout, 8, INK.bandText);
    writeText(layout, proposal.brand.contact, margin, 19, { maxChars: 90 });
  }
}

async function drawHero(layout: ProposalPdfLayout, frame: ProposalViewFrame | null): Promise<number | null> {
  if (!frame) return null;
  const { doc, margin, contentWidth } = layout;
  const image = await optimizeSceneImage(frame.dataUrl);
  if (!image) return null;
  const aspect = imageAspect(doc, image);
  const width = Math.min(contentWidth, HERO_MAX_HEIGHT_MM * aspect);
  const height = width / aspect;
  // Inside the page margin: a still flush with the page edge reads as a clipped image.
  doc.addImage(image, imageFormat(image), margin + (contentWidth - width) / 2, margin, width, height);
  return margin + height + 8;
}

/**
 * Cover (roadmap D3): the hero still, the studio's identity, the customer and
 * project, then quote id, date, validity and revision as cards.
 */
export async function drawCoverPage(
  layout: ProposalPdfLayout,
  proposal: ProposalDocument,
  hero: ProposalViewFrame | null,
): Promise<void> {
  const { margin, contentWidth, pageWidth } = layout;
  let y = await drawHero(layout, hero);
  if (y == null) {
    drawDarkBand(layout, proposal);
    y = 40;
  } else {
    y = drawBrandBand(layout, proposal, y);
  }
  setType(layout, 24, INK.title, "bold");
  writeText(layout, proposal.draft ? "Draft Proposal" : "Proposal", margin, y + 8);
  if (proposal.draft || proposal.staleDisclosed) {
    setType(layout, 9, INK.warn, "bold");
    writeText(
      layout,
      proposal.draft ? "DRAFT — not a frozen quote" : "STALE — live design differs",
      pageWidth - margin,
      y + 8,
      { align: "right" },
    );
  }
  y += 20;
  setType(layout, 16, INK.title);
  writeText(layout, proposal.customerName, margin, y, { maxChars: 42 });
  y += 7;
  setType(layout, 9, INK.muted);
  writeText(
    layout,
    [proposal.projectNumber, proposal.projectName].filter((part) => part.trim()).join(" · "),
    margin,
    y,
    { maxChars: 90 },
  );
  y += 10;
  const card = (contentWidth - 12) / 4;
  const valid = proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString() : "No expiry disclosed";
  drawCard(layout, margin, y, card, "Quote", proposal.quoteSnapshotId);
  drawCard(layout, margin + card + 4, y, card, "Date", new Date(proposal.proposalDate).toLocaleDateString());
  drawCard(layout, margin + (card + 4) * 2, y, card, "Valid until", valid);
  drawCard(layout, margin + (card + 4) * 3, y, card, "Revision", `Rev ${proposal.revision}`);
  y += 24;
  setType(layout, 8.5, INK.muted);
  const rooms = proposal.rooms.length;
  writeText(
    layout,
    rooms
      ? `${rooms} room${rooms === 1 ? "" : "s"} · finishes · price · approval`
      : "Finishes · price · approval",
    margin,
    y,
  );
}
