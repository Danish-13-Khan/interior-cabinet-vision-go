import { interiorsCabinetRunFamilyItems, type InteriorsChromeTool } from "../../domain/desktopUx";
import { LIVING_ROOM_CATALOG } from "../../domain/livingRoom";
import { catalogPreviewFallbackLabel } from "../../domain/livingRoom/modelQualityFeedback";
import { livingRoomThumbnailUrl } from "../../domain/livingRoom/livingRoomThumbnails";
import type { ImportedAsset } from "../../domain/livingRoom";
import { AssetImportPanel } from "./AssetImportPanel";

export function InteriorsCabinetRunCatalog({
  tool,
  wallId,
  onAdd,
  onImport,
}: {
  tool: InteriorsChromeTool;
  wallId: string;
  onAdd: (catalogItemId: string, wallId?: string) => void;
  onImport?: (asset: ImportedAsset) => void;
}) {
  const families = interiorsCabinetRunFamilyItems(tool, LIVING_ROOM_CATALOG);
  return (
    <>
      <div className="context-panel-heading">
        <strong>{tool === "shelf" ? "Open shelf" : "Cabinet families"}</strong>
        <span>Place on the selected wall · same identities in 2D and 3D</span>
      </div>
      {onImport ? <AssetImportPanel cabinetMode onAdd={onImport} /> : null}
      <div className="lr-asset-grid lr-run-catalog" data-testid="interiors-cabinet-run-catalog">
        {families.map((item) => {
          const thumbnailUrl = livingRoomThumbnailUrl(item.id);
          const previewLabel = catalogPreviewFallbackLabel(Boolean(thumbnailUrl));
          return (
          <button
            type="button"
            key={item.id}
            onClick={() => onAdd(item.id, wallId || undefined)}
          >
            <span className={`lr-asset-preview is-${item.category}`}>
              {thumbnailUrl
                ? <img src={thumbnailUrl} alt="" loading="lazy" width={120} height={82} />
                : <><i /><i /><i /></>}
              {previewLabel ? <em className="lr-asset-preview-fallback">{previewLabel}</em> : null}
            </span>
            <strong>{item.name}</strong>
            <small>
              {item.cabinetType}
              {" · "}
              {item.dimensions.widthMm} × {item.dimensions.depthMm} mm
              {"sku" in item.parameters && typeof item.parameters.sku === "string"
                ? ` · ${item.parameters.sku}`
                : ""}
            </small>
            <b>Place</b>
          </button>
          );
        })}
      </div>
    </>
  );
}
