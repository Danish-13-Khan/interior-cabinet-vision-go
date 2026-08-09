export type DimKind =
  | "overall"
  | "chain"
  | "run"
  | "selected"
  | "clearance"
  | "opening";

export type DimRenderOptions = {
  dimId?: string;
  dx?: number;
  dy?: number;
  selected?: boolean;
};
