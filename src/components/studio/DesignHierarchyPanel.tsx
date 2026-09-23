import { useMemo, useState } from "react";
import { filterDesignHierarchy, type DesignHierarchyNode } from "../../domain/studio/designHierarchy";

export function DesignHierarchyPanel(props: {
  nodes: DesignHierarchyNode[];
  selectedIds: readonly string[];
  activeWallId: string | null;
  activeOpeningId: string | null;
  onSelectNode: (node: DesignHierarchyNode) => void;
}) {
  const [query, setQuery] = useState("");
  const [collapsedRooms, setCollapsedRooms] = useState<Record<string, boolean>>({});
  const visible = useMemo(() => filterDesignHierarchy(props.nodes, query), [props.nodes, query]);
  const rows = visible.filter((node) => node.depth === 0 || !collapsedRooms[node.roomId]);

  return (
    <aside className="studio-design-hierarchy" aria-label="Hierarchy" data-testid="studio-hierarchy">
      <header>
        <strong>Hierarchy</strong>
        <input
          className="studio-field"
          value={query}
          placeholder="Search"
          aria-label="Search hierarchy"
          onChange={(event) => setQuery(event.target.value)}
        />
      </header>
      {rows.length === 0 ? <p className="studio-state">No matching items.</p> : null}
      <ul>
        {rows.map((node) => {
          const selected = node.objectId
            ? props.selectedIds.includes(node.objectId)
            : node.openingId
              ? node.openingId === props.activeOpeningId
              : node.wallId
                ? node.wallId === props.activeWallId && !props.activeOpeningId
                : false;
          return (
            <li key={node.id}>
              <button
                type="button"
                className={selected ? "is-selected" : ""}
                style={{ paddingLeft: 8 + node.depth * 12 }}
                aria-pressed={selected}
                onClick={() => props.onSelectNode(node)}
              >
                {node.kind === "room" ? (
                  <span
                    role="presentation"
                    onClick={(event) => {
                      event.stopPropagation();
                      setCollapsedRooms((current) => ({ ...current, [node.roomId]: !current[node.roomId] }));
                    }}
                  >
                    {collapsedRooms[node.roomId] ? "▸" : "▾"}
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
