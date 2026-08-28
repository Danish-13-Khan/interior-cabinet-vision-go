import { openingCatalogForKind, type OpeningCatalogSymbol } from "../../domain/livingRoom";

function Preview({ symbol }: { symbol: OpeningCatalogSymbol }) {
  return <svg viewBox="0 0 120 72" aria-hidden="true" className="lr-opening-catalog-preview">
    <path d="M12 60H108" className="wall" />
    {symbol === "single-swing" ? <><path d="M28 60V18H76" /><path d="M28 60A48 48 0 0 1 76 12" className="swing" /></> : null}
    {symbol === "double-swing" ? <><path d="M18 60V25H60M102 60V25H60" /><path d="M18 60A42 42 0 0 1 60 18M102 60A42 42 0 0 0 60 18" className="swing" /></> : null}
    {symbol === "sliding" ? <><rect x="18" y="18" width="84" height="42" /><path d="M60 18V60M34 38H86M76 30L86 38L76 46" className="glass" /></> : null}
    {symbol === "pocket" ? <><path d="M25 60V18H78" /><path d="M25 60H94" className="swing" /><path d="M86 26V54" className="glass" /></> : null}
    {symbol === "fixed-glass" ? <><rect x="25" y="16" width="70" height="44" /><path d="M60 16V60M25 38H95" className="glass" /></> : null}
    {symbol === "casement" ? <><rect x="28" y="14" width="64" height="46" /><path d="M28 14L72 8V60L28 60" className="swing" /><path d="M28 37H92" className="glass" /></> : null}
    {symbol === "awning" ? <><rect x="22" y="25" width="76" height="35" /><path d="M22 25L98 25L88 12L32 12Z" className="swing" /><path d="M22 43H98" className="glass" /></> : null}
    {symbol === "picture-window" ? <><rect x="18" y="12" width="84" height="48" /><path d="M18 36H102" className="glass" /></> : null}
  </svg>;
}

export function OpeningCatalogPanel({ kind, selectedId, onSelect }: {
  kind: "door" | "window";
  selectedId: string;
  onSelect: (catalogItemId: string) => void;
}) {
  return <div className="lr-opening-catalog" aria-label={`${kind} catalog`}>
    {openingCatalogForKind(kind).map((item) => <button type="button" key={item.catalogItemId} data-catalog-item={item.catalogItemId} className={selectedId === item.catalogItemId ? "is-active" : ""} onClick={() => onSelect(item.catalogItemId)}>
      <Preview symbol={item.symbol} />
      <strong>{item.name}</strong>
      <small>{item.defaults.widthMm} × {item.defaults.heightMm} mm</small>
      <span>{item.materialSlots.join(" · ")}</span>
    </button>)}
  </div>;
}
