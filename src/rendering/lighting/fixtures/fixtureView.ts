import type { LightEntity } from "../../../domain/interiorProject";

/** Props every kind renderer receives. Render Studio leaves selection unset. */
export type FixtureViewProps = {
  light: LightEntity;
  intensityScale: number;
  castShadow: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
};
