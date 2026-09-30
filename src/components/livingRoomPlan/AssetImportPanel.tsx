import { useEffect, useRef, useState } from "react";
import type { LengthUnit } from "../../workers/modelImport/protocol";
import { ImportSizeConfirm } from "./ImportSizeConfirm";
import {
  ASSET_IMPORT_STARTER_PACK,
  readImportedGlb,
  type ImportedAsset,
} from "../../domain/livingRoom";
import { useStoredAssetUrl } from "../../hooks/useStoredAssetUrl";
import { indexedDbAssetBlobStore } from "../../platform/assetBlobStore";

function TexturePreview({ url }: { url: string }) {
  const src = useStoredAssetUrl(url);
  return src ? <img src={src} alt="" /> : <span className="lr-texture-loading" aria-hidden="true" />;
}

export function AssetImportPanel({
  cabinetMode,
  onAdd,
}: {
  cabinetMode: boolean;
  onAdd: (asset: ImportedAsset) => void;
}) {
  const input = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<ImportedAsset | null>(null);
  const chosenFiles = useRef<File[]>([]);
  const flight = useRef<AbortController | null>(null);
  useEffect(() => () => flight.current?.abort(), []);
  const cancelImport = () => {
    flight.current?.abort();
    flight.current = null;
    setBusy(false);
  };
  const importFiles = (files: File[], nextUnit: LengthUnit, honorFileUnits = false) => {
    flight.current?.abort();
    const controller = new AbortController();
    flight.current = controller;
    chosenFiles.current = files;
    setError("");
    setBusy(true);
    void readImportedGlb(files, indexedDbAssetBlobStore, nextUnit, honorFileUnits, controller.signal)
      .then((asset) => { if (!controller.signal.aborted) setPending(asset); })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setError(reason instanceof Error ? reason.message : "Model import failed.");
      })
      .finally(() => { if (flight.current === controller) setBusy(false); });
  };
  const assets = ASSET_IMPORT_STARTER_PACK.filter((asset) => cabinetMode ? asset.kind === "cabinet" : asset.kind !== "cabinet");
  const maps = pending ? Object.entries(pending.textureUrls ?? {}) : [];
  const addPending = () => { if (pending) onAdd(pending); setPending(null); };
  // A failed unit re-run keeps the last good preview; show why next to it, not only in the header.
  const errorLine = error ? <p className="lr-import-error" role="alert">{error}</p> : null;
  return <>
    <section className="lr-model-import" aria-busy={busy}>
      <input ref={input} type="file" accept=".glb,.gltf,.fbx,.obj,.mtl,image/png,image/jpeg,image/webp" multiple hidden onChange={(event) => {
        const files = Array.from(event.target.files ?? []);
        event.target.value = "";
        if (!files.length) return;
        setPending(null); // a different model; the old preview would be misleading if this one fails
        importFiles(files, "m", true);
      }} />
      <strong>Asset Import</strong>
      <small>Select a GLB and its BaseColor/normal/roughness images together. Files are kept in this browser and embedded when you save the project to a file.</small>
      <button type="button" onClick={() => input.current?.click()} disabled={busy}>{busy ? "Importing…" : "Import model + textures"}</button>
      {busy ? <button type="button" onClick={cancelImport}>Cancel import</button> : null}
      {pending ? null : errorLine}
      {pending?.importWarnings?.length ? <p>{pending.importWarnings[0]}</p> : null}
    </section>
    {pending ? <section className="lr-texture-window" aria-label="Texture setup" aria-busy={busy}>
      <strong>Texture setup</strong><small>{pending.name} · {Math.round(pending.dimensions.widthMm)} × {Math.round(pending.dimensions.heightMm)} × {Math.round(pending.dimensions.depthMm)} mm</small>
      <ImportSizeConfirm asset={pending} busy={busy} onUnit={(next) => {
        if (!chosenFiles.current.length || busy) return;
        if (next === "file") importFiles(chosenFiles.current, "m", true);
        else importFiles(chosenFiles.current, next);
      }} />
      {errorLine}
      {maps.length ? <div className="lr-texture-slots">{maps.map(([slot, url]) => <div key={slot}>{url ? <TexturePreview url={url} /> : null}<span>{slot.replace("Map", "")}</span><b>Attached</b></div>)}</div> : <p>No sidecar images found. The GLB’s embedded materials will be used.</p>}
      <footer>
        <button type="button" onClick={() => { cancelImport(); setError(""); setPending(null); }}>Cancel</button>
        <button type="button" onClick={addPending} disabled={busy}>Add to room</button>
      </footer>
    </section> : null}
    <div className="lr-import-pack">
      {assets.map((asset) => (
        <button type="button" key={asset.id} onClick={() => { cancelImport(); setError(""); setPending(asset); }}>
          <span>⬡</span>
          <strong>{asset.name}</strong>
          <small>GLB · {asset.dimensions.widthMm} mm · catalog alias</small>
        </button>
      ))}
    </div>
  </>;
}
