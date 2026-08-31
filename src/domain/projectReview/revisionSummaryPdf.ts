import { jsPDF } from "jspdf";
import type { CabinetProject } from "../cabinetDimensions";
import {
  clampJobMeta,
  formatJobSubtitle,
  formatJobTitle,
  JOB_STATUS_LABELS,
} from "../jobMeta";
import { compareRevisionFingerprints } from "./compare";
import { createRevisionFingerprint } from "./fingerprint";
import { getProjectReviewState } from "./operations";
import type { RevisionSnapshot } from "./types";

function ensurePageSpace(
  doc: jsPDF,
  y: number,
  needed: number,
  pageHeight: number,
  margin: number,
) {
  if (y + needed <= pageHeight - margin) return y;
  doc.addPage();
  return margin;
}

export function buildRevisionSummaryLines(
  project: CabinetProject,
  snapshots: RevisionSnapshot[] = getProjectReviewState(project).history,
): string[] {
  const job = clampJobMeta(project.job);
  const lines = [
    `${formatJobTitle(job)} · ${formatJobSubtitle(job)}`,
    `Current status: ${JOB_STATUS_LABELS[job.status]} · Rev ${job.revision}`,
    `Revision snapshots: ${snapshots.length}`,
  ];
  for (const snap of snapshots.slice(0, 12)) {
    lines.push(
      `Rev ${snap.revision} · ${new Date(snap.createdAt).toLocaleString()} · ${JOB_STATUS_LABELS[snap.status]} · cabinets ${snap.fingerprint.cabinetCount} · sell ₹${snap.fingerprint.sellTotal.toLocaleString()}${snap.releasedForProduction ? " · RELEASED" : ""}${snap.productionFingerprint ? ` · ${snap.productionFingerprint}` : ""}`,
    );
    for (const change of snap.changeLog.slice(0, 4)) {
      lines.push(`  • ${change.summary}`);
    }
  }
  return lines;
}

/** Printable revision / approval summary PDF (separate from full packet). */
export async function exportRevisionSummaryPdf(
  project: CabinetProject,
): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 14;
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = margin;

  const job = clampJobMeta(project.job);
  const review = getProjectReviewState(project);
  const current = createRevisionFingerprint(project, review.notes);

  doc.setFontSize(16);
  doc.setTextColor(28, 39, 51);
  doc.text("Revision & Approval Summary", margin, y);
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(70, 85, 100);
  doc.text(formatJobTitle(job), margin, y);
  y += 5;
  doc.text(formatJobSubtitle(job), margin, y);
  y += 8;

  doc.setFontSize(11);
  doc.setTextColor(34, 44, 59);
  doc.text("Current fingerprint", margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);
  const currentLines = [
    `Cabinets ${current.cabinetCount} · Rooms ${current.roomCount} · Parts ${current.partLineCount}`,
    `Workshop ₹${current.workshopTotal.toLocaleString()} · Sell ₹${current.sellTotal.toLocaleString()}`,
    `Issues blockers ${current.blockerCount} · errors ${current.errorCount} · warnings ${current.warningCount}`,
  ];
  for (const line of currentLines) {
    y = ensurePageSpace(doc, y, 5, pageHeight, margin);
    doc.text(line, margin, y);
    y += 4.5;
  }

  y += 4;
  doc.setFontSize(11);
  doc.setTextColor(34, 44, 59);
  doc.text("Revision history", margin, y);
  y += 6;
  doc.setFontSize(8.5);
  doc.setTextColor(55, 65, 81);

  if (review.history.length === 0) {
    doc.text("No revision snapshots frozen yet.", margin, y);
    y += 5;
  } else {
    for (const snap of review.history) {
      y = ensurePageSpace(doc, y, 18, pageHeight, margin);
      doc.setFont("helvetica", "bold");
      doc.text(
        `Rev ${snap.revision} · ${JOB_STATUS_LABELS[snap.status]} · ${new Date(snap.createdAt).toLocaleString()}${snap.releasedForProduction ? " · RELEASED" : ""}${snap.productionFingerprint ? ` · ${snap.productionFingerprint}` : ""}`,
        margin,
        y,
      );
      doc.setFont("helvetica", "normal");
      y += 4;
      if (snap.note) {
        doc.text(`Note: ${snap.note}`, margin + 2, y);
        y += 4;
      }
      if (snap.approvedBy) {
        doc.text(`Approved by: ${snap.approvedBy}`, margin + 2, y);
        y += 4;
      }
      if (snap.releaseOverride) {
        doc.text(`Override: ${snap.releaseOverride.reason}`, margin + 2, y);
        y += 4;
      }
      for (const change of snap.changeLog.slice(0, 5)) {
        y = ensurePageSpace(doc, y, 4, pageHeight, margin);
        doc.text(`• ${change.summary}`, margin + 2, y, {
          maxWidth: pageWidth - margin * 2 - 4,
        });
        y += 4;
      }
      y += 2;
    }
  }

  if (review.history[0]) {
    const compare = compareRevisionFingerprints(
      review.history[0].fingerprint,
      current,
      `Rev ${review.history[0].revision}`,
      "Current",
    );
    y = ensurePageSpace(doc, y + 2, 16, pageHeight, margin);
    doc.setFontSize(11);
    doc.setTextColor(34, 44, 59);
    doc.text(`Compare ${compare.leftLabel} → ${compare.rightLabel}`, margin, y);
    y += 6;
    doc.setFontSize(8.5);
    doc.setTextColor(55, 65, 81);
    for (const change of compare.changes) {
      y = ensurePageSpace(doc, y, 4, pageHeight, margin);
      doc.text(`• ${change.summary}`, margin, y, {
        maxWidth: pageWidth - margin * 2,
      });
      y += 4;
    }
  }

  const openNotes = review.notes.filter((note) => !note.resolved);
  y = ensurePageSpace(doc, y + 4, 12, pageHeight, margin);
  doc.setFontSize(11);
  doc.setTextColor(34, 44, 59);
  doc.text(`Open review notes (${openNotes.length})`, margin, y);
  y += 6;
  doc.setFontSize(8.5);
  doc.setTextColor(55, 65, 81);
  if (openNotes.length === 0) {
    doc.text("No open review notes.", margin, y);
  } else {
    for (const note of openNotes.slice(0, 20)) {
      y = ensurePageSpace(doc, y, 4, pageHeight, margin);
      doc.text(`[${note.severity}] ${note.message}`, margin, y, {
        maxWidth: pageWidth - margin * 2,
      });
      y += 4;
    }
  }

  return doc.output("blob");
}
