import { appendLedgerAudit } from "./audit";
import { clampInstalment } from "./clamp";
import { createLedgerId, money, nowIso } from "./ids";
import type {
  ActorStamp,
  PaymentInstalment,
  PaymentLedgerState,
  PaymentSchedule,
} from "./types";

export function setPaymentSchedule(
  state: PaymentLedgerState,
  args: {
    documentId: string;
    instalments: Array<Partial<PaymentInstalment>>;
    stamp: ActorStamp;
  },
): { state: PaymentLedgerState; schedule: PaymentSchedule } {
  const doc = state.documents.find((d) => d.id === args.documentId);
  if (!doc || doc.superseded) {
    throw new Error("Schedule requires a non-superseded commercial document.");
  }
  const at = nowIso(args.stamp.at);
  const instalments = args.instalments
    .map((item) => clampInstalment(item))
    .filter((item): item is PaymentInstalment => Boolean(item));
  const sum = money(instalments.reduce((s, i) => s + i.amount, 0));
  if (sum > doc.total) {
    throw new Error("Schedule instalments exceed document total.");
  }
  const existing = state.schedules.find((s) => s.documentId === args.documentId);
  const schedule: PaymentSchedule = {
    id: existing?.id ?? createLedgerId("sched"),
    documentId: args.documentId,
    instalments,
    createdAt: existing?.createdAt ?? at,
    updatedAt: at,
  };
  const schedules = existing
    ? state.schedules.map((s) => (s.id === existing.id ? schedule : s))
    : [...state.schedules, schedule];
  const next = appendLedgerAudit(
    { ...state, schedules },
    {
      at,
      actor: args.stamp.actor,
      action: "schedule_set",
      documentId: args.documentId,
      reason: args.stamp.reason,
      detail: `${instalments.length} instalments`,
      instalmentIds: instalments.map((i) => i.id),
    },
  );
  return { state: next, schedule };
}
