import { useRef, useState } from "react";
import {
  ASSET_IMPORT_STARTER_PACK,
  readImportedGlb,
  type ImportedAsset,
} from "../../domain/livingRoom";

export function AssetImportPanel({
  cabinetMode,
  onAdd,
}: {
  cabinetMode: boolean;
  onAdd: (asset: ImportedAsset) => void;
}) {
  const input = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState("");
  const assets = ASSET_IMPORT_STARTER_PACK.filter((asset) => cabinetMode ? asset.kind === "cabinet" : asset.kind !== "cabinet");
  return <>
    <section className="lr-model-import">
      <input ref={input} type="file" accept=".glb,model/gltf-binary,.fbx" hidden onChange={(event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        setError("");
        void readImportedGlb(file).then(onAdd).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Model import failed."));
      }} />
      <strong>Asset Import</strong>
      <small>GLB is stored in this project. Convert FBX to GLB first so textures stay attached.</small>
      <button type="button" onClick={() => input.current?.click()}>Import GLB</button>
      {error ? <p className="lr-import-error">{error}</p> : null}
    </section>
    <div className="lr-import-pack">
      {assets.map((asset) => <button type="button" key={asset.id} onClick={() => onAdd(asset)}><span>⬡</span><strong>{asset.name}</strong><small>GLB · {asset.dimensions.widthMm} mm</small></button>)}
    </div>
  </>;
}
