import type { ReactNode } from "react";
import type { DrawingSheetMeta } from "../domain/drawingSheets";

type DrawingSheetChromeProps = {
  meta: DrawingSheetMeta;
  active?: boolean;
  banner?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function DrawingSheetChrome({
  meta,
  active = false,
  banner,
  children,
  className = "",
}: DrawingSheetChromeProps) {
  return (
    <div
      className={`drawing-sheet drawing-sheet-embedded ${active ? "is-active-sheet" : ""} ${className}`.trim()}
      data-sheet-code={meta.code}
    >
      <header className="drawing-sheet-meta" aria-label={`${meta.code} title bar`}>
        <div className="drawing-sheet-meta-left">
          <strong className="drawing-sheet-code">{meta.code}</strong>
          <span className="drawing-sheet-title">{meta.title}</span>
          {meta.projectName ? (
            <span className="drawing-sheet-project">{meta.projectName}</span>
          ) : null}
        </div>
        <div className="drawing-sheet-meta-right">
          {meta.revision ? <span>Rev {meta.revision}</span> : null}
          <span className="drawing-sheet-scale">{meta.scaleText}</span>
        </div>
      </header>
      {banner}
      <div className="drawing-sheet-scroll">{children}</div>
    </div>
  );
}
