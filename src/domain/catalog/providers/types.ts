import type {
  CatalogItem,
  CatalogManifest,
  CatalogPage,
  CatalogQuery,
  ResolvedAsset,
} from "../types";

export interface CatalogProvider {
  getManifest(): Promise<CatalogManifest>;
  listItems(query?: CatalogQuery): Promise<CatalogPage>;
  getItem(id: string, version?: number): Promise<CatalogItem | null>;
  resolveFile(fileId: string): Promise<ResolvedAsset>;
}
