import { useMemo, useRef, useState, type ReactNode } from "react";
import type { ComponentProps } from "react";
import { TwoDView } from "./TwoDView";
import { WorkspaceViewPane } from "./WorkspaceViewPane";
import { WorkspacePaneNavTools } from "./WorkspacePaneNavTools";
import { DrawingSheetChrome } from "./DrawingSheetChrome";
import { usePaneViewNav } from "../hooks/usePaneViewNav";
import {
  displayPrefsForMode,
  normalizePaneDisplayMode,
  type PaneDisplayMode,
} from "../domain/desktopUx/paneDisplayMode";
import { DEFAULT_DRAFTING_DISPLAY } from "../domain/draftingAnnotations";
import {
  catalogIdFromSheetId,
  findSheetDocument,
  getProjectSheetSet,
  resolveSheetChrome,
  sheetMetaFromChrome,
} from "../domain/sheetDocuments";

type TwoDProps = ComponentProps<typeof TwoDView>;

type WorkspaceDrawingPaneProps = {
  paneId: string;
  sheetId: string;
  title?: string;
  focused: boolean;
  maximized: boolean;
  projectName: string;
  revision?: string;
  view: TwoDProps["view"];
  draftingToolbar?: ReactNode;
  banner?: ReactNode;
  statusExtra?: string;
  onFocus: () => void;
  onToggleMaximize: () => void;
  twoDProps: Omit<TwoDProps, "view" | "draftingDisplay"> & {
    draftingDisplay?: TwoDProps["draftingDisplay"];
  };
};

function viewForKind(
  kind: string,
): TwoDProps["view"] {
  if (
    kind === "front" ||
    kind === "side" ||
    kind === "section" ||
    kind === "detail" ||
    kind === "report"
  ) {
    return kind;
  }
  return "top";
}

export function WorkspaceDrawingPane({
  paneId,
  sheetId,
  title,
  focused,
  maximized,
  projectName,
  revision,
  view,
  draftingToolbar,
  banner,
  statusExtra,
  onFocus,
  onToggleMaximize,
  twoDProps,
}: WorkspaceDrawingPaneProps) {
  const chrome = useMemo(
    () => resolveSheetChrome(sheetId, twoDProps.project),
    [sheetId, twoDProps.project],
  );
  const sheetDoc = useMemo(() => {
    const set = getProjectSheetSet(twoDProps.project);
    return findSheetDocument(set, sheetId);
  }, [sheetId, twoDProps.project]);
  const multiView = (sheetDoc?.viewports.length ?? 0) > 1;
  const catalogSheetId = catalogIdFromSheetId(sheetId);
  const meta = sheetMetaFromChrome({
    ...chrome,
    projectName: chrome.projectName ?? projectName,
    revision: chrome.revision ?? revision,
  });

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const nav = usePaneViewNav();
  const [displayMode, setDisplayMode] = useState<PaneDisplayMode>("working");

  const draftingDisplay = useMemo(
    () =>
      displayPrefsForMode(
        normalizePaneDisplayMode(displayMode),
        twoDProps.draftingDisplay ?? DEFAULT_DRAFTING_DISPLAY,
      ),
    [displayMode, twoDProps.draftingDisplay],
  );

  function handleFit() {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) {
      nav.reset();
      return;
    }
    const sheetEl = content.querySelector(".technical-view") as HTMLElement | null;
    const cw = sheetEl?.offsetWidth || content.scrollWidth || 400;
    const ch = sheetEl?.offsetHeight || content.scrollHeight || 300;
    nav.fit(
      { width: cw, height: ch },
      { width: viewport.clientWidth, height: viewport.clientHeight },
    );
  }

  const cabinetCount = twoDProps.project.cabinets.length;
  const paneTitle = title ?? chrome.title;
  const statusLine = [chrome.code, chrome.scaleText, `${cabinetCount} cab`, statusExtra]
    .filter(Boolean)
    .join(" · ");

  return (
    <WorkspaceViewPane
      paneId={paneId}
      title={paneTitle}
      subtitle={chrome.code}
      focused={focused}
      maximized={maximized}
      onFocus={onFocus}
      onToggleMaximize={onToggleMaximize}
      toolbar={
        <>
          <WorkspacePaneNavTools
            transform={nav.transform}
            sheetScaleText={chrome.scaleText}
            displayMode={displayMode}
            panActive={nav.panActive}
            onFit={handleFit}
            onZoomIn={() => nav.zoomIn()}
            onZoomOut={() => nav.zoomOut()}
            onTogglePan={nav.togglePan}
            onDisplayModeChange={setDisplayMode}
          />
          {draftingToolbar}
        </>
      }
      status={
        <span className="workspace-pane-status-line">
          <strong>{paneTitle}</strong>
          <span>{statusLine}</span>
          {cabinetCount === 0 ? (
            <span className="workspace-pane-status-ready">Ready · place cabinets</span>
          ) : null}
        </span>
      }
    >
      <DrawingSheetChrome
        meta={meta}
        active={focused}
        banner={banner}
        notes={chrome.notes}
        revisionRows={chrome.revisionRows}
        viewports={chrome.viewports}
      >
        <div
          ref={viewportRef}
          className={`drawing-viewport ${nav.panActive ? "is-panning" : ""}`}
          onWheel={(event) => {
            const bounds = viewportRef.current?.getBoundingClientRect();
            if (!bounds) return;
            nav.onViewportWheel(
              event,
              event.clientX - bounds.left,
              event.clientY - bounds.top,
            );
          }}
          onPointerDown={(event) => {
            if (nav.onPanPointerDown(event)) event.preventDefault();
          }}
          onPointerMove={(event) => {
            nav.onPanPointerMove(event);
          }}
          onPointerUp={(event) => {
            nav.onPanPointerUp(event);
          }}
          onPointerCancel={(event) => {
            nav.onPanPointerUp(event);
          }}
        >
          <div
            ref={contentRef}
            className="drawing-viewport-content"
            style={{
              transformOrigin: "0 0",
              transform: `translate(${nav.transform.panX}px, ${nav.transform.panY}px) scale(${nav.transform.zoom})`,
            }}
          >
            {multiView && sheetDoc ? (
              <div className="sheet-composition" data-sheet={sheetDoc.id}>
                {sheetDoc.viewports.map((viewport) => (
                  <div
                    key={viewport.id}
                    className="sheet-composition-viewport"
                    style={{
                      left: `${viewport.x * 100}%`,
                      top: `${viewport.y * 100}%`,
                      width: `${viewport.width * 100}%`,
                      height: `${viewport.height * 100}%`,
                    }}
                  >
                    <div className="sheet-composition-label">
                      <span>{viewport.title}</span>
                      <span>{viewport.scaleText ?? chrome.scaleText}</span>
                    </div>
                    <TwoDView
                      {...twoDProps}
                      view={viewForKind(viewport.viewKind)}
                      draftingDisplay={draftingDisplay}
                      draftingTool={nav.panActive ? "select" : twoDProps.draftingTool}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <TwoDView
                {...twoDProps}
                view={view}
                draftingDisplay={draftingDisplay}
                draftingTool={nav.panActive ? "select" : twoDProps.draftingTool}
              />
            )}
          </div>
          <div className="drawing-viewport-hud" aria-hidden>
            <span>{chrome.shortLabel}</span>
            <span>{chrome.scaleText}</span>
            <span>{catalogSheetId}</span>
          </div>
        </div>
      </DrawingSheetChrome>
    </WorkspaceViewPane>
  );
}
