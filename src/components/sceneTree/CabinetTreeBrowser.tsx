import { useEffect, useMemo, useState } from "react";
import type { CabinetRun } from "../../domain/cabinetLibrary";
import type { ProjectRoom } from "../../domain/projectRooms";
import {
  buildSceneTree,
  findSceneTreeNode,
  type SceneTreeNode,
} from "../../domain/sceneTree";
import { CabinetTreeRow } from "./CabinetTreeRow";

type CabinetTreeBrowserProps = {
  rooms: ProjectRoom[];
  activeRoomId: string | null;
  runs: CabinetRun[];
  activeCabinetId: string | null;
  selectedCabinetIds: string[];
  activeOpeningId: string | null;
  isolatedCabinetIds: string[] | null;
  compact?: boolean;
  hideToolbar?: boolean;
  onSelectRoom: (roomId: string) => void;
  onSelectCabinet: (cabinetId: string, additive: boolean) => void;
  onSelectRun: (run: CabinetRun) => void;
  onSelectOpening: (cabinetId: string, openingId: string) => void;
  onSelectCabinets: (
    roomId: string,
    cabinetIds: string[],
    activeId: string | null,
    additive: boolean,
  ) => void;
  onRenameCabinet: (cabinetId: string, name: string) => void;
  onRenameRoom?: (roomId: string, name: string) => void;
  onIsolate: (cabinetIds: string[]) => void;
  onFocus: (cabinetIds: string[], activeId: string | null) => void;
  onReorderCabinet: (runId: string, cabinetId: string, direction: -1 | 1) => void;
  onCabinetContextMenu?: (
    cabinetId: string,
    point: { x: number; y: number },
  ) => void;
};

function defaultExpandedIds(
  rooms: ProjectRoom[],
  activeRoomId: string | null,
): Set<string> {
  const ids = new Set<string>();
  for (const room of rooms) {
    if (room.id === activeRoomId || rooms.length === 1) {
      ids.add(`room:${room.id}`);
    }
  }
  return ids;
}

