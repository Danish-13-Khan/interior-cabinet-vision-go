export type PropertyFieldType = "number" | "boolean" | "enum" | "readonly" | "action";

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
  label: string;
  hint?: string;
  fields: PropertyFieldDef[];
};

export type PropertyFieldValue = string | number | boolean;
