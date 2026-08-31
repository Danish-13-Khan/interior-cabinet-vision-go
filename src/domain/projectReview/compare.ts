import type {
  RevisionChangeEntry,
  RevisionCompareResult,
  RevisionFingerprint,
  RevisionSnapshot,
} from "./types";

function setDiff(left: string[], right: string[]) {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const added = right.filter((item) => !leftSet.has(item));
  const removed = left.filter((item) => !rightSet.has(item));
  return { added, removed };
}

export function buildChangeLogFromFingerprints(
  previous: RevisionFingerprint | null | undefined,
  next: RevisionFingerprint,
): RevisionChangeEntry[] {
  if (!previous) {
    return [
      {
        kind: "other",
        summary: `Initial revision fingerprint · ${next.cabinetCount} cabinets · ${next.partLineCount} parts`,
      },
    ];
  }

  const changes: RevisionChangeEntry[] = [];
  if (previous.cabinetCount !== next.cabinetCount) {
    changes.push({
      kind: "cabinets",
      summary: `Cabinet count ${previous.cabinetCount} → ${next.cabinetCount}`,
    });
  }
  const cabinetDiff = setDiff(previous.cabinetNames, next.cabinetNames);
  if (cabinetDiff.added.length > 0) {
    changes.push({
      kind: "cabinets",
      summary: `Added cabinets: ${cabinetDiff.added.slice(0, 6).join(", ")}${
        cabinetDiff.added.length > 6 ? "…" : ""
      }`,
    });
  }
  if (cabinetDiff.removed.length > 0) {
    changes.push({
      kind: "cabinets",
      summary: `Removed cabinets: ${cabinetDiff.removed.slice(0, 6).join(", ")}${
        cabinetDiff.removed.length > 6 ? "…" : ""
      }`,
    });
  }
  if (previous.roomCount !== next.roomCount) {
    changes.push({
      kind: "rooms",
      summary: `Room count ${previous.roomCount} → ${next.roomCount}`,
    });
  }
  if (previous.partLineCount !== next.partLineCount) {
    changes.push({
      kind: "materials",
      summary: `Part lines ${previous.partLineCount} → ${next.partLineCount}`,
    });
  }
  const materialDiff = setDiff(previous.materialKeys, next.materialKeys);
  if (materialDiff.added.length > 0 || materialDiff.removed.length > 0) {
    changes.push({
      kind: "materials",
      summary: `Material mix changed (+${materialDiff.added.length} / −${materialDiff.removed.length})`,
    });
  }
  if (previous.workshopTotal !== next.workshopTotal) {
    changes.push({
      kind: "cost",
      summary: `Workshop total ₹${previous.workshopTotal.toLocaleString()} → ₹${next.workshopTotal.toLocaleString()}`,
    });
  }
  if (previous.sellTotal !== next.sellTotal) {
    changes.push({
      kind: "cost",
      summary: `Sell total ₹${previous.sellTotal.toLocaleString()} → ₹${next.sellTotal.toLocaleString()}`,
    });
  }
  if (
    previous.errorCount !== next.errorCount ||
    previous.warningCount !== next.warningCount ||
    previous.blockerCount !== next.blockerCount
  ) {
    changes.push({
      kind: "issues",
      summary: `Issues blockers ${previous.blockerCount}→${next.blockerCount}, errors ${previous.errorCount}→${next.errorCount}, warnings ${previous.warningCount}→${next.warningCount}`,
    });
  }

  if (changes.length === 0) {
    changes.push({
      kind: "other",
      summary: "No measurable layout/cost/issue deltas vs previous revision",
    });
  }
  return changes;
}

export function compareRevisionFingerprints(
  left: RevisionFingerprint,
  right: RevisionFingerprint,
  leftLabel: string,
  rightLabel: string,
): RevisionCompareResult {
  return {
    leftLabel,
    rightLabel,
    left,
    right,
    changes: buildChangeLogFromFingerprints(left, right),
  };
}

export function compareRevisionSnapshots(
  left: RevisionSnapshot,
  right: RevisionSnapshot,
): RevisionCompareResult {
  return compareRevisionFingerprints(
    left.fingerprint,
    right.fingerprint,
    `Rev ${left.revision}`,
    `Rev ${right.revision}`,
  );
}

export function revisionFingerprintsEqual(
  left: RevisionFingerprint,
  right: RevisionFingerprint,
): boolean {
  return (
    left.cabinetCount === right.cabinetCount
    && left.roomCount === right.roomCount
    && left.partLineCount === right.partLineCount
    && left.workshopTotal === right.workshopTotal
    && left.sellTotal === right.sellTotal
    && left.errorCount === right.errorCount
    && left.warningCount === right.warningCount
    && left.blockerCount === right.blockerCount
    && left.cabinetNames.join("\0") === right.cabinetNames.join("\0")
    && left.materialKeys.join("\0") === right.materialKeys.join("\0")
  );
}
