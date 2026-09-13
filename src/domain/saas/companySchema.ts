/**
 * Company seats / roles — schema + helpers (A0 stubs → Phase D foundations).
 * Usable for seats/roles UX; full polished admin UI still deferred.
 */

export type CompanyRole = "owner" | "designer" | "engineer" | "viewer";

export const COMPANY_ROLES: readonly CompanyRole[] = [
  "owner",
  "designer",
  "engineer",
  "viewer",
] as const;

/** Fine-grained permissions used by shared projects, payments, approvals. */
export type CompanyPermission =
  | "projects:view"
  | "projects:edit"
  | "projects:share"
  | "priceBook:view"
  | "priceBook:edit"
  | "payments:view"
  | "payments:write"
  | "payments:correct"
  | "approvals:request"
  | "approvals:decide"
  | "audit:view"
  | "audit:export"
  | "seats:manage"
  | "dashboard:view";

export const COMPANY_PERMISSIONS: readonly CompanyPermission[] = [
  "projects:view",
  "projects:edit",
  "projects:share",
  "priceBook:view",
  "priceBook:edit",
  "payments:view",
  "payments:write",
  "payments:correct",
  "approvals:request",
  "approvals:decide",
  "audit:view",
  "audit:export",
  "seats:manage",
  "dashboard:view",
] as const;

const ALL = COMPANY_PERMISSIONS;

/** Default role → permission matrix (BUSINESS_PRODUCT_SCOPE §5 / §7). */
export const ROLE_PERMISSIONS: Record<CompanyRole, readonly CompanyPermission[]> = {
  owner: ALL,
  designer: [
    "projects:view",
    "projects:edit",
    "projects:share",
    "priceBook:view",
    "payments:view",
    "payments:write",
    "approvals:request",
    "audit:view",
    "dashboard:view",
  ],
  engineer: [
    "projects:view",
    "projects:edit",
    "priceBook:view",
    "payments:view",
    "approvals:request",
    "audit:view",
  ],
  viewer: ["projects:view", "priceBook:view", "payments:view", "audit:view"],
};

export type SeatStub = {
  /** Opaque local id; not synced to a backend yet. */
  id: string;
  email: string;
  role: CompanyRole;
  /** Reserved for seat accounting; inactive seats do not count toward limits. */
  active: boolean;
  displayName?: string;
};

export type OrganizationStub = {
  id: string;
  name: string;
  seats: SeatStub[];
};

export function createEmptyOrganizationStub(
  name = "My studio",
): OrganizationStub {
  return {
    id: `org-local-${Date.now()}`,
    name,
    seats: [],
  };
}

export function isCompanyRole(value: unknown): value is CompanyRole {
  return (
    value === "owner" ||
    value === "designer" ||
    value === "engineer" ||
    value === "viewer"
  );
}

export function permissionsForRole(role: CompanyRole): readonly CompanyPermission[] {
  return ROLE_PERMISSIONS[role];
}

export function roleHasPermission(
  role: CompanyRole,
  permission: CompanyPermission,
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function createSeatStub(args: {
  email: string;
  role: CompanyRole;
  displayName?: string;
  active?: boolean;
  id?: string;
}): SeatStub {
  const email = args.email.trim().toLowerCase();
  return {
    id: args.id ?? `seat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email,
    role: args.role,
    active: args.active !== false,
    displayName: args.displayName?.trim() || undefined,
  };
}
