export type LivingRoomIdFactory = (scope: string, key: string) => string;

function slug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function uniqueScopeToken() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Stable defaults keep preset generation reproducible; product flows may inject UUIDs. */
export const defaultLivingRoomIdFactory: LivingRoomIdFactory = (scope, key) =>
  `lr-${slug(scope)}-${slug(key)}`;

/** Namespace entity IDs under a project/session scope so template instances never collide. */
export function createScopedLivingRoomIdFactory(scopeId: string): LivingRoomIdFactory {
  const prefix = slug(scopeId) || "project";
  return (scope, key) => `${prefix}-${slug(scope)}-${slug(key)}`;
}

/** Fresh UUID/namespace factory for customer-created template projects. */
export function createUniqueLivingRoomIdFactory(): LivingRoomIdFactory {
  return createScopedLivingRoomIdFactory(uniqueScopeToken());
}
