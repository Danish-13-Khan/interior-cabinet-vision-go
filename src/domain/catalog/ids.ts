/** Stable built-in catalog ID helpers. Filenames and vendor names are never item IDs. */

export function camelStemToKebab(stem: string): string {
  return stem
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

export function builtInItemId(stem: string, version = 1): string {
  return `${camelStemToKebab(stem)}-${version}`;
}

/** @deprecated Use builtInItemId. Kept while callers migrate from the old helper name. */
export function kenneyItemId(stem: string): string {
  return builtInItemId(stem);
}

export function kenneyModelId(stem: string, version = 1): string {
  return `model:kenney:${camelStemToKebab(stem)}:v${version}`;
}

export function kenneyIsoImageId(
  stem: string,
  angle: string,
  version = 1,
): string {
  return `image:kenney:${camelStemToKebab(stem)}:iso-${angle.toLowerCase()}:v${version}`;
}

export function kenneySideImageId(stem: string, version = 1): string {
  return `image:kenney:${camelStemToKebab(stem)}:side:v${version}`;
}

export function displayNameFromStem(stem: string): string {
  const spaced = stem.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
