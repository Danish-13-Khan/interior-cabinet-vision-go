import type { ImportedAsset, LivingRoomCatalogItem } from "../../domain/livingRoom";
import { catalogPreviewFallbackLabel } from "../../domain/livingRoom/modelQualityFeedback";
import { AssetImportPanel } from "./AssetImportPanel";

export function PlanAssetLibraryPanel(props: {
  mode: "cabinets" | "furniture"; wallName: string; wallId: string;
  selectedCabinetCount: number; onCreateRun: (wallId: string) => void;
  assets: LivingRoomCatalogItem[]; query: string; category: string; categories: string[];
  onQuery: (value: string) => void; onCategory: (value: string) => void;
  onAdd: (catalogItemId: string, wallId?: string) => void;
  onImport: (asset: ImportedAsset) => void;
}) {
  const cabinets = props.mode === "cabinets";
  const previewLabel = catalogPreviewFallbackLabel(false);
  const primaryCategories = props.categories.slice(0, 4);
  const moreCategories = props.categories.slice(4);
  return <>
    <div className="context-panel-heading"><strong>{cabinets ? "Object library" : "Furniture Library"}</strong>
      <span>{cabinets ? `Attach to ${props.wallName}` : `${props.assets.length} curated v1 models`}</span></div>
    {cabinets ? <button type="button" className="lr-create-cabinet-run" onClick={() => props.onCreateRun(props.wallId)} disabled={props.selectedCabinetCount < 2}>
      Create cabinet run
    </button> : null}
    <AssetImportPanel cabinetMode={cabinets} onAdd={props.onImport} />
    <div className="lr-asset-controls">
      <input aria-label={cabinets ? "Search cabinets" : "Search furniture"} placeholder={cabinets ? "Search cabinets…" : "Search furniture…"}
        value={props.query} onChange={(event) => props.onQuery(event.target.value)} />
      <div className="lr-asset-categories">
        {primaryCategories.map((category) => <button type="button" key={category}
          className={props.category === category ? "is-active" : ""} onClick={() => props.onCategory(category)}>
          {category === "all" ? "All" : category.replace("-", " ")}</button>)}
        {moreCategories.length > 0 ? (
          <select aria-label="More categories" value={moreCategories.includes(props.category) ? props.category : ""}
            onChange={(event) => { if (event.target.value) props.onCategory(event.target.value); }}>
            <option value="">More</option>
            {moreCategories.map((category) => <option key={category} value={category}>{category.replace("-", " ")}</option>)}
          </select>
        ) : null}
      </div>
    </div>
    <div className="lr-asset-grid">{props.assets.map((item) => <button type="button" key={item.id}
      onClick={() => props.onAdd(item.id, cabinets ? props.wallId : undefined)}>
      <span className={`lr-asset-preview is-${item.category}`}>
        <i /><i /><i />
        {previewLabel ? <em className="lr-asset-preview-fallback">{previewLabel}</em> : null}
      </span>
      <strong>{item.name}</strong>
      <small>{item.dimensions.widthMm} × {item.dimensions.depthMm} mm{"sku" in item.parameters && typeof item.parameters.sku === "string" ? ` · ${item.parameters.sku}` : ""}</small><b>Place</b></button>)}</div>
  </>;
}
