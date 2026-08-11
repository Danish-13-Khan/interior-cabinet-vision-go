export type LivingRoomIdFactory = (scope: string, key: string) => string;

function slug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Stable defaults keep preset generation reproducible; product flows may inject UUIDs. */
export const defaultLivingRoomIdFactory: LivingRoomIdFactory = (scope, key) =>
  `lr-${slug(scope)}-${slug(key)}`;

