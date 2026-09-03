import { interiorsCabinetRunFamilyItems, type InteriorsChromeTool } from "../../domain/desktopUx";
import { LIVING_ROOM_CATALOG, type LivingRoomCatalogId } from "../../domain/livingRoom";

export function InteriorsCabinetRunCatalog({
  tool,
  wallId,
  onAdd,
}: {
  tool: InteriorsChromeTool;
  wallId: string;
  onAdd: (catalogItemId: LivingRoomCatalogId, wallId?: string) => void;
}) {
  const families = interiorsCabinetRunFamilyItems(tool, LIVING_ROOM_CATALOG);
  return (
    <>
      <div className="context-panel-heading">
        <strong>{tool === "shelf" ? "Open shelf" : "Cabinet families"}</strong>
        <span>Place on the selected wall · same identities in 2D and 3D</span>
      </div>
      <div className="lr-asset-grid lr-run-catalog" data-testid="interiors-cabinet-run-catalog">
        {families.map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => onAdd(item.id as LivingRoomCatalogId, wallId || undefined)}
          >
            <span className={`lr-asset-preview is-${item.category}`}><i /><i /><i /></span>
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
        ))}
      </div>
    </>
  );
}
