import { useRef } from "react";
import type { InteriorProject } from "../../domain/interiorProject";
import {
  LIVING_ROOM_CATALOG,
  type LivingRoomCatalogId,
  type LivingRoomPlanUnderlay,
} from "../../domain/livingRoom";
import type { StudioPanel } from "./workspaceProps";

export function imageFileToUnderlay(
  file: File,
  roomWidthMm: number,
): Promise<LivingRoomPlanUnderlay> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The selected image could not be read."));
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      const image = new Image();
      image.onerror = () => reject(new Error("The selected file is not a supported plan image."));
      image.onload = () => resolve({
        fileName: file.name,
        dataUrl,
        widthMm: roomWidthMm,
        heightMm: roomWidthMm * image.naturalHeight / Math.max(1, image.naturalWidth),
        opacity: 0.42,
      });
      image.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

type LivingRoomPlanCatalogRailProps = {
  widthPx: number;
  toolRailVisible: boolean;
  studioPanel: StudioPanel;
  onStudioPanel: (panel: StudioPanel) => void;
  project: InteriorProject;
  roomName: string;
  selectedIds: string[];
  assetQuery: string;
  assetCategory: string;
  assetCategories: string[];
  underlay: LivingRoomPlanUnderlay | null;
  importError: string;
  onAssetQuery: (value: string) => void;
  onAssetCategory: (value: string) => void;
  onAddCatalogObject: (catalogItemId: LivingRoomCatalogId) => void;
  onSelect: (objectId: string) => void;
  onSetPlanUnderlay: (underlay: LivingRoomPlanUnderlay | null) => void;
  onImportUnderlay: (file: File | null) => void;
};

export function LivingRoomPlanCatalogRail(props: LivingRoomPlanCatalogRailProps) {
  const underlayInputRef = useRef<HTMLInputElement | null>(null);
  const visibleAssets = LIVING_ROOM_CATALOG.filter((item) =>
    (props.assetCategory === "all" || item.category === props.assetCategory) &&
    (!props.assetQuery.trim()
      || `${item.name} ${item.category}`.toLowerCase().includes(props.assetQuery.trim().toLowerCase())),
  );

  return (
    <>
      <nav className="lr-studio-rail" aria-label="Plan tools">
        <button type="button" className={props.studioPanel === "assets" ? "is-active" : ""} onClick={() => props.onStudioPanel("assets")} title="Assets"><span>◇</span>Assets</button>
        <button type="button" className={props.studioPanel === "layers" ? "is-active" : ""} onClick={() => props.onStudioPanel("layers")} title="Layers"><span>▱</span>Layers</button>
        <button type="button" className={props.studioPanel === "underlay" ? "is-active" : ""} onClick={() => props.onStudioPanel("underlay")} title="Plan underlay"><span>⌁</span>Import</button>
      </nav>
      {props.toolRailVisible ? (
      <aside className="lr-catalog lr-studio-panel" style={{ width: props.widthPx }}>
        {props.studioPanel === "assets" ? (
          <>
            <div className="context-panel-heading">
              <strong>Asset Library</strong>
              <span>{LIVING_ROOM_CATALOG.length} parametric models</span>
            </div>
            <div className="lr-asset-controls">
              <input aria-label="Search assets" placeholder="Search furniture…" value={props.assetQuery} onChange={(event) => props.onAssetQuery(event.target.value)} />
              <div className="lr-asset-categories">
                {props.assetCategories.map((category) => (
                  <button type="button" key={category} className={props.assetCategory === category ? "is-active" : ""} onClick={() => props.onAssetCategory(category)}>{category === "all" ? "All" : category.replace("-", " ")}</button>
                ))}
              </div>
            </div>
            <div className="lr-asset-grid">
              {visibleAssets.map((item) => (
                <button type="button" key={item.id} onClick={() => props.onAddCatalogObject(item.id)}>
                  <span className={`lr-asset-preview is-${item.category}`}><i /><i /><i /></span>
                  <strong>{item.name}</strong>
                  <small>{item.dimensions.widthMm} × {item.dimensions.depthMm} mm</small>
                  <b>Place</b>
                </button>
              ))}
            </div>
          </>
        ) : props.studioPanel === "layers" ? (
          <>
            <div className="context-panel-heading"><strong>Layers</strong><span>Scene structure</span></div>
            <div className="lr-layer-tree">
              <div><b>⌄</b><strong>{props.roomName}</strong><small>Room</small></div>
              <div><b>⌄</b><strong>Architecture</strong><small>{props.project.walls.length + props.project.openings.length}</small></div>
              <span>Walls <small>{props.project.walls.length}</small></span>
              <span>Doors &amp; windows <small>{props.project.openings.length}</small></span>
              <div><b>⌄</b><strong>Furniture</strong><small>{props.project.objects.length}</small></div>
              {props.project.objects.map((object) => (
                <button type="button" key={object.id} className={props.selectedIds.includes(object.id) ? "is-selected" : ""} onClick={() => props.onSelect(object.id)}><i>◇</i><span>{object.name}</span><small>{object.category}</small></button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="context-panel-heading"><strong>Plan Underlay</strong><span>Trace from a drawing</span></div>
            <div className="lr-underlay-panel">
              <input ref={underlayInputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(event) => void props.onImportUnderlay(event.target.files?.[0] ?? null)} />
              {props.underlay ? (
                <>
                  <div className="lr-underlay-thumb"><img src={props.underlay.dataUrl} alt="Imported floor plan" /></div>
                  <strong>{props.underlay.fileName}</strong>
                  <small>{Math.round(props.underlay.widthMm)} × {Math.round(props.underlay.heightMm)} mm</small>
                  <label><span>Opacity</span><input type="range" min="0.05" max="1" step="0.05" value={props.underlay.opacity} onChange={(event) => props.onSetPlanUnderlay({ ...props.underlay!, opacity: Number(event.target.value) })} /></label>
                  <label><span>Calibrated width</span><input type="number" min="100" step="10" value={Math.round(props.underlay.widthMm)} onChange={(event) => {
                    const widthMm = Math.max(100, Number(event.target.value) || props.underlay!.widthMm);
                    props.onSetPlanUnderlay({ ...props.underlay!, widthMm, heightMm: props.underlay!.heightMm * widthMm / props.underlay!.widthMm });
                  }} /></label>
                  <button type="button" className="is-secondary" onClick={() => underlayInputRef.current?.click()}>Replace image</button>
                  <button type="button" className="is-danger" onClick={() => props.onSetPlanUnderlay(null)}>Remove underlay</button>
                </>
              ) : (
                <div className="lr-underlay-empty">
                  <span>⌁</span>
                  <strong>Import a floor plan</strong>
                  <p>Use PNG, JPG, or WebP as a calibrated tracing underlay.</p>
                  <button type="button" onClick={() => underlayInputRef.current?.click()}>Choose plan image</button>
                </div>
              )}
              {props.importError ? <p className="lr-import-error">{props.importError}</p> : null}
            </div>
          </>
        )}
      </aside>
      ) : null}
    </>
  );
}
