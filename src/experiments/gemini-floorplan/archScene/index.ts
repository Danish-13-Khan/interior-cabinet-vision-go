export type {
  ArchitecturalScene,
  ArchitecturalWall,
  ArchitecturalOpening,
  WallJunction,
  ArchFixture,
} from "./archSceneTypes";
export { proposalToArchScene } from "./proposalToArchScene";
export { buildWallTopology, wallAdjacency, joinWallEndpoints, splitWallAt } from "./wallTopology";
export { classifyWallTypes } from "./classifyWalls";
export { assignRoomSides } from "./assignRoomSides";
export { bindOpeningsToWalls, moveOpeningAlongWall } from "./bindOpenings";
export { buildRoomSurfaces, findOpenLoops } from "./roomSurfaces";
export { extractSemanticFixtures } from "./semanticFixtures";
export { buildArchShell } from "./buildArchShell";
export { cabinetWallSpans, mapFixturesToCatalog, DEFAULT_FIXTURE_CATALOG } from "./cabinetMapping";
export { resolveMaterial, DEFAULT_MATERIALS } from "./materials";
export { evaluateReconstructionGate } from "./reconstructionGate";
export { TopologyPanel } from "./TopologyPanel";
export { ReconstructionGatePanel } from "./ReconstructionGatePanel";
