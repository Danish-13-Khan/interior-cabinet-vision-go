import { useLayoutEffect, type ReactNode } from "react";
import "../marketing.css";

/** Wraps marketing/auth pages; loads scoped marketing CSS without affecting /app. */
export function MarketingShell({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.add("cs-marketing-active");
    // Belt-and-suspenders: desktop tokens set body { overflow: hidden }.
    const prevHtmlOverflow = root.style.overflowY;
    const prevBodyOverflow = document.body.style.overflowY;
    const prevBodyHeight = document.body.style.height;
    const prevRootHeight = (document.getElementById("root") as HTMLElement | null)?.style.height ?? "";
    root.style.overflowY = "auto";
    document.body.style.overflowY = "visible";
    document.body.style.height = "auto";
    const rootEl = document.getElementById("root");
    if (rootEl) rootEl.style.height = "auto";

    return () => {
      root.classList.remove("cs-marketing-active");
      root.style.overflowY = prevHtmlOverflow;
      document.body.style.overflowY = prevBodyOverflow;
      document.body.style.height = prevBodyHeight;
      if (rootEl) rootEl.style.height = prevRootHeight;
    };
  }, []);

  return <div className="cs-marketing">{children}</div>;
}
