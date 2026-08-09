import type { ReactNode } from "react";
import type { DrawingSheetMeta } from "../domain/drawingSheets";
import type { SheetRevisionRow, SheetViewport } from "../domain/sheetDocuments";

type DrawingSheetChromeProps = {
  meta: DrawingSheetMeta;
  active?: boolean;
  banner?: ReactNode;
  children: ReactNode;
  className?: string;
  notes?: string[];
  revisionRows?: SheetRevisionRow[];
  viewports?: SheetViewport[];
  footer?: ReactNode;
};

export function DrawingSheetChrome({
  meta,
  active = false,
  banner,
  children,
  className = "",
  notes = [],
  revisionRows = [],
  viewports = [],
  footer,
}: DrawingSheetChromeProps) {
  const revision = revisionRows[0];
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
      {viewports.length > 1 ? (
        <div className="drawing-sheet-viewport-strip" aria-label="Placed views">
          {viewports.map((viewport) => (
            <span key={viewport.id} className="drawing-sheet-viewport-chip">
              {viewport.title}
              {viewport.scaleText ? ` · ${viewport.scaleText}` : ""}
            </span>
          ))}
        </div>
      ) : null}
      {banner}
      <div className="drawing-sheet-scroll">{children}</div>
      {(notes.length > 0 || revision || footer) && (
        <footer className="drawing-sheet-doc-footer" aria-label="Sheet documentation">
          {revision ? (
            <div className="drawing-sheet-rev-area">
              <strong>Revisions</strong>
              <span>
                {revision.revision} · {revision.date} · {revision.description} ·{" "}
                {revision.by}
              </span>
            </div>
          ) : null}
          {notes.length > 0 ? (
            <div className="drawing-sheet-notes-area">
              <strong>Notes</strong>
              <ul>
                {notes.slice(0, 4).map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {footer}
        </footer>
      )}
    </div>
  );
}
