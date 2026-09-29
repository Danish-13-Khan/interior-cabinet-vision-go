import { useEffect, useState } from "react";
import { isStoredAssetRef } from "../domain/livingRoom/storedAssets";
import { resolveStoredAssetUrl } from "../platform/storedAssetUrls";

/** For <img> previews: the displayable URL for a plain or `idb:` asset URL, or null while loading. */
export function useStoredAssetUrl(url: string | undefined): string | null {
  const [resolved, setResolved] = useState<string | null>(() => (url && !isStoredAssetRef(url) ? url : null));
  useEffect(() => {
    if (!url) { setResolved(null); return; }
    if (!isStoredAssetRef(url)) { setResolved(url); return; }
    let live = true;
    setResolved(null);
    resolveStoredAssetUrl(url).then((next) => { if (live) setResolved(next); }).catch(() => { if (live) setResolved(null); });
    return () => { live = false; };
  }, [url]);
  return resolved;
}
