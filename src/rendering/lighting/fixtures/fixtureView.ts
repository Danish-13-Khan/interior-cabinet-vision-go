import type { LightEntity } from "../../../domain/interiorProject";

/** Props every kind renderer receives. Render Studio leaves selection unset. */
export type FixtureViewProps = {
  light: LightEntity;
  intensityScale: number;
  castShadow: boolean;
  /** False in the apartment overview: the mesh stays, the shader light does not. */
  emitsLight?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
  /** Commit of a 3D drag, world millimetres. Unset where lights cannot be moved. */
  onMove?: (id: string, point: { x: number; y: number; z: number }) => void;
  /** True while dragging, so the view stops orbiting. */
  onDragState?: (dragging: boolean) => void;
};
