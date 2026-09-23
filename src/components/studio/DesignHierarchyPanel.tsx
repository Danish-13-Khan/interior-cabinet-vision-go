import { useEffect, useLayoutEffect, useMemo, useState, type PointerEvent as ReactPointerEvent } from "react";
import { filterDesignHierarchy, type DesignHierarchyNode } from "../../domain/studio/designHierarchy";
import { collapseHierarchy, visibleHierarchyNodes } from "../../domain/studio/manufacturingTree";
import type { ViewportObjectFilter } from "../../domain/studio/viewportVisibility";

export function DesignHierarchyPanel(props: {
  nodes: DesignHierarchyNode[];
  selectedIds: readonly string[];
  selectedCutlistKey: string | null;
  activeWallId: string | null;
  activeOpeningId: string | null;
  activeRoomId: string | null;
  projectId: string;
  onSelectNode: (node: DesignHierarchyNode) => void;
  onFocus: () => void;
  onViewportVisibility?: (filter: ViewportObjectFilter) => void;
}) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [isolatedObjectId, setIsolatedObjectId] = useState<string | null>(null);
  const [hiddenObjectIds, setHiddenObjectIds] = useState<string[]>([]);
  const contextKey = `${props.projectId}:${props.activeRoomId ?? ""}`;
  const [isolationContext, setIsolationContext] = useState(contextKey);
  const activeIsolation = isolationContext === contextKey ? isolatedObjectId : null;
  const selectedObjectId = props.nodes.find((node) =>
    (node.pieceId && node.pieceId === props.selectedCutlistKey)
    || (node.cutlistKey && node.cutlistKey === props.selectedCutlistKey),
  )?.objectId ?? props.selectedIds[0] ?? null;
  const pieceHit = Boolean(props.selectedCutlistKey && props.nodes.some((node) => node.pieceId === props.selectedCutlistKey));
  const rows = useMemo(() => {
    const isolated = visibleHierarchyNodes(props.nodes, { isolatedObjectId: activeIsolation, hiddenObjectIds });
    return collapseHierarchy(filterDesignHierarchy(isolated, query), new Set(Object.keys(collapsed).filter((id) => collapsed[id])));
  }, [props.nodes, activeIsolation, hiddenObjectIds, query, collapsed]);

  useEffect(() => {
    if (isolationContext === contextKey) return;
    setIsolatedObjectId(null);
    setIsolationContext(contextKey);
  }, [contextKey, isolationContext]);

  function toggle(id: string) {
    setCollapsed((current) => ({ ...current, [id]: !current[id] }));
  }

  useLayoutEffect(() => {
    props.onViewportVisibility?.({ isolatedObjectId: activeIsolation, hiddenObjectIds });
  }, [hiddenObjectIds, activeIsolation, props.onViewportVisibility]);

  function startResize(event: ReactPointerEvent<HTMLButtonElement>) {
    const startX = event.clientX;
    const parent = event.currentTarget.parentElement?.parentElement;
    const start = Number.parseFloat(parent?.style.getPropertyValue("--studio-hierarchy-width") || "200");
    function move(moveEvent: PointerEvent) {
      const next = Math.min(420, Math.max(160, start + moveEvent.clientX - startX));
      parent?.style.setProperty("--studio-hierarchy-width", `${next}px`);
    }
    function stop() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  }

  return (
    <aside className="studio-design-hierarchy" aria-label="Hierarchy" data-testid="studio-hierarchy">
      <header>
        <strong>Hierarchy</strong>
        <input className="studio-field" value={query} placeholder="Search" aria-label="Search hierarchy" onChange={(event) => setQuery(event.target.value)} />
        <div className="studio-tabs">
          <button type="button" className="studio-btn" title="Show only this object in the view. The cut list stays complete." disabled={!selectedObjectId} onClick={() => selectedObjectId && setIsolatedObjectId(selectedObjectId)}>Isolate</button>
          <button type="button" className="studio-btn" disabled={!activeIsolation} onClick={() => setIsolatedObjectId(null)}>Show all</button>
          <button type="button" className="studio-btn" title="Hide this object in the 2D and 3D view. The cut list stays complete." disabled={!selectedObjectId} onClick={() => selectedObjectId && setHiddenObjectIds((current) => current.includes(selectedObjectId) ? current : [...current, selectedObjectId])}>Hide</button>
          <button type="button" className="studio-btn" disabled={hiddenObjectIds.length === 0} onClick={() => setHiddenObjectIds([])}>Unhide</button>
          <button type="button" className="studio-btn" disabled={!selectedObjectId} onClick={props.onFocus}>Focus</button>
        </div>
      </header>
      {rows.length === 0 ? <p className="studio-state">No matching items.</p> : null}
      <ul>
        {rows.map((node, index) => {
          const next = rows[index + 1];
          const expandable = Boolean(next && next.depth > node.depth) || Boolean(collapsed[node.id]);
          const selected = pieceHit
            ? node.pieceId === props.selectedCutlistKey
            : node.cutlistKey
            ? node.cutlistKey === props.selectedCutlistKey
            : node.objectId
              ? props.selectedIds.includes(node.objectId) && !props.selectedCutlistKey
              : node.openingId
                ? node.openingId === props.activeOpeningId
                : node.wallId
                  ? node.wallId === props.activeWallId && !props.activeOpeningId
                  : false;
          return (
            <li key={node.id}>
              <div className={selected ? "studio-hierarchy-row is-selected" : "studio-hierarchy-row"} style={{ paddingLeft: 8 + node.depth * 12 }}>
                {expandable ? (
                  <button type="button" className="studio-hierarchy-toggle" aria-expanded={!collapsed[node.id]} aria-label={collapsed[node.id] ? "Expand" : "Collapse"} onClick={() => toggle(node.id)}>
                    {collapsed[node.id] ? "▸" : "▾"}
                  </button>
                ) : null}
                <button type="button" aria-pressed={selected} onClick={() => props.onSelectNode(node)}>
                  <span>{node.label}</span>
                  <small>{node.detail}</small>
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <button type="button" className="studio-hierarchy-resize" aria-label="Resize hierarchy" onPointerDown={startResize} />
    </aside>
  );
}
