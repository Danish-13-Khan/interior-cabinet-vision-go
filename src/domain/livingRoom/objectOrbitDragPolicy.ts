/** Left-drag orbits unless the object is already selected (then body-drag). */

export function shouldBeginObjectBodyDrag(options: {
  alreadySelected: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  ctrlKey: boolean;
}): boolean {
  if (!options.alreadySelected) return false;
  if (options.shiftKey || options.metaKey || options.ctrlKey) return false;
  return true;
}

export function samePoint3Mm(
  left: { x: number; y: number; z: number },
  right: { x: number; y: number; z: number },
): boolean {
  return left.x === right.x && left.y === right.y && left.z === right.z;
}
