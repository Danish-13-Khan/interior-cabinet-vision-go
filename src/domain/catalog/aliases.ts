/** Stable pack IDs that resolve to curated Kenney catalog replacements. */

export type CatalogAliasRecord = {
  aliasId: string;
  targetItemId: string;
  lifecycle: "deprecated";
  note: string;
};

/**
 * Phase 6 compatibility aliases for the four packaged starter assets.
 * Projects persist `extensions.assetImport.id`; runtime resolves the target model.
 */
export const PACK_STARTER_ALIASES: readonly CatalogAliasRecord[] = [
  {
    aliasId: "pack:wardrobe-1",
    targetItemId: "kenney:bookcase-open",
    lifecycle: "deprecated",
    note: "Legacy imported wardrobe → open bookcase",
  },
  {
    aliasId: "pack:dresser-1",
    targetItemId: "kenney:cabinet-television",
    lifecycle: "deprecated",
    note: "Legacy imported dresser → TV cabinet storage",
  },
  {
    aliasId: "pack:kitchen-cabinet-1",
    targetItemId: "kenney:kitchen-cabinet",
    lifecycle: "deprecated",
    note: "Legacy imported kitchen cabinet → Kenney presentation prop",
  },
  {
    aliasId: "pack:sofa-1",
    targetItemId: "kenney:lounge-sofa",
    lifecycle: "deprecated",
    note: "Legacy imported sofa → lounge sofa",
  },
] as const;

/**
 * Legacy pack objects store `carcass`/`fronts`. Replacement Kenney policies use
 * canonical slots (`body`, `upholstery`, `legs`). Remap at bind time so finishes apply.
 */
export const PACK_STARTER_SLOT_REMAP: Readonly<
  Record<string, Readonly<Record<string, string>>>
> = {
  "pack:wardrobe-1": { carcass: "body", fronts: "body" },
  "pack:dresser-1": { carcass: "body", fronts: "body" },
  "pack:kitchen-cabinet-1": {},
  "pack:sofa-1": { carcass: "upholstery", fronts: "legs" },
};

const ALIAS_BY_ID = new Map(
  PACK_STARTER_ALIASES.map((record) => [record.aliasId, record] as const),
);

export function resolveCatalogAlias(id: string): CatalogAliasRecord | null {
  return ALIAS_BY_ID.get(id) ?? null;
}

/** Follow one alias hop; unknown IDs return unchanged. */
export function canonicalCatalogItemId(id: string): string {
  return resolveCatalogAlias(id)?.targetItemId ?? id;
}

export function isPackStarterAliasId(id: string): boolean {
  return ALIAS_BY_ID.has(id);
}
