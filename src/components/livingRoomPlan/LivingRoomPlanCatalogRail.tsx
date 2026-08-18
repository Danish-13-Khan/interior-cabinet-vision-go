import { useRef } from "react";
import type { InteriorProject, OpeningEntity, Size3Mm } from "../../domain/interiorProject";
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
  onAddCatalogObject: (catalogItemId: LivingRoomCatalogId, wallId?: string) => void;
  onSelect: (objectId: string) => void;
  onSetPlanUnderlay: (underlay: LivingRoomPlanUnderlay | null) => void;
  onImportUnderlay: (file: File | null) => void;
  onRoomDimensions: (dimensions: Size3Mm) => void;
  activeWallId: string | null;
  activeOpeningId: string | null;
  onActiveWall: (wallId: string) => void;
  onActiveOpening: (openingId: string) => void;
  onAddOpening: (wallId: string, kind: "door" | "window") => void;
  onUpdateOpening: (openingId: string, patch: Partial<Pick<OpeningEntity, "kind" | "offsetMm" | "widthMm" | "heightMm" | "sillHeightMm">>) => void;
  onDeleteOpening: (openingId: string) => void;
};

export function LivingRoomPlanCatalogRail(props: LivingRoomPlanCatalogRailProps) {
  const underlayInputRef = useRef<HTMLInputElement | null>(null);
  const visibleAssets = LIVING_ROOM_CATALOG.filter((item) =>
    (props.studioPanel !== "cabinets" || item.kind === "cabinet") &&
    (props.studioPanel !== "furniture" || item.kind !== "cabinet") &&
    (props.assetCategory === "all" || item.category === props.assetCategory) &&
    (!props.assetQuery.trim()
      || `${item.name} ${item.category}`.toLowerCase().includes(props.assetQuery.trim().toLowerCase())),
  );
  const room = props.project.rooms.find((item) => item.id === props.project.activeRoomId)!;
  const activeWall = props.project.walls.find((wall) => wall.id === props.activeWallId) ?? props.project.walls[0]!;
  const activeOpening = props.project.openings.find((opening) => opening.id === props.activeOpeningId) ?? null;

  return (
    <>
      <nav className="lr-studio-rail" aria-label="Plan tools">
        <button type="button" className={props.studioPanel === "build" ? "is-active" : ""} onClick={() => props.onStudioPanel("build")} title="Build room"><span>⌗</span>Build</button>
        <button type="button" className={props.studioPanel === "cabinets" ? "is-active" : ""} onClick={() => props.onStudioPanel("cabinets")} title="Cabinets"><span>▤</span>Cabinets</button>
        <button type="button" className={props.studioPanel === "furniture" ? "is-active" : ""} onClick={() => props.onStudioPanel("furniture")} title="Furniture"><span>◇</span>Furniture</button>
        <button type="button" className={props.studioPanel === "materials" ? "is-active" : ""} onClick={() => props.onStudioPanel("materials")} title="Materials"><span>◐</span>Materials</button>
        <button type="button" className={props.studioPanel === "layers" ? "is-active" : ""} onClick={() => props.onStudioPanel("layers")} title="Layers"><span>▱</span>Layers</button>
      </nav>
      {props.toolRailVisible ? (
      <aside className="lr-catalog lr-studio-panel" style={{ width: props.widthPx }}>
        {props.studioPanel === "cabinets" || props.studioPanel === "furniture" ? (
          <>
            <div className="context-panel-heading">
              <strong>{props.studioPanel === "cabinets" ? "Cabinet Library" : "Furniture Library"}</strong>
              <span>{props.studioPanel === "cabinets" ? `Attach to ${String(activeWall.extensions?.wallSide ?? "wall")}` : `${visibleAssets.length} parametric models`}</span>
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
                <button type="button" key={item.id} onClick={() => props.onAddCatalogObject(item.id, props.studioPanel === "cabinets" ? activeWall.id : undefined)}>
                  <span className={`lr-asset-preview is-${item.category}`}><i /><i /><i /></span>
                  <strong>{item.name}</strong>
                  <small>{item.dimensions.widthMm} × {item.dimensions.depthMm} mm</small>
                  <b>Place</b>
                </button>
              ))}
            </div>
          </>
        ) : props.studioPanel === "materials" ? (
          <>
            <div className="context-panel-heading"><strong>Materials</strong><span>Apply through the inspector</span></div>
            <div className="lr-material-library">
              {props.project.materials.map((material) => (
                <div key={material.id}>
                  <i style={{ background: material.color }} />
                  <span><strong>{material.name}</strong><small>{material.id}</small></span>
                </div>
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
            <div className="context-panel-heading"><strong>Build Room</strong><span>2D room authoring</span></div>
            <div className="lr-underlay-panel">
              <section className="lr-room-authoring">
                <strong>Room dimensions</strong>
                <div className="lr-room-dimension-grid">
                  {(["widthMm", "depthMm", "heightMm"] as const).map((key) => (
                    <label key={key}><span>{key === "widthMm" ? "Width" : key === "depthMm" ? "Depth" : "Height"}</span><input type="number" min="2200" step="50" value={room.dimensions[key]} onChange={(event) => props.onRoomDimensions({ ...room.dimensions, [key]: Number(event.target.value) || room.dimensions[key] })} /></label>
                  ))}
                </div>
              </section>
              <section className="lr-room-authoring">
                <strong>Wall openings</strong>
                <div className="lr-wall-tabs">
                  {props.project.walls.map((wall) => <button key={wall.id} type="button" className={wall.id === activeWall.id ? "is-active" : ""} onClick={() => props.onActiveWall(wall.id)}>{String(wall.extensions?.wallSide ?? "wall")}</button>)}
                </div>
                <div className="lr-opening-actions"><button type="button" onClick={() => props.onAddOpening(activeWall.id, "door")}>+ Door</button><button type="button" onClick={() => props.onAddOpening(activeWall.id, "window")}>+ Window</button></div>
                {props.project.openings.filter((opening) => opening.wallId === activeWall.id).map((opening) => (
                  <button type="button" key={opening.id} className={`lr-opening-row ${opening.id === activeOpening?.id ? "is-active" : ""}`} onClick={() => props.onActiveOpening(opening.id)}><span>{opening.kind}</span><small>{opening.widthMm} mm · {opening.offsetMm} mm</small></button>
                ))}
                {!props.project.openings.some((opening) => opening.wallId === activeWall.id) ? <p>No doors or windows on this wall.</p> : null}
                {activeOpening?.wallId === activeWall.id ? <div className="lr-opening-fields">
                  {(["offsetMm", "widthMm", "heightMm", "sillHeightMm"] as const).map((key) => <label key={key}><span>{key === "offsetMm" ? "Offset" : key === "widthMm" ? "Width" : key === "heightMm" ? "Height" : "Sill"}</span><input type="number" min="0" step="50" value={activeOpening[key]} onChange={(event) => props.onUpdateOpening(activeOpening.id, { [key]: Number(event.target.value) || activeOpening[key] })} /></label>)}
                  <button type="button" className="is-danger" onClick={() => props.onDeleteOpening(activeOpening.id)}>Remove opening</button>
                </div> : null}
              </section>
              <section className="lr-room-authoring"><strong>Plan underlay</strong><small>Optional: align a supplied floor plan before drawing.</small></section>
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
