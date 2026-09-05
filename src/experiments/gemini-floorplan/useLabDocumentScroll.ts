import { useLayoutEffect } from "react";

/** Lab routes must scroll; desktop App tokens can leave body overflow:hidden. */
export function useLabDocumentScroll() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const rootEl = document.getElementById("root");
    const prev = {
      htmlOverflowY: root.style.overflowY,
      htmlHeight: root.style.height,
      bodyOverflowY: document.body.style.overflowY,
      bodyHeight: document.body.style.height,
      rootHeight: rootEl?.style.height ?? "",
    };

    root.style.overflowY = "auto";
    root.style.height = "auto";
    document.body.style.overflowY = "auto";
    document.body.style.height = "auto";
    if (rootEl) rootEl.style.height = "auto";

    return () => {
      root.style.overflowY = prev.htmlOverflowY;
      root.style.height = prev.htmlHeight;
      document.body.style.overflowY = prev.bodyOverflowY;
      document.body.style.height = prev.bodyHeight;
      if (rootEl) rootEl.style.height = prev.rootHeight;
    };
  }, []);
}
