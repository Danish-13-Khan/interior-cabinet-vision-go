import { APARTMENT_TEMPLATE_CARDS } from "../../domain/apartmentTemplates/apartmentCards";

type Props = {
  onCreate: (apartmentTemplateId: string) => void;
};

/** Apartment templates section above single-room catalog cards (Phase 6). */
export function InteriorsApartmentTemplates({ onCreate }: Props) {
  return (
    <section
      className="planner-v2-starts interiors-apartment-templates"
      data-testid="interiors-apartment-templates"
    >
      <header className="app-home-section-head">
        <h2>Apartment templates</h2>
        <small>Multi-room showcases with finishes, lighting, and hardware</small>
      </header>
      <div>
        {APARTMENT_TEMPLATE_CARDS.map((card) => (
          <button
            type="button"
            key={card.id}
            data-testid={`apartment-template-${card.id}`}
            data-template-id={card.id}
            onClick={() => onCreate(card.id)}
          >
            <span className="interiors-template-thumb-fallback" aria-hidden />
            <strong>{card.name}</strong>
            <small>
              {card.areaM2} m² · {card.roomCount} rooms — {card.description}
            </small>
          </button>
        ))}
      </div>
    </section>
  );
}
