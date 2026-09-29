import { useRef, useState } from "react";
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
  const [pending, setPending] = useState<ImportedAsset | null>(null);
  const [unit, setUnit] = useState<LengthUnit>("m");
  const chosenFiles = useRef<File[]>([]);
  const importFiles = (files: File[], nextUnit: LengthUnit) => {
    chosenFiles.current = files;
    setError("");
    void readImportedGlb(files, indexedDbAssetBlobStore, nextUnit).then(setPending).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Model import failed."));
  };
  const assets = ASSET_IMPORT_STARTER_PACK.filter((asset) => cabinetMode ? asset.kind === "cabinet" : asset.kind !== "cabinet");
  const maps = pending ? Object.entries(pending.textureUrls ?? {}) : [];
  const addPending = () => { if (pending) onAdd(pending); setPending(null); };
  return <>
    <section className="lr-model-import">
      <input ref={input} type="file" accept=".glb,model/gltf-binary,image/png,image/jpeg,image/webp" multiple hidden onChange={(event) => {
        const files = Array.from(event.target.files ?? []);
        event.target.value = "";
        if (!files.length) return;
        importFiles(files, unit);
      }} />
      <strong>Asset Import</strong>
      <small>Select a GLB and its BaseColor/normal/roughness images together. Files are kept in this browser and embedded when you save the project to a file.</small>
      <button type="button" onClick={() => input.current?.click()}>Import GLB + textures</button>
      {error ? <p className="lr-import-error">{error}</p> : null}
    </section>
    {pending ? <section className="lr-texture-window" aria-label="Texture setup">
      <strong>Texture setup</strong><small>{pending.name} · {Math.round(pending.dimensions.widthMm)} × {Math.round(pending.dimensions.heightMm)} × {Math.round(pending.dimensions.depthMm)} mm</small>
      <ImportSizeConfirm asset={pending} onUnit={(next) => { setUnit(next); if (chosenFiles.current.length) importFiles(chosenFiles.current, next); }} />
      {maps.length ? <div className="lr-texture-slots">{maps.map(([slot, url]) => <div key={slot}>{url ? <TexturePreview url={url} /> : null}<span>{slot.replace("Map", "")}</span><b>Attached</b></div>)}</div> : <p>No sidecar images found. The GLB’s embedded materials will be used.</p>}
      <footer>
        <button type="button" onClick={() => setPending(null)}>Cancel</button>
        <button type="button" onClick={addPending}>Add to room</button>
      </footer>
    </section> : null}
    <div className="lr-import-pack">
      {assets.map((asset) => (
        <button type="button" key={asset.id} onClick={() => setPending(asset)}>
          <span>⬡</span>
          <strong>{asset.name}</strong>
          <small>GLB · {asset.dimensions.widthMm} mm · catalog alias</small>
        </button>
      ))}
    </div>
  </>;
}