export function CabinetTreeBrowser({
  rooms,
  activeRoomId,
  runs,
  activeCabinetId,
  selectedCabinetIds,
  activeOpeningId,
  isolatedCabinetIds,
  compact = false,
  hideToolbar = false,
  onSelectRoom,
  onSelectCabinet,
  onSelectRun,
  onSelectOpening,
  onSelectCabinets,
  onRenameCabinet,
  onRenameRoom,
  onIsolate,
  onFocus,
  onReorderCabinet,
  onCabinetContextMenu,
}: CabinetTreeBrowserProps) {
  const tree = useMemo(() => buildSceneTree(rooms), [rooms]);
  const [expanded, setExpanded] = useState(() =>
    defaultExpandedIds(rooms, activeRoomId),
  );
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    setExpanded((current) => {
      const next = new Set(current);
      if (activeRoomId) next.add(`room:${activeRoomId}`);
      return next;
    });
  }, [activeRoomId]);

  useEffect(() => {
    if (!activeCabinetId || !activeRoomId) return;
    const cabinetNode = findSceneTreeNode(
      tree,
      (node) =>
        node.kind === "cabinet" &&
        node.cabinetId === activeCabinetId &&
        node.roomId === activeRoomId,
    );
    if (!cabinetNode) return;

    setExpanded((current) => {
      const next = new Set(current);
      next.add(`room:${activeRoomId}`);
      if (cabinetNode.wallId) next.add(`wall:${activeRoomId}:${cabinetNode.wallId}`);
      if (cabinetNode.runId) next.add(`run:${activeRoomId}:${cabinetNode.runId}`);
      next.add(cabinetNode.id);
      return next;
    });
  }, [activeCabinetId, activeRoomId, tree]);

  function toggleExpand(nodeId: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }

  function activateNode(node: SceneTreeNode, additive: boolean) {
    if (node.kind === "room") {
      onSelectRoom(node.roomId);
      return;
    }

    if (node.kind === "opening" && node.cabinetId && node.openingId) {
      if (node.roomId !== activeRoomId) {
        onSelectCabinets(node.roomId, [node.cabinetId], node.cabinetId, false);
      }
      onSelectOpening(node.cabinetId, node.openingId);
      return;
    }

    if (node.kind === "cabinet" && node.cabinetId) {
      if (node.roomId !== activeRoomId) {
        onSelectCabinets(node.roomId, [node.cabinetId], node.cabinetId, false);
        return;
      }
      onSelectCabinet(node.cabinetId, additive);
      return;
    }

    if (node.kind === "run" && node.runId && node.roomId === activeRoomId) {
      const run = runs.find((entry) => entry.id === node.runId);
      if (run) {
        onSelectRun(run);
        return;
      }
    }

    onSelectCabinets(
      node.roomId,
      node.cabinetIds,
      node.cabinetIds[0] ?? null,
      additive,
    );
  }

  function startRename(node: SceneTreeNode) {
    if (node.kind === "cabinet") {
      if (node.roomId !== activeRoomId) return;
      const room = rooms.find((entry) => entry.id === node.roomId);
      const cabinet = room?.cabinets.find((entry) => entry.id === node.cabinetId);
      if (!cabinet) return;
      setRenamingId(node.id);
      setRenameValue(cabinet.name);
      return;
    }
    if (node.kind === "room") {
      setRenamingId(node.id);
      setRenameValue(node.label);
    }
  }

  function commitRename() {
    if (!renamingId) return;
    const node = findSceneTreeNode(tree, (entry) => entry.id === renamingId);
    const next = renameValue.trim();
    setRenamingId(null);
    setRenameValue("");
    if (!node || !next) return;
    if (node.kind === "cabinet" && node.cabinetId) {
      if (node.roomId !== activeRoomId) return;
      onRenameCabinet(node.cabinetId, next);
    } else if (node.kind === "room" && onRenameRoom) {
      onRenameRoom(node.roomId, next);
    }
  }

  const itemCount = rooms.reduce((sum, room) => sum + room.cabinets.length, 0);

  return (
    <div
      className={`cabinet-tree-browser ${compact ? "is-compact" : ""}`}
      role="tree"
      aria-label="Cabinet tree"
    >
      {hideToolbar ? null : (
        <div className="cabinet-tree-toolbar">
          <span>Hierarchy</span>
          <span>{itemCount}</span>
          {isolatedCabinetIds ? (
            <button
              type="button"
              className="cabinet-tree-clear-isolate"
              onClick={() => onIsolate([])}
              title="Clear isolate"
            >
              Show all
            </button>
          ) : null}
        </div>
      )}
      <div className="cabinet-tree-scroll">
        {tree.length === 0 ? (
          <p className="cabinet-tree-empty">No rooms</p>
        ) : (
          tree.map((node) => (
            <CabinetTreeRow
              key={node.id}
              node={node}
              depth={0}
              expanded={expanded}
              activeRoomId={activeRoomId}
              activeCabinetId={activeCabinetId}
              selectedCabinetIds={selectedCabinetIds}
              activeOpeningId={activeOpeningId}
              isolatedCabinetIds={isolatedCabinetIds}
              renamingId={renamingId}
              renameValue={renameValue}
              onToggleExpand={toggleExpand}
              onActivate={activateNode}
              onStartRename={startRename}
              onRenameChange={setRenameValue}
              onCommitRename={commitRename}
              onCancelRename={() => {
                setRenamingId(null);
                setRenameValue("");
              }}
              onIsolate={(entry) => onIsolate(entry.cabinetIds)}
              onFocus={(entry) =>
                onFocus(entry.cabinetIds, entry.cabinetId ?? entry.cabinetIds[0] ?? null)
              }
              onReorder={(entry, direction) => {
                if (!entry.runId || !entry.cabinetId) return;
                onReorderCabinet(entry.runId, entry.cabinetId, direction);
              }}
              onCabinetContextMenu={onCabinetContextMenu}
            />
          ))
        )}
      </div>
    </div>
  );
}
