import { Html, Line } from "@react-three/drei";
import type { CountertopSegment, RunFiller } from "../../domain/cabinetLibrary";
import type { CabinetSceneItem } from "../../domain/cabinetGeometry";
import { getFootprintDimensions } from "../../domain/cabinetDimensions";
import type { RoomShellDims } from "./types";

function getGroupColor(groupId: string | null | undefined) {
  if (!groupId) {
    return "#8aa0b6";
  }

  const palette = ["#4f86c6", "#4ca87d", "#c17b41", "#9b6bd3", "#c0577a", "#5385a1"];
  let hash = 0;
  for (let index = 0; index < groupId.length; index += 1) {
    hash = (hash * 31 + groupId.charCodeAt(index)) >>> 0;
  }
  return palette[hash % palette.length];
}

export function GroupOutline({ cabinet }: { cabinet: CabinetSceneItem }) {
  if (!cabinet.groupId) {
    return null;
  }

  const width = cabinet.config.dimensions.width / 1000 + 0.03;
  const depth = cabinet.config.dimensions.depth / 1000 + 0.03;
  const height = cabinet.config.dimensions.height / 1000 + 0.03;
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const halfHeight = height / 2;
  const color = getGroupColor(cabinet.groupId);

  const basePoints: [number, number, number][] = [
    [-halfWidth, -halfHeight, -halfDepth],
    [halfWidth, -halfHeight, -halfDepth],
    [halfWidth, -halfHeight, halfDepth],
    [-halfWidth, -halfHeight, halfDepth],
    [-halfWidth, -halfHeight, -halfDepth],
  ];
  const topPoints: [number, number, number][] = basePoints.map(([x, , z]) => [x, halfHeight, z]);

  return (
    <group>
      <Line points={basePoints} color={color} lineWidth={1.2} />
      <Line points={topPoints} color={color} lineWidth={1.2} />
      {[
        [[-halfWidth, -halfHeight, -halfDepth], [-halfWidth, halfHeight, -halfDepth]],
        [[halfWidth, -halfHeight, -halfDepth], [halfWidth, halfHeight, -halfDepth]],
        [[halfWidth, -halfHeight, halfDepth], [halfWidth, halfHeight, halfDepth]],
        [[-halfWidth, -halfHeight, halfDepth], [-halfWidth, halfHeight, halfDepth]],
      ].map((points, index) => (
        <Line key={index} points={points as [number, number, number][]} color={color} lineWidth={1.2} />
      ))}
      <Html position={[0, halfHeight + 0.08, 0]} center>
        <span className="group-badge">Group</span>
      </Html>
    </group>
  );
}

function WallOpening({ side, posMm, widthMm, heightMm, sillMm, color, halfW, halfD }: {
  side: string; posMm: number; widthMm: number; heightMm: number;
  sillMm: number; color: string; halfW: number; halfD: number;
}) {
  const w = widthMm / 1000;
  const h = heightMm / 1000;
  const sy = sillMm / 1000;
  let cx: number, cz: number;

  if (side === "back-wall") { cx = posMm / 1000; cz = -halfD; }
  else if (side === "left-wall") { cx = -halfW; cz = posMm / 1000; }
  else { cx = halfW; cz = posMm / 1000; }

  return (
    <mesh position={[cx, sy + h / 2, cz]}
      rotation-y={side === "back-wall" ? 0 : side === "left-wall" ? Math.PI / 2 : -Math.PI / 2}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial color={color} side={2} transparent opacity={0.4} />
    </mesh>
  );
}

export function RoomShell({ dims, doors, windows }: {
  dims: RoomShellDims;
  doors: { id: string; side: string; positionMm: number; widthMm: number; heightMm: number }[];
  windows: { id: string; side: string; positionMm: number; widthMm: number; heightMm: number; sillHeightMm: number }[];
}) {
  const halfW = dims.widthMm / 2000;
  const halfD = dims.depthMm / 2000;
  const h = dims.heightMm / 1000;

  const wallLines: [number, number, number][][] = [];
  if (dims.showBackWall) {
    wallLines.push([[-halfW, 0, -halfD], [halfW, 0, -halfD]]);
    wallLines.push([[-halfW, h, -halfD], [halfW, h, -halfD]]);
    wallLines.push([[-halfW, 0, -halfD], [-halfW, h, -halfD]]);
    wallLines.push([[halfW, 0, -halfD], [halfW, h, -halfD]]);
  }
  if (dims.showLeftWall) {
    wallLines.push([[-halfW, 0, -halfD], [-halfW, 0, halfD]]);
    wallLines.push([[-halfW, h, -halfD], [-halfW, h, halfD]]);
    wallLines.push([[-halfW, 0, halfD], [-halfW, h, halfD]]);
  }
  if (dims.showRightWall) {
    wallLines.push([[halfW, 0, -halfD], [halfW, 0, halfD]]);
    wallLines.push([[halfW, h, -halfD], [halfW, h, halfD]]);
    wallLines.push([[halfW, 0, halfD], [halfW, h, halfD]]);
  }

  return (
    <group>
      {wallLines.map((points, i) => (
        <Line key={i} points={points} color="#b6beca" lineWidth={1} />
      ))}
      <Line
        points={[
          [-halfW, 0.001, -halfD],
          [halfW, 0.001, -halfD],
          [halfW, 0.001, halfD],
          [-halfW, 0.001, halfD],
          [-halfW, 0.001, -halfD],
        ]}
        color="#c8ced6"
        lineWidth={1.2}
      />
      {doors.map((door) => (
        <WallOpening key={door.id} side={door.side} posMm={door.positionMm}
          widthMm={door.widthMm} heightMm={door.heightMm} sillMm={0}
          color="#93c5fd" halfW={halfW} halfD={halfD} />
      ))}
      {windows.map((win) => (
        <WallOpening key={win.id} side={win.side} posMm={win.positionMm}
          widthMm={win.widthMm} heightMm={win.heightMm} sillMm={win.sillHeightMm}
          color="#a5d6a7" halfW={halfW} halfD={halfD} />
      ))}
    </group>
  );
}

