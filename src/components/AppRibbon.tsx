import { useState } from "react";
import type { AlignmentMode } from "../domain/cabinetAlignment";
import type { RecentFileEntry } from "../domain/desktopUx";

type AppRibbonProps = {
  workspaceLabel: string;
  workspaceTab: "plan" | "front" | "side" | "3d";
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  hasClipboard: boolean;
  selectionCount: number;
  toolRailVisible: boolean;
  inspectorVisible: boolean;
  recentFiles: RecentFileEntry[];
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onOpenRecent: (path: string) => void;
  onClearRecent?: (path: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onAlignRuns: () => void;
  onAlign: (mode: AlignmentMode) => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onExportPdf: () => void;
  onSetViewPreset: (preset: "iso" | "front" | "side" | "top") => void;
  onToggleToolRail: () => void;
  onToggleInspector: () => void;
  onOpenCommands: () => void;
  onOpenShortcuts: () => void;
};

export function AppRibbon({
  workspaceLabel,
  workspaceTab,
  canUndo,
  canRedo,
  hasSelection,
  hasClipboard,
  selectionCount,
  toolRailVisible,
  inspectorVisible,
  recentFiles,
  onNew,
  onOpen,
  onSave,
  onOpenRecent,
  onClearRecent,
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onDuplicate,
  onAlignRuns,
  onAlign,
  onExportJson,
  onExportCsv,
  onExportPdf,
  onSetViewPreset,
  onToggleToolRail,
  onToggleInspector,
  onOpenCommands,
  onOpenShortcuts,
}: AppRibbonProps) {
  const [recentOpen, setRecentOpen] = useState(false);

  return (
    <header className="app-ribbon" aria-label="Command ribbon">
      <div className="ribbon-brand">
        <strong>Cabinet Designer</strong>
        <span>{workspaceLabel}</span>
      </div>

      <div className="ribbon-group">
        <span className="ribbon-group-label">File</span>
        <div className="ribbon-group-actions">
          <button type="button" className="tb-btn" onClick={onNew} title="New project">
            New
          </button>
          <button type="button" className="tb-btn" onClick={onOpen} title="Open JSON file">
            Open
          </button>
          <div className="ribbon-menu">
            <button
              type="button"
              className="tb-btn"
              title="Recent files"
              aria-expanded={recentOpen}
              onClick={() => setRecentOpen((value) => !value)}
            >
              Recent
            </button>
            {recentOpen ? (
              <div className="ribbon-menu-panel" role="menu">
                {recentFiles.length === 0 ? (
                  <div className="ribbon-menu-empty">No recent files</div>
                ) : (
                  recentFiles.map((file) => (
                    <div key={file.path} className="ribbon-menu-row">
                      <button
                        type="button"
                        role="menuitem"
                        className="ribbon-menu-item"
                        title={file.path}
                        onClick={() => {
                          onOpenRecent(file.path);
                          setRecentOpen(false);
                        }}
                      >
                        <strong>{file.name}</strong>
                        <small>{file.path}</small>
                      </button>
                      {onClearRecent ? (
                        <button
                          type="button"
                          className="ribbon-menu-forget"
                          title="Remove from recent"
                          onClick={() => onClearRecent(file.path)}
                        >
                          ×
                        </button>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            ) : null}
          </div>
          <button type="button" className="tb-btn" onClick={onSave} title="Save JSON file">
            Save
          </button>
        </div>
      </div>

      <div className="ribbon-group">
        <span className="ribbon-group-label">Edit</span>
        <div className="ribbon-group-actions">
          <button type="button" className="tb-btn" onClick={onUndo} disabled={!canUndo} title="Undo">
            Undo
          </button>
          <button type="button" className="tb-btn" onClick={onRedo} disabled={!canRedo} title="Redo">
            Redo
          </button>
          <button
            type="button"
            className="tb-btn"
            onClick={onCopy}
            disabled={!hasSelection}
            title="Copy"
          >
            Copy
          </button>
          <button
            type="button"
            className="tb-btn"
            onClick={onPaste}
            disabled={!hasClipboard}
            title="Paste"
          >
            Paste
          </button>
          <button
            type="button"
            className="tb-btn"
            onClick={onDuplicate}
            disabled={!hasSelection}
            title="Duplicate"
          >
            Duplicate
          </button>
        </div>
      </div>

      <div className="ribbon-group">
        <span className="ribbon-group-label">Arrange</span>
        <div className="ribbon-group-actions">
          <button type="button" className="tb-btn" onClick={onAlignRuns} title="Auto align cabinet runs">
            Align Runs
          </button>
          <button
            type="button"
            className="tb-btn"
            onClick={() => onAlign("align-left")}
            disabled={selectionCount < 2}
          >
            Left
          </button>
          <button
            type="button"
            className="tb-btn"
            onClick={() => onAlign("align-center-x")}
            disabled={selectionCount < 2}
          >
            Center X
          </button>
          <button
            type="button"
            className="tb-btn"
            onClick={() => onAlign("align-top")}
            disabled={selectionCount < 2}
          >
            Top
          </button>
          <button
            type="button"
            className="tb-btn"
            onClick={() => onAlign("distribute-x")}
            disabled={selectionCount < 3}
          >
            Distribute X
          </button>
        </div>
      </div>

      <div className="ribbon-group">
        <span className="ribbon-group-label">View</span>
        <div className="ribbon-group-actions">
          <button
            type="button"
            className={`tb-btn ${toolRailVisible ? "tb-accent" : ""}`}
            onClick={onToggleToolRail}
            title="Toggle tool rail"
          >
            Rail
          </button>
          <button
            type="button"
            className={`tb-btn ${inspectorVisible ? "tb-accent" : ""}`}
            onClick={onToggleInspector}
            title="Toggle inspector"
          >
            Inspector
          </button>
        </div>
      </div>

      <div className="ribbon-group">
        <span className="ribbon-group-label">Export</span>
        <div className="ribbon-group-actions">
          <button type="button" className="tb-btn" onClick={onExportJson} title="Export JSON">
            JSON
          </button>
          <button type="button" className="tb-btn" onClick={onExportCsv} title="Export CSV">
            CSV
          </button>
          <button type="button" className="tb-btn tb-accent" onClick={onExportPdf} title="Download PDF">
            PDF
          </button>
        </div>
      </div>

      {workspaceTab === "3d" ? (
        <div className="ribbon-group">
          <span className="ribbon-group-label">Model Camera</span>
          <div className="ribbon-group-actions">
            <button type="button" className="tb-btn" onClick={() => onSetViewPreset("iso")} title="ISO view">
              ISO
            </button>
            <button
              type="button"
              className="tb-btn"
              onClick={() => onSetViewPreset("front")}
              title="Front camera"
            >
              Front
            </button>
            <button
              type="button"
              className="tb-btn"
              onClick={() => onSetViewPreset("side")}
              title="Side camera"
            >
              Side
            </button>
            <button
              type="button"
              className="tb-btn"
              onClick={() => onSetViewPreset("top")}
              title="Top camera"
            >
              Top
            </button>
          </div>
        </div>
      ) : null}

      <div className="ribbon-group ribbon-group-end">
        <span className="ribbon-group-label">Tools</span>
        <div className="ribbon-group-actions">
          <button type="button" className="tb-btn" onClick={onOpenCommands} title="Command palette">
            Commands
          </button>
          <button type="button" className="tb-btn" onClick={onOpenShortcuts} title="Shortcut help">
            Shortcuts
          </button>
        </div>
      </div>
    </header>
  );
}
