/**
 * Local persistence for Company controls (shared projects + approvals).
 * Seats live on account.organization (A0); org price book in priceBook store.
 */

import { defaultStorage, type StorageLike } from "../saas/accountTypes";
import {
  createEmptyApprovalsState,
  type CompanyApprovalsState,
} from "./approvals";
import {
  createEmptySharedProjectsState,
  type CompanySharedProjectsState,
} from "./sharedProjects";

export const COMPANY_CONTROLS_STORAGE_KEY = "cabinet-studio-company-controls-v1";

export type CompanyControlsState = {
  schemaVersion: 1;
  orgId: string;
  sharedProjects: CompanySharedProjectsState;
  approvals: CompanyApprovalsState;
  updatedAt: string;
};

export function createEmptyCompanyControls(orgId: string): CompanyControlsState {
  return {
    schemaVersion: 1,
    orgId,
    sharedProjects: createEmptySharedProjectsState(orgId),
    approvals: createEmptyApprovalsState(orgId),
    updatedAt: new Date().toISOString(),
  };
}

function clampControls(
  value: Partial<CompanyControlsState> | null | undefined,
  orgId: string,
): CompanyControlsState {
  const base = createEmptyCompanyControls(orgId);
  if (!value || value.orgId !== orgId) return base;
  return {
    schemaVersion: 1,
    orgId,
    sharedProjects: {
      schemaVersion: 1,
      orgId,
      projects: Array.isArray(value.sharedProjects?.projects)
        ? value.sharedProjects!.projects
        : [],
    },
    approvals: {
      schemaVersion: 1,
      orgId,
      requests: Array.isArray(value.approvals?.requests)
        ? value.approvals!.requests
        : [],
    },
    updatedAt:
      typeof value.updatedAt === "string"
        ? value.updatedAt
        : base.updatedAt,
  };
}

export function readCompanyControls(
  orgId: string,
  storage: StorageLike | null = defaultStorage(),
): CompanyControlsState {
  if (!storage || !orgId) return createEmptyCompanyControls(orgId || "org-local");
  try {
    const raw = storage.getItem(COMPANY_CONTROLS_STORAGE_KEY);
    if (!raw) return createEmptyCompanyControls(orgId);
    return clampControls(JSON.parse(raw) as Partial<CompanyControlsState>, orgId);
  } catch {
    return createEmptyCompanyControls(orgId);
  }
}

export function persistCompanyControls(
  state: CompanyControlsState,
  storage: StorageLike | null = defaultStorage(),
): CompanyControlsState {
  const next: CompanyControlsState = {
    ...state,
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
  };
  if (storage) {
    storage.setItem(COMPANY_CONTROLS_STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function clearCompanyControls(
  storage: StorageLike | null = defaultStorage(),
): void {
  storage?.removeItem(COMPANY_CONTROLS_STORAGE_KEY);
}