export function SnapGuides({
  cabinet,
  roomDimensions,
  snapSizeMm,
}: {
  cabinet: CabinetSceneItem;
  roomDimensions: RoomShellDims;
  snapSizeMm: number;
}) {
  const footprint = getFootprintDimensions(cabinet.config.dimensions, cabinet.placement.rotation);
  const halfW = footprint.width / 2000;
  const halfD = footprint.depth / 2000;
  const cx = cabinet.placement.x / 1000;
  const cz = cabinet.placement.z / 1000;
  const roomHalfW = roomDimensions.widthMm / 2000;
  const roomHalfD = roomDimensions.depthMm / 2000;
  const snapMm = snapSizeMm / 1000;

  const guides: [number, number, number][][] = [];

  for (let x = -roomHalfW; x <= roomHalfW; x += snapMm) {
    if (Math.abs(x - cx) < 0.001) {
      guides.push([
        [x, 0.002, -roomHalfD],
        [x, 0.002, roomHalfD],
      ]);
    }
  }
  for (let z = -roomHalfD; z <= roomHalfD; z += snapMm) {
    if (Math.abs(z - cz) < 0.001) {
      guides.push([
        [-roomHalfW, 0.002, z],
        [roomHalfW, 0.002, z],
      ]);
    }
  }

  const wallThreshold = 0.2;
  if (Math.abs(cx - halfW - (-roomHalfW)) < wallThreshold) {
    guides.push([
      [-roomHalfW, 0.001, cz - halfD],
      [-roomHalfW, 0.001, cz + halfD],
    ]);
  }
  if (Math.abs(cx + halfW - roomHalfW) < wallThreshold) {
    guides.push([
      [roomHalfW, 0.001, cz - halfD],
      [roomHalfW, 0.001, cz + halfD],
    ]);
  }
  if (Math.abs(cz - halfD - (-roomHalfD)) < wallThreshold) {
    guides.push([
      [cx - halfW, 0.001, -roomHalfD],
      [cx + halfW, 0.001, -roomHalfD],
    ]);
  }
  if (Math.abs(cz + halfD - roomHalfD) < wallThreshold) {
    guides.push([
      [cx - halfW, 0.001, roomHalfD],
      [cx + halfW, 0.001, roomHalfD],
    ]);
  }

  return (
    <group>
      {guides.map((points, i) => (
        <Line key={i} points={points} color="#5b8def" lineWidth={1} dashed={true} />
      ))}
    </group>
  );
}

export function CountertopMeshes({ countertops = [] }: { countertops?: CountertopSegment[] }) {
  return (
    <group>
      {countertops.map((countertop) => (
        <mesh
          key={countertop.id}
          position={[
            countertop.positionX / 1000,
            countertop.positionY / 1000 + countertop.thicknessMm / 2000,
            countertop.positionZ / 1000,
          ]}
          receiveShadow
          castShadow
        >
          <boxGeometry
            args={[
              countertop.widthMm / 1000,
              countertop.thicknessMm / 1000,
              countertop.depthMm / 1000,
            ]}
          />
          <meshStandardMaterial color="#85715d" roughness={0.58} metalness={0.06} />
        </mesh>
      ))}
    </group>
  );
}

export function FillerMeshes({ fillers = [] }: { fillers?: RunFiller[] }) {
  return (
    <group>
      {fillers.map((filler) => (
        <mesh
          key={filler.id}
          position={[
            filler.position.x / 1000,
            filler.size.height / 2000,
            filler.position.z / 1000,
          ]}
          receiveShadow
          castShadow
        >
          <boxGeometry
            args={[
              filler.size.width / 1000,
              filler.size.height / 1000,
              filler.size.depth / 1000,
            ]}
          />
          <meshStandardMaterial color="#c7b090" roughness={0.7} metalness={0.04} />
        </mesh>
      ))}
    </group>
  );
}
