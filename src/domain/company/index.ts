export {
  assertCompanyCapability,
  gateCompanyControls,
  gatePremiumAudit,
  gateSharedOrgPriceBook,
  hasCompanyCapability,
  type CompanyCapability,
} from "./gate";

export {
  addSeat,
  countActiveSeats,
  ensureOwnerSeat,
  findSeatByEmail,
  findSeatById,
  removeSeat,
  setSeatActive,
  updateSeatRole,
} from "./seats";

export {
  PROJECT_ACCESS_LEVELS,
  accessAtLeast,
  canSeatAccessProject,
  canSeatActOnProject,
  clampProjectAccess,
  resolveProjectAccess,
  roleLabel,
  seatHasPermission,
  type ProjectAccessLevel,
  type SharedProjectGrant,
} from "./permissions";

export {
  createEmptySharedProjectsState,
  getSharedProjectGrant,
  listProjectsVisibleToSeat,
  setSeatProjectAccess,
  shareProject,
  unshareProject,
  type CompanySharedProjectsState,
} from "./sharedProjects";

export {
  approveRequest,
  cancelRequest,
  createEmptyApprovalsState,
  hasApprovedClearance,
  listPendingApprovals,
  rejectRequest,
  requestApproval,
  type ApprovalKind,
  type ApprovalRequest,
  type ApprovalStatus,
  type CompanyApprovalsState,
} from "./approvals";

export {
  buildPremiumAuditReport,
  listPaymentAuditActions,
  premiumAuditToCsv,
  type ApprovalAuditLike,
  type FreezeAuditEvent,
  type PremiumAuditFilter,
  type PremiumAuditKind,
  type PremiumAuditRow,
} from "./premiumAudit";

export {
  buildOwnerDashboard,
  ownerDashboardForProjects,
  projectObligationRow,
  type OwnerDashboardAggregates,
} from "./ownerDashboard";

export {
  companyControlsStorageKey,
  clearCompanyControls,
  createEmptyCompanyControls,
  persistCompanyControls,
  readCompanyControls,
  type CompanyControlsState,
} from "./store";
