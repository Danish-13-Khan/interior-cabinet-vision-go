/** Architectural glass finishes shared by showers and other partition slots. */
export const PARTITION_GLASS_TAG = "partition-glass";

export const PARTITION_GLASS_CATALOG_IDS = [
  "material:core:glass-clear:v1",
  "material:core:glass-frosted:v1",
  "material:core:glass-fluted:v1",
  "material:core:glass-brown-tinted:v1",
  "material:core:glass-matte:v1",
  "material:core:glass-rough:v1",
  "material:core:glass-toughened:v1",
] as const;

/** New partition tag plus tags older saved snapshots still carry. */
export const SHOWER_GLASS_SLOT_TAGS = [
  PARTITION_GLASS_TAG,
  "clear-glass",
  "frosted-glass",
] as const;
