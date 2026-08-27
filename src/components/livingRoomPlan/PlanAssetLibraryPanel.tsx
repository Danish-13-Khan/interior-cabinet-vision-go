import type { ImportedAsset, LivingRoomCatalogId, LivingRoomCatalogItem } from "../../domain/livingRoom";
import { AssetImportPanel } from "./AssetImportPanel";

export function PlanAssetLibraryPanel(props: {
  mode: "cabinets" | "furniture"; wallName: string; wallId: string;
  assets: LivingRoomCatalogItem[]; query: string; category: string; categories: string[];
  onQuery: (value: string) => void; onCategory: (value: string) => void;
  onAdd: (catalogItemId: LivingRoomCatalogId, wallId?: string) => void;
  onImport: (asset: ImportedAsset) => void;
}) {
  const cabinets = props.mode === "cabinets";
  return <>
    <div className="context-panel-heading"><strong>{cabinets ? "Millwork Design" : "Furniture Library"}</strong>
      <span>{cabinets ? `Parametric cabinet surface · attach to ${props.wallName}` : `${props.assets.length} curated v1 models`}</span></div>
    <AssetImportPanel cabinetMode={cabinets} onAdd={props.onImport} />
    <div className="lr-asset-controls">
      <input aria-label={cabinets ? "Search cabinets" : "Search furniture"} placeholder={cabinets ? "Search cabinets…" : "Search furniture…"}
        value={props.query} onChange={(event) => props.onQuery(event.target.value)} />
      <div className="lr-asset-categories">{props.categories.map((category) => <button type="button" key={category}
        className={props.category === category ? "is-active" : ""} onClick={() => props.onCategory(category)}>
        {category === "all" ? "All" : category.replace("-", " ")}</button>)}</div>
    </div>
    <div className="lr-asset-grid">{props.assets.map((item) => <button type="button" key={item.id}
      onClick={() => props.onAdd(item.id as LivingRoomCatalogId, cabinets ? props.wallId : undefined)}>
      <span className={`lr-asset-preview is-${item.category}`}><i /><i /><i /></span><strong>{item.name}</strong>
      <small>{item.dimensions.widthMm} × {item.dimensions.depthMm} mm</small><b>Place</b></button>)}</div>
  </>;
}
