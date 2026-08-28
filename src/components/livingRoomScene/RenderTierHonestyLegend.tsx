import { RENDER_TIER_LEGEND } from "../../domain/livingRoom";

/** Three-tier honesty legend for Render Studio settings. */
export function RenderTierHonestyLegend() {
  return (
    <section className="lr-render-tier-legend" aria-label="Presentation tier honesty">
      <h3>Tier honesty</h3>
      <ul>
        {RENDER_TIER_LEGEND.map((tier) => (
          <li key={tier.tierId} data-tier={tier.tierId}>
            <strong>{tier.headline}</strong>
            <span>{tier.shortBadge}</span>
            <small>{tier.subline}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}
