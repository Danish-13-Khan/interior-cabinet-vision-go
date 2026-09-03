export type FinishUvRebind =
  | { kind: "object"; objectId: string; slotName: string }
  | { kind: "floor" }
  | { kind: "ceiling" }
  | { kind: "wall"; wallId: string };

export function withExtensions<T extends { extensions?: Record<string, unknown> }>(
  entity: T,
  patch: Record<string, unknown>,
): T {
  return { ...entity, extensions: { ...entity.extensions, ...patch } };
}
