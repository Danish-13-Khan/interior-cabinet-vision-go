import { BuiltInCatalogProvider } from "./builtInCatalogProvider";
import { RemoteCatalogProvider, type RemoteCatalogProviderOptions } from "./remoteCatalogProvider";
import type { CatalogProvider } from "./types";

export type CatalogProviderMode = "builtin" | "remote";

export type CatalogProviderConfig = {
  mode?: CatalogProviderMode;
  remote?: RemoteCatalogProviderOptions;
};

/**
 * Select built-in (default, offline) or remote/CDN provider.
 *
 * TODO(cdn): When CDN is ready, pass `{ mode: "remote", remote: { cdnBaseUrl, transport } }`
 * or set `VITE_CATALOG_PROVIDER=remote` plus `VITE_CATALOG_CDN_BASE_URL`.
 */
export function createCatalogProvider(config: CatalogProviderConfig = {}): CatalogProvider {
  const mode = config.mode ?? readProviderModeFromEnv();
  if (mode === "remote") {
    return new RemoteCatalogProvider({
      ...readRemoteOptionsFromEnv(),
      ...config.remote,
    });
  }
  return new BuiltInCatalogProvider();
}

function readProviderModeFromEnv(): CatalogProviderMode {
  const raw = (import.meta.env?.VITE_CATALOG_PROVIDER as string | undefined)?.trim().toLowerCase();
  return raw === "remote" ? "remote" : "builtin";
}

function readRemoteOptionsFromEnv(): RemoteCatalogProviderOptions {
  return {
    cdnBaseUrl: import.meta.env?.VITE_CATALOG_CDN_BASE_URL as string | undefined,
    cdnPathPrefix: import.meta.env?.VITE_CATALOG_CDN_PATH_PREFIX as string | undefined,
  };
}
