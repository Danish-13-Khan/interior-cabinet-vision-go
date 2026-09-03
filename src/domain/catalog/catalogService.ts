import { BuiltInCatalogProvider } from "./providers/builtInCatalogProvider";
import type { CatalogProvider } from "./providers/types";
import type {
  CatalogItem,
  CatalogManifest,
  CatalogPage,
  CatalogQuery,
  ResolvedAsset,
} from "./types";

let defaultProvider: CatalogProvider | null = null;

export function getCatalogProvider(): CatalogProvider {
  if (!defaultProvider) defaultProvider = new BuiltInCatalogProvider();
  return defaultProvider;
}

/** Test helper — replace or clear the process-wide default provider. */
export function setCatalogProvider(provider: CatalogProvider | null): void {
  defaultProvider = provider;
}

export async function getCatalogManifest(): Promise<CatalogManifest> {
  return getCatalogProvider().getManifest();
}

export async function listCatalogItems(query?: CatalogQuery): Promise<CatalogPage> {
  return getCatalogProvider().listItems(query);
}

export async function getCatalogItem(
  id: string,
  version?: number,
): Promise<CatalogItem | null> {
  return getCatalogProvider().getItem(id, version);
}

export async function resolveCatalogFile(fileId: string): Promise<ResolvedAsset> {
  return getCatalogProvider().resolveFile(fileId);
}
