import type { ReactNode } from "react";

type WorkspaceViewPaneProps = {
  paneId: string;
  title: string;
  focused: boolean;
  maximized: boolean;
  subtitle?: string;
  toolbar?: ReactNode;
  status?: ReactNode;
  onFocus: () => void;
  onToggleMaximize: () => void;
  children: ReactNode;
};

export function WorkspaceViewPane({
  paneId,
  title,
  focused,
  maximized,
  subtitle,
  toolbar,
  status,
  onFocus,
  onToggleMaximize,
  children,
}: WorkspaceViewPaneProps) {
  return (
    <section
      className={`workspace-pane ${focused ? "is-focused" : ""} ${maximized ? "is-maximized" : ""}`}
      data-pane={paneId}
      aria-label={title}
      onMouseDown={onFocus}
    >
      <header className="workspace-pane-header">
        <button
          type="button"
          className="workspace-pane-title"
          onClick={onFocus}
          title={`Focus ${title}`}
        >
          <span className="workspace-pane-title-mark" aria-hidden />
          <span>{title}</span>
          {subtitle ? <small>{subtitle}</small> : null}
        </button>
        <div className="workspace-pane-tools">
          {toolbar}
          <button
            type="button"
            className="tb-btn workspace-pane-max-btn"
            title={maximized ? "Restore split view" : "Maximize pane"}
            onClick={(event) => {
              event.stopPropagation();
              onToggleMaximize();
            }}
          >
            {maximized ? "Restore" : "Max"}
          </button>
        </div>
      </header>
      <div className="workspace-pane-body">{children}</div>
      {status ? (
        <footer className="workspace-pane-status">{status}</footer>
      ) : null}
    </section>
  );
}
