/** Current construction key. Suffixes change when opening counts change. */
export type ConstructionKey = string;

export type PartIdentityLink = {
  cabinetId: string;
  constructionKey: ConstructionKey;
  cutlistKey: string;
  shopRef: string | null;
  label: string;
  /** Geometry mesh names that resolve to this cut-list line. Empty when 3D has no mesh. */
  geometryNames: string[];
  /** Selection id shared by a future part tree node. Not a SceneTreeNodeKind today. */
  treePartId: string;
};

export type PartIdentityGap = {
  kind: "cutlist-without-geometry" | "geometry-without-cutlist";
  cabinetId: string;
  ref: string;
  detail: string;
};

export type CabinetPartIndex = {
  cabinetId: string;
  links: PartIdentityLink[];
  gaps: PartIdentityGap[];
};
