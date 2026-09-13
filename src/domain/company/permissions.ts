/**
 * Shared-project access + role permission checks (Phase D).
 */

import {
  roleHasPermission,
  type CompanyPermission,
  type CompanyRole,
  type OrganizationStub,
  type SeatStub,
} from "../saas/companySchema";
import { findSeatById } from "./seats";

export type ProjectAccessLevel = "none" | "view" | "edit" | "manage";

export const PROJECT_ACCESS_LEVELS: readonly ProjectAccessLevel[] = [
  "none",
  "view",
  "edit",
  "manage",
] as const;

const ACCESS_RANK: Record<ProjectAccessLevel, number> = {
  none: 0,
  view: 1,
  edit: 2,
  manage: 3,
};

export type SharedProjectGrant = {
  projectId: string;
  orgId: string;
  /** seatId → access. Owner seats always resolve to manage. */
  grants: Record<string, ProjectAccessLevel>;
  sharedAt: string;
  sharedBySeatId?: string;
};

export function accessAtLeast(
  actual: ProjectAccessLevel,
  required: ProjectAccessLevel,
): boolean {
  return ACCESS_RANK[actual] >= ACCESS_RANK[required];
}

export function clampProjectAccess(value: unknown): ProjectAccessLevel {
  if (value === "view" || value === "edit" || value === "manage" || value === "none") {
    return value;
  }
  return "none";
}

export function seatHasPermission(
  seat: SeatStub | undefined,
  permission: CompanyPermission,
): boolean {
  if (!seat || !seat.active) return false;
  return roleHasPermission(seat.role, permission);
}

export function resolveProjectAccess(args: {
  org: OrganizationStub;
  grant: SharedProjectGrant | undefined;
  seatId: string;
}): ProjectAccessLevel {
  const seat = findSeatById(args.org, args.seatId);
  if (!seat || !seat.active) return "none";
  if (seat.role === "owner") return "manage";
  if (!args.grant || args.grant.orgId !== args.org.id) return "none";
  return clampProjectAccess(args.grant.grants[seat.id] ?? "none");
}

export function canSeatAccessProject(args: {
  org: OrganizationStub;
  grant: SharedProjectGrant | undefined;
  seatId: string;
  required: ProjectAccessLevel;
}): boolean {
  return accessAtLeast(
    resolveProjectAccess({
      org: args.org,
      grant: args.grant,
      seatId: args.seatId,
    }),
    args.required,
  );
}

/** Role must also hold projects:edit / projects:view for edit/view. */
export function canSeatActOnProject(args: {
  org: OrganizationStub;
  grant: SharedProjectGrant | undefined;
  seatId: string;
  required: ProjectAccessLevel;
}): boolean {
  const seat = findSeatById(args.org, args.seatId);
  if (!seat || !seat.active) return false;
  if (args.required === "manage" && !roleHasPermission(seat.role, "projects:share")) {
    return seat.role === "owner";
  }
  if (args.required === "edit" && !roleHasPermission(seat.role, "projects:edit")) {
    return false;
  }
  if (
    (args.required === "view" || args.required === "edit" || args.required === "manage") &&
    !roleHasPermission(seat.role, "projects:view")
  ) {
    return false;
  }
  return canSeatAccessProject(args);
}

export function roleLabel(role: CompanyRole): string {
  if (role === "owner") return "Owner";
  if (role === "designer") return "Designer";
  if (role === "engineer") return "Engineer";
  return "Viewer";
}
