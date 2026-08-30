import type { CabinetProject } from "../../cabinetDimensions";
import {
  compareRevisionFingerprints,
  createRevisionFingerprint,
} from "../../projectReview";
import { createHandoffDesignFingerprint } from "./handoffDesignFingerprint";
import { readProjectHandoffRecord } from "./handoffState";
import type { PostApprovalDrift } from "./types";

const EMPTY: PostApprovalDrift = {
  handedOff: false,
  drifted: false,
  revision: null,
  summary: "Not yet handed off to Engineering.",
  changes: [],
};

export function evaluatePostApprovalDrift(project: CabinetProject): PostApprovalDrift {
  const record = readProjectHandoffRecord(project);
  if (!record) return EMPTY;
  const live = createRevisionFingerprint(project);
  const compare = compareRevisionFingerprints(
    record.fingerprint,
    live,
    `Rev ${record.revision}`,
    "Live",
  );
  const meaningful = compare.changes.filter((change) =>
    change.kind !== "other" || !change.summary.startsWith("No measurable"),
  );
  const fingerprintDrifted = meaningful.some((change) => change.kind !== "other");
  const liveDesign = createHandoffDesignFingerprint(project);
  const designDrifted = Boolean(record.designFingerprint)
    && record.designFingerprint !== liveDesign;
  const changes = designDrifted
    ? [
      ...compare.changes,
      {
        kind: "cabinets" as const,
        summary: "Design content (placement or configuration) changed.",
      },
    ]
    : compare.changes;
  const drifted = fingerprintDrifted || designDrifted;
  return {
    handedOff: true,
    drifted,
    revision: record.revision,
    summary: drifted
      ? `Post-approval drift vs Rev ${record.revision}: ${
        [
          ...meaningful.map((change) => change.summary),
          ...(designDrifted && !fingerprintDrifted
            ? ["Design content (placement or configuration) changed."]
            : []),
        ].join(" · ")
      }`
      : `Matches approved Rev ${record.revision}`,
    changes,
  };
}
