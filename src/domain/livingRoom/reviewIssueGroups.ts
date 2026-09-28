/** Review step: collapse per-object plan and model issues into grouped rows. */

import type { InteriorProject } from "../interiorProject";
import type { ModelQualityIssue } from "./modelQualityFeedback";
import { isBlockingLivingRoomPlanIssue, type LivingRoomPlanIssue } from "./planConstraints";

export type ReviewIssueSeverity = "blocking" | "warning" | "info";

export type ReviewIssueGroup = {
  id: string;
  severity: ReviewIssueSeverity;
  source: "layout" | "model";
  code: string;
  title: string;
  detail: string;
  /** Every object the row selects, in first-seen order. */
  objectIds: string[];
  count: number;
};

const SEVERITY_ORDER: Record<ReviewIssueSeverity, number> = { blocking: 0, warning: 1, info: 2 };

const LAYOUT_LABELS: Record<LivingRoomPlanIssue["code"], string> = {
  "outside-room": "outside the room",
  overlap: "overlapping",
  "opening-clearance": "blocking a door or window",
  circulation: "with tight walkways",
};

type Entry = { key: string; severity: ReviewIssueSeverity; source: ReviewIssueGroup["source"]; code: string;
  message: string; detail: string; objectIds: string[] };

function stripObjectPrefix(title: string, names: readonly string[]): string {
  for (const name of names) {
    if (title.startsWith(`${name}: `)) return title.slice(name.length + 2);
    if (title.endsWith(` · ${name}`)) return title.slice(0, -(name.length + 3));
  }
  return title;
}

/** Same sentence with differing numbers → one sentence with "a–b" ranges. */
export function mergeNumericMessages(messages: readonly string[]): string {
  if (messages.length === 0) return "";
  const split = messages.map((message) => message.split(/(\d+(?:\.\d+)?)/));
  const shape = (parts: string[]) => parts.filter((_, index) => index % 2 === 0).join("#");
  if (split.some((parts) => shape(parts) !== shape(split[0]!))) return messages[0]!;
  return split[0]!.map((part, index) => {
    if (index % 2 === 0) return part;
    const values = split.map((parts) => Number(parts[index]));
    const min = Math.min(...values);
    const max = Math.max(...values);
    return min === max ? part : `${min}–${max}`;
  }).join("");
}

function nounFor(project: InteriorProject, objectIds: readonly string[]): string {
  const objects = project.objects.filter((object) => objectIds.includes(object.id));
  const cabinets = objects.length > 0 && objects.every((object) => object.kind === "cabinet");
  const noun = cabinets ? "cabinet" : "object";
  return `${objectIds.length} ${noun}${objectIds.length === 1 ? "" : "s"}`;
}

export function groupReviewIssues(
  project: InteriorProject,
  layout: readonly LivingRoomPlanIssue[],
  model: readonly ModelQualityIssue[],
): ReviewIssueGroup[] {
  const names = project.objects.map((object) => object.name).sort((a, b) => b.length - a.length);
  const entries: Entry[] = [
    ...layout.map((issue): Entry => {
      const severity = isBlockingLivingRoomPlanIssue(issue) ? "blocking" : "warning";
      return { key: `layout:${issue.code}:${severity}`, severity, source: "layout", code: issue.code,
        message: issue.message, detail: "Layout check", objectIds: issue.objectIds };
    }),
    ...model.map((issue): Entry => {
      const severity = issue.blocking ? "blocking" : issue.severity === "info" ? "info" : "warning";
      return { key: `model:${issue.code}:${severity}`, severity, source: "model", code: issue.code,
        message: stripObjectPrefix(issue.title, names), detail: issue.detail,
        objectIds: issue.objectId ? [issue.objectId] : [] };
    }),
  ];
  const buckets = new Map<string, Entry[]>();
  for (const entry of entries) buckets.set(entry.key, [...(buckets.get(entry.key) ?? []), entry]);
  const groups = [...buckets.entries()].map(([key, items]): ReviewIssueGroup => {
    const first = items[0]!;
    const objectIds = [...new Set(items.flatMap((item) => item.objectIds))];
    const single = items.length === 1;
    const title = first.source === "layout"
      ? single ? first.message : `${nounFor(project, objectIds)} ${LAYOUT_LABELS[first.code as LivingRoomPlanIssue["code"]]}`
      : single ? issueTitleWithName(project, first) : `${nounFor(project, objectIds)}: ${mergeNumericMessages(items.map((item) => item.message))}`;
    return { id: key, severity: first.severity, source: first.source, code: first.code, title,
      detail: first.detail, objectIds, count: items.length };
  });
  return groups.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || b.count - a.count);
}

function issueTitleWithName(project: InteriorProject, entry: Entry): string {
  const name = project.objects.find((object) => object.id === entry.objectIds[0])?.name;
  return name ? `${name}: ${entry.message}` : entry.message;
}

export function reviewIssueCounts(groups: readonly ReviewIssueGroup[]) {
  const sum = (severity: ReviewIssueSeverity) =>
    groups.filter((group) => group.severity === severity).reduce((total, group) => total + group.count, 0);
  return { blocking: sum("blocking"), warnings: sum("warning"), notes: sum("info") };
}
