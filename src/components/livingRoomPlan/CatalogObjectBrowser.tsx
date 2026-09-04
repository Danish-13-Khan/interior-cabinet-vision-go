import { useMemo, useState } from "react";
import {
  listObjectBrowserCards,
  OBJECT_BROWSER_CATEGORIES,
  type ObjectBrowserCategoryId,
} from "../../domain/catalog";

type CatalogObjectBrowserProps = {
  onPlace: (catalogItemId: string) => void;
};

/** Curated Kenney object browser — categories, search, lazy isometric thumbs. */
export function CatalogObjectBrowser({ onPlace }: CatalogObjectBrowserProps) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<ObjectBrowserCategoryId>("all");
  const cards = useMemo(
    () => listObjectBrowserCards({ categoryId, text: query }),
    [categoryId, query],
  );

  return (
    <div className="catalog-object-browser" data-testid="catalog-object-browser">
      <div className="context-panel-heading">
        <strong>Object Browser</strong>
        <span>{cards.length} curated models · place in plan</span>
      </div>
      <div className="lr-asset-controls">
        <input
          aria-label="Search catalog objects"
          placeholder="Search name, category, tags…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          data-testid="catalog-object-search"
        />
        <div className="lr-asset-categories" role="tablist" aria-label="Object categories">
          {OBJECT_BROWSER_CATEGORIES.map((category) => (
            <button
              type="button"
              key={category.id}
              role="tab"
              aria-selected={categoryId === category.id}
              className={categoryId === category.id ? "is-active" : ""}
              data-testid={`catalog-object-category-${category.id}`}
              onClick={() => setCategoryId(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>
      <div className="lr-asset-grid" data-testid="catalog-object-grid">
        {cards.map((card) => (
          <button
            type="button"
            key={card.id}
            data-testid={`catalog-object-card-${card.id}`}
            data-catalog-item-id={card.id}
            onClick={() => onPlace(card.id)}
          >
            <span className={`lr-asset-preview is-${card.category}`}>
              {card.thumbnailUrl ? (
                <img src={card.thumbnailUrl} alt="" loading="lazy" width={120} height={82} />
              ) : (
                <><i /><i /><i /></>
              )}
              {card.finishesEditable ? (
                <em className="catalog-object-finish-dot" title="Finishes editable" aria-label="Finishes editable" />
              ) : null}
            </span>
            <strong>{card.name}</strong>
            <small>
              {card.widthMm} × {card.depthMm} mm
              {card.placement !== "floor" ? ` · ${card.placement}` : ""}
            </small>
            <b>Place</b>
          </button>
        ))}
      </div>
    </div>
  );
}
