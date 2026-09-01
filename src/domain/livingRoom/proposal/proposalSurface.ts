import type { ProposalClientPayload, ProposalStaleOverride, ProposalSurfaceState } from "./types";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

export function readFrozenClient(raw: Record<string, unknown> | null): ProposalClientPayload | null {
  if (!raw) return null;
  const snapshotId = text(raw.snapshotId);
  if (!snapshotId) return null;
  return {
    snapshotId,
    cabinets: Array.isArray(raw.cabinets)
      ? raw.cabinets.slice(0, 80).map((item) => {
          const row = asRecord(item);
          return {
            mark: text(row?.mark),
            name: text(row?.name),
            sellPrice: Math.round(Number(row?.sellPrice) || 0),
          };
        })
      : [],
    materials: Array.isArray(raw.materials)
      ? raw.materials.slice(0, 12).map((item) => {
          const row = asRecord(item);
          return { name: text(row?.name), kind: text(row?.kind), role: text(row?.role) };
        })
      : [],
    views: Array.isArray(raw.views)
      ? raw.views.slice(0, 12).map((item) => {
          const row = asRecord(item);
          return {
            cameraId: text(row?.cameraId),
            viewName: text(row?.viewName),
            selected: row?.selected !== false,
          };
        })
      : [],
    summaryLines: Array.isArray(raw.summaryLines)
      ? raw.summaryLines.slice(0, 12).map((item) => {
          const row = asRecord(item);
          return { label: text(row?.label) || "Line", amount: Math.round(Number(row?.amount) || 0) };
        })
      : [],
    sceneFingerprint: text(raw.sceneFingerprint),
    projectContentHash: text(raw.projectContentHash),
  };
}

export function readProposalSurface(raw: Record<string, unknown> | null): ProposalSurfaceState {
  const override = asRecord(raw?.staleOverride);
  const selected = Array.isArray(raw?.selectedViewCameraIds)
    ? raw.selectedViewCameraIds.filter((id): id is string => typeof id === "string")
    : [];
  return {
    selectedViewCameraIds: selected.slice(0, 12),
    staleOverride: override
      ? {
          snapshotId: String(override.snapshotId ?? ""),
          reason: String(override.reason ?? "").trim().slice(0, 200),
          overriddenAt: String(override.overriddenAt ?? ""),
        } satisfies ProposalStaleOverride
      : null,
    frozenClient: readFrozenClient(asRecord(raw?.frozenClient)),
  };
}
