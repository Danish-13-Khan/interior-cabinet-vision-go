/**
 * Seats helpers — usable schema foundations (Phase D).
 * Polished admin UI deferred.
 */

import {
  createSeatStub,
  isCompanyRole,
  type CompanyRole,
  type OrganizationStub,
  type SeatStub,
} from "../saas/companySchema";

export function countActiveSeats(org: OrganizationStub): number {
  return org.seats.filter((s) => s.active).length;
}

export function findSeatByEmail(
  org: OrganizationStub,
  email: string,
): SeatStub | undefined {
  const key = email.trim().toLowerCase();
  return org.seats.find((s) => s.email === key);
}

export function findSeatById(
  org: OrganizationStub,
  seatId: string,
): SeatStub | undefined {
  return org.seats.find((s) => s.id === seatId);
}

/** Ensure an owner seat exists (idempotent by email). */
export function ensureOwnerSeat(
  org: OrganizationStub,
  args: { email: string; displayName?: string },
): OrganizationStub {
  const existing = findSeatByEmail(org, args.email);
  if (existing) {
    if (existing.role === "owner" && existing.active) return org;
    return {
      ...org,
      seats: org.seats.map((s) =>
        s.id === existing.id
          ? { ...s, role: "owner" as const, active: true, displayName: args.displayName ?? s.displayName }
          : s,
      ),
    };
  }
  return {
    ...org,
    seats: [
      createSeatStub({
        email: args.email,
        role: "owner",
        displayName: args.displayName,
      }),
      ...org.seats,
    ],
  };
}

export function addSeat(
  org: OrganizationStub,
  args: { email: string; role: CompanyRole; displayName?: string },
): OrganizationStub {
  if (!isCompanyRole(args.role)) {
    throw new Error("Invalid company role.");
  }
  if (args.role === "owner") {
    throw new Error("Use ensureOwnerSeat to attach the account owner.");
  }
  const email = args.email.trim().toLowerCase();
  if (!email) throw new Error("Seat email is required.");
  if (findSeatByEmail(org, email)) {
    throw new Error("A seat with that email already exists.");
  }
  return {
    ...org,
    seats: [
      ...org.seats,
      createSeatStub({
        email,
        role: args.role,
        displayName: args.displayName,
      }),
    ],
  };
}

export function updateSeatRole(
  org: OrganizationStub,
  seatId: string,
  role: CompanyRole,
): OrganizationStub {
  if (!isCompanyRole(role)) throw new Error("Invalid company role.");
  const seat = findSeatById(org, seatId);
  if (!seat) throw new Error("Unknown seat.");
  if (seat.role === "owner" && role !== "owner") {
    const otherOwners = org.seats.filter(
      (s) => s.id !== seatId && s.role === "owner" && s.active,
    );
    if (!otherOwners.length) {
      throw new Error("Cannot demote the only active owner.");
    }
  }
  return {
    ...org,
    seats: org.seats.map((s) => (s.id === seatId ? { ...s, role } : s)),
  };
}

export function setSeatActive(
  org: OrganizationStub,
  seatId: string,
  active: boolean,
): OrganizationStub {
  const seat = findSeatById(org, seatId);
  if (!seat) throw new Error("Unknown seat.");
  if (seat.role === "owner" && !active) {
    const otherOwners = org.seats.filter(
      (s) => s.id !== seatId && s.role === "owner" && s.active,
    );
    if (!otherOwners.length) {
      throw new Error("Cannot deactivate the only active owner.");
    }
  }
  return {
    ...org,
    seats: org.seats.map((s) => (s.id === seatId ? { ...s, active } : s)),
  };
}

export function removeSeat(
  org: OrganizationStub,
  seatId: string,
): OrganizationStub {
  const seat = findSeatById(org, seatId);
  if (!seat) throw new Error("Unknown seat.");
  if (seat.role === "owner") {
    throw new Error("Cannot remove the owner seat; deactivate instead.");
  }
  return { ...org, seats: org.seats.filter((s) => s.id !== seatId) };
}
