import { BUILTIN_CATALOG_MANIFEST } from "../builtinCatalogManifest";
import { publicAssetUrl } from "../../../utils/publicAssetUrl";
import { resolveCatalogAlias } from "../aliases";
import { assertValidCatalogManifest } from "../schema";
import type {
  CatalogItem,
  CatalogManifest,
  CatalogPage,
  CatalogQuery,
  ResolvedAsset,
} from "../types";
import { matchesCatalogQuery } from "./catalogItemQuery";
import type { CatalogProvider } from "./types";

export type BuiltInCatalogProviderOptions = {
  baseUrl?: string;
};

/** Offline built-in provider over the committed Kenney inventory manifest. */
export class BuiltInCatalogProvider implements CatalogProvider {
  private readonly manifest: CatalogManifest;
  private readonly baseUrl: string;

  constructor(
    manifest: unknown = BUILTIN_CATALOG_MANIFEST,
    options: BuiltInCatalogProviderOptions = {},
  ) {
    const data = manifest ?? BUILTIN_CATALOG_MANIFEST;
    assertValidCatalogManifest(data);
    this.manifest = data as CatalogManifest;
    this.baseUrl = options.baseUrl ?? import.meta.env?.BASE_URL ?? "/";
  }

  async getManifest(): Promise<CatalogManifest> {
    return this.manifest;
  }

  async listItems(query?: CatalogQuery): Promise<CatalogPage> {
    const items = this.manifest.items.filter((item) => matchesCatalogQuery(item, query));
    return { items, total: items.length };
  }

  async getItem(id: string, version?: number): Promise<CatalogItem | null> {
    const canonical = resolveCatalogAlias(id)?.targetItemId ?? id;
    const item = this.manifest.items.find((candidate) => candidate.id === canonical) ?? null;
    if (!item) return null;
    if (version !== undefined && item.version !== version) return null;
    return item;
  }

  async resolveFile(fileId: string): Promise<ResolvedAsset> {
    const file = this.manifest.files.find((candidate) => candidate.id === fileId);
    if (!file) throw new Error(`Unknown catalog file: ${fileId}`);
    return {
      fileId: file.id,
      url: publicAssetUrl(file.objectKey, this.baseUrl),
      objectKey: file.objectKey,
      mimeType: file.mimeType,
      byteSize: file.byteSize,
      contentHash: file.contentHash,
      available: true,
      deliverySource: "builtin",
      retryable: false,
    };
  }
}
