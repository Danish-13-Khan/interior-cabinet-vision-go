import type { PresetHonestyDescription } from "../../domain/livingRoom/presetHonesty";
import type { RenderTierId } from "../../domain/livingRoom/renderTierHonesty";

type RenderPresetHonestyBadgeProps = {
  honesty: PresetHonestyDescription;
  tierId?: RenderTierId;
  compact?: boolean;
};

/** Plain badge so Draft vs Client Preview vs Still are obvious in the chrome. */
export function RenderPresetHonestyBadge({
  honesty,
  tierId,
  compact = false,
}: RenderPresetHonestyBadgeProps) {
  return (
    <div
      className={`lr-preset-honesty${compact ? " is-compact" : ""}`}
      data-role={honesty.role}
      data-tier={tierId}
      data-testid="lr-preset-honesty"
      title={honesty.subline}
    >
      <strong>{honesty.headline}</strong>
      <span>{honesty.shortBadge}</span>
      {compact ? null : <small>{honesty.subline}</small>}
    </div>
  );
}
