import type { PremiumAuditRow } from "./premiumAuditTypes";
import { csvMinimalCell } from "../../utils/csvSafe";

/** CSV export stub for richer audit reporting. */
export function premiumAuditToCsv(rows: PremiumAuditRow[]): string {
  const header = [
    "at",
    "actor",
    "source",
    "kind",
    "summary",
    "projectId",
    "documentId",
    "paymentId",
    "quoteSnapshotId",
    "reason",
  ];
  const lines = rows.map((r) =>
    [
      r.at,
      r.actor,
      r.source,
      r.kind,
      r.summary,
      r.projectId,
      r.documentId,
      r.paymentId,
      r.quoteSnapshotId,
      r.reason,
    ]
      .map(csvMinimalCell)
      .join(","),
  );
  return [header.join(","), ...lines].join("\n");
}
