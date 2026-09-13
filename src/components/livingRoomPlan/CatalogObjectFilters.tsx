import { CATALOG_ROOM_TYPES } from "../../domain/catalog/catalogRooms";

type Props = {
  query: string;
  room: string;
  subcategory: string;
  subcategories: readonly string[];
  maxWidthMm: string;
  onQuery: (value: string) => void;
  onRoom: (value: string) => void;
  onSubcategory: (value: string) => void;
  onMaxWidthMm: (value: string) => void;
};

export function CatalogObjectFilters(props: Props) {
  return (
    <div className="lr-asset-controls">
      <input
        aria-label="Search catalog objects"
        placeholder="Search name, category, tags…"
        value={props.query}
        onChange={(event) => props.onQuery(event.target.value)}
        data-testid="catalog-object-search"
      />
      <select aria-label="Filter objects by room" value={props.room} data-testid="catalog-object-room"
        onChange={(event) => props.onRoom(event.target.value)}>
        <option value="all">All rooms</option>
        {CATALOG_ROOM_TYPES.map((entry) => (
          <option key={entry.id} value={entry.id}>{entry.label}</option>
        ))}
      </select>
      <select aria-label="Filter objects by type" value={props.subcategory} data-testid="catalog-object-type"
        onChange={(event) => props.onSubcategory(event.target.value)}>
        <option value="all">All types</option>
        {props.subcategories.map((entry) => (
          <option key={entry} value={entry}>{entry.replace(/-/g, " ")}</option>
        ))}
      </select>
      <label className="lr-render-field">
        <span>Max width (mm)</span>
        <input type="number" min={1} step={50} placeholder="Any" aria-label="Maximum object width in millimetres"
          value={props.maxWidthMm} data-testid="catalog-object-max-width"
          onChange={(event) => props.onMaxWidthMm(event.target.value)} />
      </label>
    </div>
  );
}
