import { useMemo, useState } from "react";
import {
  listObjectBrowserCards,
  OBJECT_BROWSER_CATEGORIES,
  type ObjectBrowserCategoryId,
} from "../../domain/catalog";
import { uniqueSubcategories, parseOptionalMm } from "../../domain/catalog/objectBrowserQuery";
import { listObjectBrowserItems } from "../../domain/catalog/objectBrowser";
import { millworkShortcutsForRoom } from "../../domain/livingRoom/millworkShortcuts";
import { catalogPreviewFallbackLabel } from "../../domain/livingRoom/modelQualityFeedback";
import { CatalogObjectFilters } from "./CatalogObjectFilters";

type CatalogObjectBrowserProps = {
  onPlace: (catalogItemId: string) => void;
};

/** Curated Kenney object browser plus parametric millwork shortcuts. */
export function CatalogObjectBrowser({ onPlace }: CatalogObjectBrowserProps) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<ObjectBrowserCategoryId>("all");
  const [room, setRoom] = useState("all");
  const [subcategory, setSubcategory] = useState("all");
  const [maxWidthMm, setMaxWidthMm] = useState("");
  const cards = useMemo(
    () => listObjectBrowserCards({
      categoryId, text: query, room, subcategory, maxWidthMm: parseOptionalMm(maxWidthMm),
    }),
    [categoryId, query, room, subcategory, maxWidthMm],
  );
  const subcategories = useMemo(
    () => uniqueSubcategories(listObjectBrowserItems({ categoryId, room })),
    [categoryId, room],
  );
  const millwork = useMemo(() => millworkShortcutsForRoom(room), [room]);

  return (
    <div className="catalog-object-browser" data-testid="catalog-object-browser">
      <div className="context-panel-heading">
        <strong>Object Browser</strong>
        <span>{cards.length} curated models · place in plan</span>
      </div>
      <CatalogObjectFilters
        query={query} room={room} subcategory={subcategory} subcategories={subcategories}
        maxWidthMm={maxWidthMm} onQuery={setQuery} onRoom={setRoom}
        onSubcategory={setSubcategory} onMaxWidthMm={setMaxWidthMm}
      />
      <div className="lr-asset-categories" role="tablist" aria-label="Object categories">
        {OBJECT_BROWSER_CATEGORIES.map((category) => (
          <button type="button" key={category.id} role="tab" aria-selected={categoryId === category.id}
            className={categoryId === category.id ? "is-active" : ""}
            data-testid={`catalog-object-category-${category.id}`}
            onClick={() => setCategoryId(category.id)}>
            {category.label}
          </button>
        ))}
      </div>
      {millwork.length > 0 ? (
        <div className="lr-asset-grid" data-testid="catalog-millwork-shortcuts">
          {millwork.map((item) => (
            <button type="button" key={item.id} data-testid={`catalog-millwork-${item.id}`}
              onClick={() => onPlace(item.id)}>
              <span className={`lr-asset-preview is-${item.category}`}><i /><i /><i /></span>
              <strong>{item.name}</strong>
              <small>{item.dimensions.widthMm} × {item.dimensions.depthMm} mm · millwork</small>
              <b>Place</b>
            </button>
          ))}
        </div>
      ) : null}
      <div className="lr-asset-grid" data-testid="catalog-object-grid">
        {cards.map((card) => {
          const previewLabel = catalogPreviewFallbackLabel(Boolean(card.thumbnailUrl));
          return (
            <button type="button" key={card.id} data-testid={`catalog-object-card-${card.id}`}
              data-catalog-item-id={card.id} onClick={() => onPlace(card.id)}>
              <span className={`lr-asset-preview is-${card.category}`}>
                {card.thumbnailUrl
                  ? <img src={card.thumbnailUrl} alt="" loading="lazy" width={120} height={82} />
                  : <><i /><i /><i /></>}
                {previewLabel
                  ? <em className="lr-asset-preview-fallback" data-testid="catalog-preview-unavailable">{previewLabel}</em>
                  : null}
                {card.finishesEditable
                  ? <em className="catalog-object-finish-dot" title="Finishes editable" aria-label="Finishes editable" />
                  : null}
              </span>
              <strong>{card.name}</strong>
              <small>{card.widthMm} × {card.depthMm} mm{card.placement !== "floor" ? ` · ${card.placement}` : ""}</small>
              <b>Place</b>
            </button>
          );
        })}
      </div>
    </div>
  );
}
