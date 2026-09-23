import { useEffect, useLayoutEffect, useMemo, useState } from "react";
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
              <button type="button" className={selected ? "is-selected" : ""} style={{ paddingLeft: 8 + node.depth * 12 }} aria-pressed={selected} onClick={() => props.onSelectNode(node)}>
                {expandable ? (
                  <span role="presentation" onClick={(event) => { event.stopPropagation(); toggle(node.id); }}>
                    {collapsed[node.id] ? "▸" : "▾"}
                  </span>
                ) : null}
                <span>{node.label}</span>
                <small>{node.detail}</small>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
