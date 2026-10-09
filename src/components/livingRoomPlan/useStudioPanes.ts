import { useEffect, useRef, useState } from "react";
import { fitStudioPanes } from "../../domain/desktopUx/studioPaneFit";

export {
  STUDIO_INSPECTOR_MIN,
  STUDIO_PANE_MAX,
  STUDIO_PANE_MIN,
  studioPaneMax,
  studioPaneWidth,
} from "../../domain/desktopUx/studioPaneFit";

type BodyLayout = { hostWidth: number; chromeWidth: number; catalogShown: boolean; inspectorShown: boolean };

const INITIAL_LAYOUT: BodyLayout = { hostWidth: 1280, chromeWidth: 0, catalogShown: true, inspectorShown: true };

function measureBody(node: HTMLElement): BodyLayout {
  const bodyHeight = node.clientHeight;
  const layout: BodyLayout = { hostWidth: node.clientWidth, chromeWidth: 0, catalogShown: false, inspectorShown: false };
  for (const child of Array.from(node.children)) {
    const classes = child.classList;
    if (classes.contains("lr-catalog")) layout.catalogShown = true;
    else if (classes.contains("lr-inspector")) layout.inspectorShown = true;
    else if (!classes.contains("lr-plan-center")) {
      const rect = child.getBoundingClientRect();
      // Only full-height side columns (the 3D tool rail) compete with the panes for width.
      if (rect.width > 0 && rect.height >= bodyHeight * 0.9) layout.chromeWidth += Math.round(rect.width);
    }
  }
  return layout;
}

function sameLayout(a: BodyLayout, b: BodyLayout) {
  return a.hostWidth === b.hostWidth && a.chromeWidth === b.chromeWidth
    && a.catalogShown === b.catalogShown && a.inspectorShown === b.inspectorShown;
}

export function useStudioPanes(args: {
  catalogWidth: number;
  inspectorWidth: number;
  onCatalogWidth: (width: number) => void;
  onInspectorWidth: (width: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<BodyLayout>(INITIAL_LAYOUT);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => {
      const next = measureBody(node);
      setLayout((current) => (sameLayout(current, next) ? current : next));
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(node);
    const mutation = new MutationObserver(measure);
    mutation.observe(node, { childList: true, attributes: true, attributeFilter: ["class"] });
    return () => {
      resize.disconnect();
      mutation.disconnect();
    };
  }, []);

  const fit = fitStudioPanes({ ...layout, catalog: args.catalogWidth, inspector: args.inspectorWidth });

  return {
    ref,
    ...fit,
    onCatalogWidth: args.onCatalogWidth,
    onInspectorWidth: args.onInspectorWidth,
  };
}
