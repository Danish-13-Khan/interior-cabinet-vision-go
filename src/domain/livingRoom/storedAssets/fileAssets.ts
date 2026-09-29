import { blobToDataUrl, dataUrlToBlob, isDataUrl } from "../../../utils/dataUrl";
import { isStoredAssetRef, storeAssetBlob, storedAssetKey, type AssetBlobStore } from "./refs";

type UrlMapper = (url: string) => Promise<string>;
type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function memoize(map: UrlMapper): UrlMapper {
  const cache = new Map<string, Promise<string>>();
  return (url) => {
    let pending = cache.get(url);
    if (!pending) { pending = map(url); cache.set(url, pending); }
    return pending;
  };
}

async function mapAssetUrls(asset: JsonRecord, map: UrlMapper): Promise<JsonRecord> {
  const next: JsonRecord = { ...asset };
  if (typeof next.sourceUrl === "string") next.sourceUrl = await map(next.sourceUrl);
  if (isRecord(next.textureUrls)) {
    const textures: JsonRecord = {};
    for (const [slot, url] of Object.entries(next.textureUrls)) {
      textures[slot] = typeof url === "string" ? await map(url) : url;
    }
    next.textureUrls = textures;
  }
  return next;
}

/** Rewrite the model/texture URLs of every `extensions.assetImport` record, wherever it sits in a project file. */
export async function mapImportedAssetUrls<T>(value: T, map: UrlMapper): Promise<T> {
  const mapper = memoize(map);
  const visit = async (node: unknown): Promise<unknown> => {
    if (Array.isArray(node)) return Promise.all(node.map(visit));
    if (!isRecord(node)) return node;
    const next: JsonRecord = {};
    for (const [key, child] of Object.entries(node)) {
      next[key] = key === "assetImport" && isRecord(child) ? await mapAssetUrls(child, mapper) : await visit(child);
    }
    return next;
  };
  return (await visit(value)) as T;
}

/** True when any imported asset still carries its bytes inline (legacy saves, or IndexedDB was unavailable). */
export function hasEmbeddedAssetData(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasEmbeddedAssetData);
  if (!isRecord(value)) return false;
  return Object.entries(value).some(([key, child]) => {
    if (key !== "assetImport" || !isRecord(child)) return hasEmbeddedAssetData(child);
    const textures = isRecord(child.textureUrls) ? Object.values(child.textureUrls) : [];
    return [child.sourceUrl, ...textures].some(isDataUrl);
  });
}

/** For a portable project file: replace `idb:` references with the stored bytes as data URLs. */
export async function embedStoredAssets<T>(value: T, store: AssetBlobStore): Promise<{ value: T; missing: string[] }> {
  const missing: string[] = [];
  const next = await mapImportedAssetUrls(value, async (url) => {
    if (!isStoredAssetRef(url)) return url;
    const blob = await store.get(storedAssetKey(url)).catch(() => null);
    if (!blob) { missing.push(url); return url; }
    return blobToDataUrl(blob);
  });
  return { value: next, missing };
}

/** When opening a file: move embedded data URLs into the blob store so autosave stays small. */
export async function stashEmbeddedAssets<T>(value: T, store: AssetBlobStore): Promise<T> {
  return mapImportedAssetUrls(value, async (url) => {
    if (!isDataUrl(url)) return url;
    try {
      return await storeAssetBlob(store, dataUrlToBlob(url));
    } catch {
      return url;
    }
  });
}
