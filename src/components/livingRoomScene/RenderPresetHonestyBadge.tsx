import type { PresetHonestyDescription } from "../../domain/livingRoom/presetHonesty";

type RenderPresetHonestyBadgeProps = {
  honesty: PresetHonestyDescription;
  compact?: boolean;
};

/** Plain badge so Draft vs Client Preview are obvious in the chrome. */
export function RenderPresetHonestyBadge({
  honesty,
  compact = false,
}: RenderPresetHonestyBadgeProps) {
  return (
    <div
      className={`lr-preset-honesty${compact ? " is-compact" : ""}`}
      data-role={honesty.role}
      data-testid="lr-preset-honesty"
      title={honesty.subline}
    >
      <strong>{honesty.headline}</strong>
      <span>{honesty.shortBadge}</span>
      {compact ? null : <small>{honesty.subline}</small>}
    </div>
  );
}
