export type PropertyFieldType = "number" | "boolean" | "enum" | "readonly" | "action";

/** Top-level engineering groups in the structured property inspector. */
export type PropertyGroupId =
  | "placement"
  | "dimensions"
  | "construction"
  | "openings"
  | "materials"
  | "reports";

export type PropertyFieldOption = {
  value: string;
  label: string;
};

export type PropertyFieldDef = {
  id: string;
  label: string;
  type: PropertyFieldType;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: PropertyFieldOption[];
  hint?: string;
  actionLabel?: string;
};

export type PropertySectionDef = {
  id: string;
  /** Engineering group this section belongs to. */
  group: PropertyGroupId;
  label: string;
  hint?: string;
  fields: PropertyFieldDef[];
};

export type PropertyFieldValue = string | number | boolean;

export type PropertyFieldIssue = {
  severity: "info" | "warning" | "error";
  message: string;
  code?: string;
};

export const PROPERTY_GROUP_ORDER: PropertyGroupId[] = [
  "placement",
  "dimensions",
  "construction",
  "openings",
  "materials",
  "reports",
];

export const PROPERTY_GROUP_LABELS: Record<PropertyGroupId, string> = {
  placement: "Placement",
  dimensions: "Dimensions",
  construction: "Construction",
  openings: "Openings",
  materials: "Materials",
  reports: "Reports",
};
