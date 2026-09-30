import {
  deletePlanWall,
  mergeCoincidentPlanNodes,
  movePlanNodeWithOpenings,
  setPlanWallHeight,
  setPlanWallThickness,
  splitPlanWallResult,
  translatePlanWall,
  type Point2Mm,
  type WallPlanPatch,
} from "../../domain/interiorProject";
import {
  deleteLivingRoomOpening,
  reflowCabinetRunsForWalls,
  reflowPanelsForWalls,
  remapPanelsAfterWallSplit,
  removePanelsOnWall,
  updateLivingRoomOpening,
} from "../../domain/livingRoom";
import {
  offsetLivingRoomLoop as commitOffsetLoop,
  offsetLivingRoomWall as commitOffsetWall,
  raiseLivingRoomWalls as commitRaisedWalls,
  setLivingRoomWallPlan as commitWallPlan,
} from "../livingRoomSketchCommands";
import type { EditorCommandContext } from "./context";

/** Walls, wall nodes, and openings on them. Panels and cabinet runs reflow with the walls. */
export function wallCommands(ctx: EditorCommandContext) {
  const { commitDocument } = ctx;

  function splitWall(wallId: string, offsetMm?: number): string | null {
    let firstWallId: string | null = null;
    commitDocument((current) => {
      const result = splitPlanWallResult(current, wallId, offsetMm);
      firstWallId = result.firstWallId;
      if (result.firstWallId === wallId && result.secondWallId === wallId) {
        return current;
      }
      return remapPanelsAfterWallSplit(
        result.project,
        wallId,
        result.firstWallId,
        result.secondWallId,
      );
    }, "Split wall.");
    return firstWallId;
  }

  function updateWall(wallId: string, patch: { thicknessMm?: number; heightMm?: number }) {
    if (patch.thicknessMm === undefined && patch.heightMm === undefined) return;
    commitDocument((current) => {
      let next = current;
      if (patch.thicknessMm !== undefined) next = setPlanWallThickness(next, wallId, patch.thicknessMm);
      if (patch.heightMm !== undefined) next = setPlanWallHeight(next, wallId, patch.heightMm);
      if (patch.thicknessMm === undefined) return next;
      return reflowPanelsForWalls(next, [wallId]);
    }, "Updated wall properties.");
  }

  function moveNode(nodeId: string, position: Point2Mm) {
    commitDocument(
      (current) => {
        const affectedWallIds = current.walls
          .filter((wall) => wall.startNodeId === nodeId || wall.endNodeId === nodeId)
          .map((wall) => wall.id);
        return reflowPanelsForWalls(
          reflowCabinetRunsForWalls(movePlanNodeWithOpenings(current, nodeId, position), affectedWallIds),
          affectedWallIds,
        );
      },
      "Moved wall node.",
    );
  }

  function translateWall(wallId: string, delta: Point2Mm) {
    commitDocument(
      (current) => {
        const wall = current.walls.find((item) => item.id === wallId);
        const affectedWallIds = wall
          ? current.walls
            .filter((item) => item.startNodeId === wall.startNodeId || item.endNodeId === wall.startNodeId
              || item.startNodeId === wall.endNodeId || item.endNodeId === wall.endNodeId)
            .map((item) => item.id)
          : [wallId];
        return reflowPanelsForWalls(
          reflowCabinetRunsForWalls(translatePlanWall(current, wallId, delta), affectedWallIds),
          affectedWallIds,
        );
      },
      "Moved wall.",
    );
  }

  return {
    splitLivingRoomWall: splitWall,
    deleteLivingRoomWall: (wallId: string) => {
      commitDocument((current) => {
        const next = deletePlanWall(current, wallId);
        if (next.walls.some((wall) => wall.id === wallId)) return current;
        return removePanelsOnWall(next, wallId);
      }, "Deleted wall.");
    },
    updateLivingRoomWall: updateWall,
    raiseLivingRoomWalls: (wallIds: string[], raised: boolean, heightMm?: number) =>
      commitRaisedWalls(commitDocument, wallIds, raised, heightMm),
    offsetLivingRoomWall: (wallId: string, offsetMm: number) =>
      commitOffsetWall(commitDocument, wallId, offsetMm),
    offsetLivingRoomLoop: (offsetMm: number) => commitOffsetLoop(commitDocument, offsetMm),
    setLivingRoomWallPlan: (wallId: string, patch: WallPlanPatch) =>
      commitWallPlan(commitDocument, wallId, patch),
    joinLivingRoomCoincidentNodes: () => {
      commitDocument((current) => mergeCoincidentPlanNodes(current), "Joined coincident nodes.");
    },
    moveLivingRoomNode: moveNode,
    translateLivingRoomWall: translateWall,
    updateLivingRoomOpening: (openingId: string, patch: Parameters<typeof updateLivingRoomOpening>[2]) => {
      commitDocument((current) => updateLivingRoomOpening(current, openingId, patch), "Updated opening.");
    },
    deleteLivingRoomOpening: (openingId: string) => {
      commitDocument((current) => deleteLivingRoomOpening(current, openingId), "Removed opening.");
    },
  };
}
