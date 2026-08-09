import { useEffect, useRef, type KeyboardEvent, type MouseEvent } from "react";
import type { SceneTreeNode } from "../../domain/sceneTree";

type CabinetTreeRowProps = {
  node: SceneTreeNode;
  depth: number;
  expanded: Set<string>;
  activeRoomId: string | null;
  activeCabinetId: string | null;
  selectedCabinetIds: string[];
  activeOpeningId: string | null;
  isolatedCabinetIds: string[] | null;
  renamingId: string | null;
  renameValue: string;
  onToggleExpand: (nodeId: string) => void;
  onActivate: (node: SceneTreeNode, additive: boolean) => void;
  onStartRename: (node: SceneTreeNode) => void;
  onRenameChange: (value: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onIsolate: (node: SceneTreeNode) => void;
  onFocus: (node: SceneTreeNode) => void;
  onReorder: (node: SceneTreeNode, direction: -1 | 1) => void;
  onCabinetContextMenu?: (
    cabinetId: string,
    point: { x: number; y: number },
  ) => void;
};

function isNodeSelected(
  node: SceneTreeNode,
  selectedCabinetIds: string[],
  activeOpeningId: string | null,
  activeCabinetId: string | null,
) {
  if (node.kind === "opening") {
    return (
      node.openingId === activeOpeningId && node.cabinetId === activeCabinetId
    );
  }
  if (node.kind === "cabinet") {
    return Boolean(node.cabinetId && selectedCabinetIds.includes(node.cabinetId));
  }
  if (node.cabinetIds.length === 0) return false;
  return node.cabinetIds.every((id) => selectedCabinetIds.includes(id));
}

function isNodeActive(
  node: SceneTreeNode,
  activeRoomId: string | null,
  activeCabinetId: string | null,
  activeOpeningId: string | null,
) {
  if (node.kind === "room") return node.roomId === activeRoomId;
  if (node.kind === "opening") {
    return (
      node.openingId === activeOpeningId && node.cabinetId === activeCabinetId
    );
  }
  if (node.kind === "cabinet") return node.cabinetId === activeCabinetId;
  return Boolean(
    activeCabinetId && node.cabinetIds.includes(activeCabinetId),
  );
}

export function CabinetTreeRow({
  node,
  depth,
  expanded,
  activeRoomId,
  activeCabinetId,
  selectedCabinetIds,
  activeOpeningId,
  isolatedCabinetIds,
  renamingId,
  renameValue,
  onToggleExpand,
  onActivate,
  onStartRename,
  onRenameChange,
  onCommitRename,
  onCancelRename,
  onIsolate,
  onFocus,
  onReorder,
  onCabinetContextMenu,
}: CabinetTreeRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const hasChildren = node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const selected = isNodeSelected(
    node,
    selectedCabinetIds,
    activeOpeningId,
    activeCabinetId,
  );
  const active = isNodeActive(
    node,
    activeRoomId,
    activeCabinetId,
    activeOpeningId,
  );
  const isRenaming = renamingId === node.id;
  const canRename = node.kind === "cabinet" || node.kind === "room";
  const canReorder = node.kind === "cabinet" && Boolean(node.runId);
  const isolated =
    isolatedCabinetIds != null &&
    node.cabinetIds.length > 0 &&
    node.cabinetIds.every((id) => isolatedCabinetIds.includes(id)) &&
    isolatedCabinetIds.length === node.cabinetIds.length;

  useEffect(() => {
    if (!active || !rowRef.current) return;
    rowRef.current.scrollIntoView({ block: "nearest" });
  }, [active, activeCabinetId, activeOpeningId]);

  function handleRowClick(event: MouseEvent) {
    if (isRenaming) return;
    onActivate(
      node,
      event.metaKey || event.ctrlKey || event.shiftKey,
    );
  }

  function handleRenameKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      onCommitRename();
    } else if (event.key === "Escape") {
      event.preventDefault();
      onCancelRename();
    }
  }

  return (
    <>
      <div
        ref={rowRef}
        className={`cabinet-tree-row ${selected ? "is-selected" : ""} ${active ? "is-active" : ""} ${isolated ? "is-isolated" : ""}`}
        data-kind={node.kind}
        data-node-id={node.id}
        data-cabinet-id={node.cabinetId ?? undefined}
        style={{ ["--tree-depth" as string]: depth }}
        onClick={handleRowClick}
        onDoubleClick={(event) => {
          event.stopPropagation();
          if (canRename) onStartRename(node);
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          onActivate(node, false);
          if (node.cabinetId && onCabinetContextMenu) {
            onCabinetContextMenu(node.cabinetId, {
              x: event.clientX,
              y: event.clientY,
            });
          }
        }}
        role="treeitem"
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-selected={selected || active}
        title={`${node.label} · ${node.detail}`}
      >
        <button
          type="button"
          className={`cabinet-tree-twist ${hasChildren ? "" : "is-leaf"}`}
          aria-label={isExpanded ? "Collapse" : "Expand"}
          disabled={!hasChildren}
          onClick={(event) => {
            event.stopPropagation();
            if (hasChildren) onToggleExpand(node.id);
          }}
        >
          {hasChildren ? (isExpanded ? "▾" : "▸") : ""}
        </button>

        <span
          className={`cabinet-tree-icon tone-${node.iconTone}`}
          aria-hidden
        >
          {node.icon}
        </span>

        <span className="cabinet-tree-copy">
          {isRenaming ? (
            <input
              className="cabinet-tree-rename"
              value={renameValue}
              autoFocus
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => onRenameChange(event.target.value)}
              onBlur={onCommitRename}
              onKeyDown={handleRenameKey}
            />
          ) : (
            <>
              <strong>{node.label}</strong>
              <small>{node.detail}</small>
            </>
          )}
        </span>

        <span className="cabinet-tree-actions" onClick={(event) => event.stopPropagation()}>
          {canReorder ? (
            <>
              <button
                type="button"
                className="cabinet-tree-action"
                title="Move earlier in run"
                onClick={() => onReorder(node, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                className="cabinet-tree-action"
                title="Move later in run"
                onClick={() => onReorder(node, 1)}
              >
                ↓
              </button>
            </>
          ) : null}
          {node.cabinetIds.length > 0 ? (
            <>
              <button
                type="button"
                className={`cabinet-tree-action ${isolated ? "is-on" : ""}`}
                title={isolated ? "Show all" : "Isolate"}
                onClick={() => onIsolate(node)}
              >
                ◐
              </button>
              <button
                type="button"
                className="cabinet-tree-action"
                title="Focus"
                onClick={() => onFocus(node)}
              >
                ◎
              </button>
            </>
          ) : null}
          {canRename ? (
            <button
              type="button"
              className="cabinet-tree-action"
              title="Rename"
              onClick={() => onStartRename(node)}
            >
              ✎
            </button>
          ) : null}
        </span>
      </div>

      {hasChildren && isExpanded
        ? node.children.map((child) => (
            <CabinetTreeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              activeRoomId={activeRoomId}
              activeCabinetId={activeCabinetId}
              selectedCabinetIds={selectedCabinetIds}
              activeOpeningId={activeOpeningId}
              isolatedCabinetIds={isolatedCabinetIds}
              renamingId={renamingId}
              renameValue={renameValue}
              onToggleExpand={onToggleExpand}
              onActivate={onActivate}
              onStartRename={onStartRename}
              onRenameChange={onRenameChange}
              onCommitRename={onCommitRename}
              onCancelRename={onCancelRename}
              onIsolate={onIsolate}
              onFocus={onFocus}
              onReorder={onReorder}
              onCabinetContextMenu={onCabinetContextMenu}
            />
          ))
        : null}
    </>
  );
}
