/**
 * Company seats / roles — SCHEMA stubs only (A0).
 * No team UX, approvals, owner dashboard, or seat management UI.
 */

export type CompanyRole = "owner" | "designer" | "engineer" | "viewer";

export const COMPANY_ROLES: readonly CompanyRole[] = [
  "owner",
  "designer",
  "engineer",
  "viewer",
] as const;

export type SeatStub = {
  /** Opaque local id; not synced to a backend in A0. */
  id: string;
  email: string;
  role: CompanyRole;
  /** Reserved for future seat accounting; unused in A0 UX. */
  active: boolean;
};

export type OrganizationStub = {
  id: string;
  name: string;
  /** Seat list present for Company SKU billing shape only. */
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
