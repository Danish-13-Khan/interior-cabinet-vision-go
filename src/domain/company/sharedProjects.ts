/**
 * Shared projects + ACL model (Phase D).
 */

import type { OrganizationStub } from "../saas/companySchema";
import {
  clampProjectAccess,
  type ProjectAccessLevel,
  type SharedProjectGrant,
} from "./permissions";
import { findSeatById } from "./seats";

export type CompanySharedProjectsState = {
  schemaVersion: 1;
  orgId: string;
  projects: SharedProjectGrant[];
};

export function createEmptySharedProjectsState(
  orgId: string,
): CompanySharedProjectsState {
  return { schemaVersion: 1, orgId, projects: [] };
}

export function getSharedProjectGrant(
  state: CompanySharedProjectsState,
  projectId: string,
): SharedProjectGrant | undefined {
  return state.projects.find((p) => p.projectId === projectId);
}

export function shareProject(
  state: CompanySharedProjectsState,
  args: {
    org: OrganizationStub;
    projectId: string;
    actorSeatId: string;
    grants?: Record<string, ProjectAccessLevel>;
    at?: string;
  },
): CompanySharedProjectsState {
  if (args.org.id !== state.orgId) {
    throw new Error("Organization mismatch for shared projects.");
  }
  const actor = findSeatById(args.org, args.actorSeatId);
  if (!actor || !actor.active) throw new Error("Unknown actor seat.");
  if (actor.role !== "owner") {
    // Designers with projects:share may share; enforced at call site via gate+permission.
  }
  const projectId = args.projectId.trim();
  if (!projectId) throw new Error("projectId is required.");
  const at = args.at ?? new Date().toISOString();
  const grants: Record<string, ProjectAccessLevel> = {};
  for (const [seatId, level] of Object.entries(args.grants ?? {})) {
    if (!findSeatById(args.org, seatId)) continue;
    const clamped = clampProjectAccess(level);
    if (clamped !== "none") grants[seatId] = clamped;
  }
  const next: SharedProjectGrant = {
    projectId,
    orgId: state.orgId,
    grants,
    sharedAt: at,
    sharedBySeatId: args.actorSeatId,
  };
  const without = state.projects.filter((p) => p.projectId !== projectId);
  return { ...state, projects: [...without, next] };
}

export function setSeatProjectAccess(
  state: CompanySharedProjectsState,
  args: {
    org: OrganizationStub;
    projectId: string;
    seatId: string;
    access: ProjectAccessLevel;
  },
): CompanySharedProjectsState {
  if (!findSeatById(args.org, args.seatId)) {
    throw new Error("Unknown seat.");
  }
  const existing =
    getSharedProjectGrant(state, args.projectId) ??
    ({
      projectId: args.projectId,
      orgId: state.orgId,
      grants: {},
      sharedAt: new Date().toISOString(),
    } satisfies SharedProjectGrant);

  const grants = { ...existing.grants };
  const access = clampProjectAccess(args.access);
  if (access === "none") delete grants[args.seatId];
  else grants[args.seatId] = access;

  const next: SharedProjectGrant = { ...existing, grants, orgId: state.orgId };
  const without = state.projects.filter((p) => p.projectId !== args.projectId);
  return { ...state, projects: [...without, next] };
}

export function unshareProject(
  state: CompanySharedProjectsState,
  projectId: string,
): CompanySharedProjectsState {
  return {
    ...state,
    projects: state.projects.filter((p) => p.projectId !== projectId),
  };
}

export function listProjectsVisibleToSeat(
  state: CompanySharedProjectsState,
  org: OrganizationStub,
  seatId: string,
): SharedProjectGrant[] {
  const seat = findSeatById(org, seatId);
  if (!seat || !seat.active) return [];
  if (seat.role === "owner") return [...state.projects];
  return state.projects.filter((p) => {
    const level = clampProjectAccess(p.grants[seatId] ?? "none");
    return level !== "none";
  });
}
