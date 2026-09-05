import builtinCatalogJson from "./data/builtin-catalog.v1.json" with { type: "json" };
import type { CatalogManifest } from "./types";

/** Built-in catalog manifest (Vite-safe src import; public/ is a generated mirror). */
export const BUILTIN_CATALOG_MANIFEST = builtinCatalogJson as unknown as CatalogManifest;
