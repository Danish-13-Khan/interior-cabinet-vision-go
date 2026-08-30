import type { CabinetInstance } from "../cabinetDimensions";

/** Copy/split must not reuse the source Interior object id. */
export function withNewCabinetIdentity(
  cabinet: CabinetInstance,
  id: string,
): CabinetInstance {
  return {
    ...cabinet,
    id,
    interiorObjectId: undefined,
  };
}
