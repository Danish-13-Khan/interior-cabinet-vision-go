export type JobStatus = "draft" | "quoted" | "approved" | "production";

export type ProjectJobMeta = {
  customerName: string;
  projectNumber: string;
  revision: string;
  status: JobStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
  quotedAt?: string;
  approvedAt?: string;
  productionAt?: string;
};

export const JOB_STATUS_OPTIONS: Array<{ value: JobStatus; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "quoted", label: "Quoted" },
  { value: "approved", label: "Approved" },
  { value: "production", label: "Production" },
];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  draft: "Draft",
  quoted: "Quoted",
  approved: "Approved",
  production: "Production",
};

export function createDefaultJobMeta(
  overrides: Partial<ProjectJobMeta> = {},
): ProjectJobMeta {
  const now = new Date().toISOString();
  return {
    customerName: "",
    projectNumber: "",
    revision: "A",
    status: "draft",
    notes: "",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function clampJobMeta(
  meta: Partial<ProjectJobMeta> | undefined,
): ProjectJobMeta {
  const seed = createDefaultJobMeta(meta ?? {});
  const status = JOB_STATUS_OPTIONS.some((option) => option.value === seed.status)
    ? seed.status
    : "draft";

  return {
    customerName: String(seed.customerName ?? "").trim(),
    projectNumber: String(seed.projectNumber ?? "").trim(),
    revision: String(seed.revision ?? "A").trim() || "A",
    status,
    notes: String(seed.notes ?? "").trim(),
    createdAt: seed.createdAt || new Date().toISOString(),
    updatedAt: seed.updatedAt || new Date().toISOString(),
    quotedAt: seed.quotedAt || undefined,
    approvedAt: seed.approvedAt || undefined,
    productionAt: seed.productionAt || undefined,
  };
}

export function patchJobMeta(
  current: ProjectJobMeta | undefined,
  patch: Partial<ProjectJobMeta>,
): ProjectJobMeta {
  const base = clampJobMeta(current);
  const nextStatus = patch.status ?? base.status;
  const now = new Date().toISOString();
  const next = clampJobMeta({
    ...base,
    ...patch,
    status: nextStatus,
    updatedAt: now,
  });

  if (nextStatus === "quoted" && !next.quotedAt) {
    next.quotedAt = now;
  }
  if (nextStatus === "approved" && !next.approvedAt) {
    next.approvedAt = now;
  }
  if (nextStatus === "production" && !next.productionAt) {
    next.productionAt = now;
  }

  return next;
}

export function formatJobTitle(job: ProjectJobMeta, fallback = "Cabinet Project") {
  const number = job.projectNumber.trim();
  const customer = job.customerName.trim();
  if (number && customer) return `${number} · ${customer}`;
  if (number) return number;
  if (customer) return customer;
  return fallback;
}

export function formatJobSubtitle(job: ProjectJobMeta) {
  return `Rev ${job.revision} · ${JOB_STATUS_LABELS[job.status]}`;
}
