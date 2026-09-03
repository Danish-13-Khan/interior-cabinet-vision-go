/** Stable Kenney ID helpers (mirrors src/domain/catalog/ids.ts). */

export function camelStemToKebab(stem) {
  return stem
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

export function kenneyItemId(stem) {
  return `kenney:${camelStemToKebab(stem)}`;
}

export function kenneyModelId(stem, version = 1) {
  return `model:kenney:${camelStemToKebab(stem)}:v${version}`;
}

export function kenneyIsoImageId(stem, angle, version = 1) {
  return `image:kenney:${camelStemToKebab(stem)}:iso-${angle.toLowerCase()}:v${version}`;
}

export function kenneySideImageId(stem, version = 1) {
  return `image:kenney:${camelStemToKebab(stem)}:side:v${version}`;
}

export function displayNameFromStem(stem) {
  const spaced = stem
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
