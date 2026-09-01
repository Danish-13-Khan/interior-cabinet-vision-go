import type { RenderMode } from "./renderAssetContracts";
import type { CompiledSceneNode } from "./sceneTypes";

export function compiledNodeLabelVisible(
  node: CompiledSceneNode,
  options: {
    interactive: boolean;
    selected: boolean;
    hovered: boolean;
    renderMode: RenderMode;
    showSelectedLabel?: boolean;
  },
): boolean {
  if (!options.interactive || options.renderMode === "hero") return false;
  return (options.selected && options.showSelectedLabel !== false)
    || (options.hovered && !options.selected)
    || node.placeholder
    || node.metadata.geometryFallback === true;
}

export function compiledNodeLabelText(node: CompiledSceneNode): string {
  if (node.metadata.geometryFallback === true) return `SAFE FALLBACK · ${node.name}`;
  if (node.placeholder) return `Missing adapter · ${node.name}`;
  return node.name;
}
