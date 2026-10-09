import { Html } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { Path, Raycaster, Shape, ShapeGeometry, Vector2 } from "three";
import type { InteriorProject, Point2Mm } from "../../domain/interiorProject";
import { polygonSignedArea } from "../../domain/interiorProject/roomGeometry";
import {
  floorPointMm,
  overviewRoomAt,
  overviewRooms,
  type OverviewRoom,
} from "../../domain/livingRoom/overviewRooms";

type ApartmentRoomPickProps = {
  project: InteriorProject;
  hoveredId: string | null;
  onHover: (roomId: string | null) => void;
  /** Click a room space (living room, kitchen, …) to open it. */
  onActivate: (roomId: string) => void;
};

function ring(points: readonly Point2Mm[], positive: boolean) {
  const ordered = (polygonSignedArea([...points]) >= 0) === positive ? points : [...points].reverse();
  return ordered.map((point) => new Vector2(point.x / 1000, point.z / 1000));
}

function RoomHighlight({ room }: { room: OverviewRoom }) {
  const geometry = useMemo(() => {
    const shape = new Shape(ring(room.polygon.outer, true));
    for (const hole of room.polygon.holes) shape.holes.push(new Path(ring(hole, false)));
    return new ShapeGeometry(shape);
  }, [room]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group>
      <mesh geometry={geometry} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} raycast={() => undefined}>
        <meshBasicMaterial color="#7eb6ff" transparent opacity={0.38} depthWrite={false} />
      </mesh>
      <Html position={[room.center.x / 1000, 1.5, room.center.z / 1000]} center style={{ pointerEvents: "none" }}>
        <span className="lr-apartment-room-name">{room.name}</span>
      </Html>
    </group>
  );
}

/**
 * Whole-apartment view. The cursor picks the room space under it (living room,
 * kitchen, passage), not the walls or wardrobes inside that space. A click
 * opens that room, where walls and wardrobes can be selected.
 */
export function ApartmentRoomPick(props: ApartmentRoomPickProps) {
  const rooms = useMemo(() => overviewRooms(props.project), [props.project]);
  const { camera, gl } = useThree();
  const { onHover, onActivate } = props;
  useEffect(() => {
    const canvas = gl.domElement;
    const raycaster = new Raycaster();
    let down: { x: number; y: number } | null = null;
    const roomAt = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return null;
      raycaster.setFromCamera(new Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      ), camera);
      const point = floorPointMm(raycaster.ray.origin, raycaster.ray.direction);
      return point ? overviewRoomAt(rooms, point) : null;
    };
    const onMove = (event: PointerEvent) => onHover(roomAt(event)?.id ?? null);
    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      down = { x: event.clientX, y: event.clientY };
    };
    const onUp = (event: PointerEvent) => {
      if (!down || event.button !== 0) return;
      const moved = Math.hypot(event.clientX - down.x, event.clientY - down.y);
      down = null;
      if (moved > 6) return;
      const room = roomAt(event);
      if (room) onActivate(room.id);
    };
    canvas.addEventListener("pointermove", onMove, true);
    canvas.addEventListener("pointerdown", onDown, true);
    canvas.addEventListener("pointerup", onUp, true);
    return () => {
      canvas.removeEventListener("pointermove", onMove, true);
      canvas.removeEventListener("pointerdown", onDown, true);
      canvas.removeEventListener("pointerup", onUp, true);
      onHover(null);
    };
  }, [camera, gl, rooms, onHover, onActivate]);
  const hovered = rooms.find((room) => room.id === props.hoveredId);
  return hovered ? <RoomHighlight room={hovered} /> : null;
}
