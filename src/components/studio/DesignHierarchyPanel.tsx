import { useMemo, useState } from "react";
import { filterDesignHierarchy, type DesignHierarchyNode } from "../../domain/studio/designHierarchy";
import { collapseHierarchy, visibleHierarchyNodes } from "../../domain/studio/manufacturingTree";

export function DesignHierarchyPanel(props: {
  nodes: DesignHierarchyNode[];
  selectedIds: readonly string[];
  selectedCutlistKey: string | null;
  activeWallId: string | null;
  activeOpeningId: string | null;
  onSelectNode: (node: DesignHierarchyNode) => void;
  onFocus: () => void;
}) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [isolatedObjectId, setIsolatedObjectId] = useState<string | null>(null);
  const [hiddenObjectIds, setHiddenObjectIds] = useState<string[]>([]);
  const selectedObjectId = props.nodes.find((node) => node.cutlistKey && node.cutlistKey === props.selectedCutlistKey)?.objectId
    ?? props.selectedIds[0]
    ?? null;
  const rows = useMemo(() => {
    const isolated = visibleHierarchyNodes(props.nodes, { isolatedObjectId, hiddenObjectIds });
    return collapseHierarchy(filterDesignHierarchy(isolated, query), new Set(Object.keys(collapsed).filter((id) => collapsed[id])));
  }, [props.nodes, isolatedObjectId, hiddenObjectIds, query, collapsed]);

  function toggle(id: string) {
    setCollapsed((current) => ({ ...current, [id]: !current[id] }));
  }

  return (
    <aside className="studio-design-hierarchy" aria-label="Hierarchy" data-testid="studio-hierarchy">
      <header>
        <strong>Hierarchy</strong>
        <input className="studio-field" value={query} placeholder="Search" aria-label="Search hierarchy" onChange={(event) => setQuery(event.target.value)} />
        <div className="studio-tabs">
          <button type="button" className="studio-btn" disabled={!selectedObjectId} onClick={() => selectedObjectId && setIsolatedObjectId(selectedObjectId)}>Isolate</button>
          <button type="button" className="studio-btn" disabled={!isolatedObjectId} onClick={() => setIsolatedObjectId(null)}>Show all</button>
          <button type="button" className="studio-btn" disabled={!selectedObjectId} onClick={() => selectedObjectId && setHiddenObjectIds((current) => current.includes(selectedObjectId) ? current : [...current, selectedObjectId])}>Hide</button>
          <button type="button" className="studio-btn" disabled={hiddenObjectIds.length === 0} onClick={() => setHiddenObjectIds([])}>Unhide</button>
          <button type="button" className="studio-btn" disabled={!selectedObjectId} onClick={props.onFocus}>Focus</button>
        </div>
      </header>
      {rows.length === 0 ? <p className="studio-state">No matching items.</p> : null}
      <ul>
        {rows.map((node, index) => {
          const next = rows[index + 1];
          const expandable = Boolean(next && next.depth > node.depth) || Boolean(collapsed[node.id]);
          const selected = node.cutlistKey
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
