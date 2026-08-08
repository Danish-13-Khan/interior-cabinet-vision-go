export type OpeningContentType =
  | "door"
  | "drawer-stack"
  | "open-shelf"
  | "divider"
  | "empty";

export type OpeningSplitAxis = "horizontal" | "vertical";

export type DoorStyle = "none" | "single" | "double" | "bi-fold";
export type DoorHinge = "left" | "right" | "both";
export type OpeningStyle = "door" | "drawer" | "open" | "mixed";

export type OpeningLeaf = {
  kind: "leaf";
  id: string;
  label: string;
  contentType: OpeningContentType;
  /** Share of parent split, 0.05–0.95 */
  ratio: number;
  doorStyle?: DoorStyle;
  doorHinge?: DoorHinge;
  drawerCount?: number;
  shelfCount?: number;
  shelvesAdjustable?: boolean;
};

export type OpeningSplit = {
  kind: "split";
  id: string;
  label: string;
  axis: OpeningSplitAxis;
  children: OpeningNode[];
};

export type OpeningNode = OpeningLeaf | OpeningSplit;

export type OpeningStructure = {
  root: OpeningNode;
  activeOpeningId: string;
};
