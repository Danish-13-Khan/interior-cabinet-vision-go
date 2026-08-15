import {
  buildStillProvenance,
  type StillProvenance,
} from "../stillJob/provenance";
import type { StillJob } from "../stillJob/types";

export type StillReviewStatus =
  | "idle"
  | "pending_review"
  | "accepted"
  | "rejected"
  | "retry_requested";

export type StillReviewSession = {
  status: StillReviewStatus;
  job: StillJob | null;
  platePath: string | null;
  stillPath: string | null;
  provenance: StillProvenance | null;
  rejectReason: string | null;
};

export function createIdleStillReview(): StillReviewSession {
  return {
    status: "idle",
    job: null,
    platePath: null,
    stillPath: null,
    provenance: null,
    rejectReason: null,
  };
}

export function openStillReview(
  job: StillJob,
  platePath: string | null,
  stillPath: string | null,
): StillReviewSession {
  return {
    status: "pending_review",
    job,
    platePath,
    stillPath,
    provenance: buildStillProvenance(job, "pending", {
      stillOutputPath: stillPath ?? undefined,
      heroPlatePath: platePath ?? undefined,
    }),
    rejectReason: null,
  };
}

export function acceptStillReview(
  session: StillReviewSession,
  acceptedAt: string,
): StillReviewSession {
  if (session.status !== "pending_review" || !session.job) {
    throw new Error("Only a pending StillJob review can be accepted.");
  }
  return {
    ...session,
    status: "accepted",
    provenance: buildStillProvenance(session.job, "accepted", {
      acceptedAt,
      stillOutputPath: session.stillPath ?? undefined,
      heroPlatePath: session.platePath ?? undefined,
    }),
    rejectReason: null,
  };
}

export function rejectStillReview(
  session: StillReviewSession,
  reason = "rejected",
): StillReviewSession {
  if (session.status !== "pending_review" || !session.job) {
    throw new Error("Only a pending StillJob review can be rejected.");
  }
  return {
    ...session,
    status: "rejected",
    provenance: buildStillProvenance(session.job, "rejected", {
      stillOutputPath: session.stillPath ?? undefined,
      heroPlatePath: session.platePath ?? undefined,
    }),
    rejectReason: reason,
  };
}

export function retryStillReview(session: StillReviewSession): StillReviewSession {
  if (!session.job) {
    throw new Error("Retry requires an existing StillJob.");
  }
  return {
    status: "retry_requested",
    job: session.job,
    platePath: session.platePath,
    stillPath: null,
    provenance: null,
    rejectReason: null,
  };
}

export function stillEligibleForPackage(session: StillReviewSession) {
  return session.status === "accepted" && session.provenance?.acceptanceStatus === "accepted";
}
