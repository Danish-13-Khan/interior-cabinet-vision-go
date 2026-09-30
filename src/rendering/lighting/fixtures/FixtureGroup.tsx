import { useEffect, type ReactNode } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import type { LightEntity } from "../../../domain/interiorProject";
import { roomLightRotation } from "./fixtureMeasures";

/** tokens.css `--accent`. Fallback is that token's own value when CSS is not applied. */
const ACCENT_FALLBACK = "#3f6b52";

export function selectionAccentColor() {
  if (typeof document === "undefined") return ACCENT_FALLBACK;
  const value = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
  return value || ACCENT_FALLBACK;
}

export function FixtureGroup({
  light,
  span,
  selected = false,
  onSelect,
  children,
}: {
  light: LightEntity;
  /** Local axis-aligned body, metres, before the saved rotation. */
  span: [number, number, number];
  selected?: boolean;
  onSelect?: (id: string) => void;
  children: ReactNode;
}) {
  useEffect(() => () => {
    if (typeof document !== "undefined" && document.body.style.cursor === "pointer") {
      document.body.style.cursor = "";
    }
  }, []);
  const selectable = Boolean(onSelect);
  const pick = selectable ? {
    onClick: (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      onSelect?.(light.id);
    },
    onPointerOver: (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      document.body.style.cursor = "pointer";
    },
    onPointerOut: () => {
      document.body.style.cursor = "";
    },
  } : {};
  return (
    <group
      position={[light.position.x / 1000, light.position.y / 1000, light.position.z / 1000]}
      rotation={roomLightRotation(light.rotation)}
      {...pick}
    >
      {children}
      {selected ? <SelectionOutline span={span} /> : null}
    </group>
  );
}

function SelectionOutline({ span }: { span: [number, number, number] }) {
  return (
    <mesh raycast={() => null}>
      <boxGeometry args={[span[0] + 0.016, span[1] + 0.016, span[2] + 0.016]} />
      <meshBasicMaterial color={selectionAccentColor()} wireframe depthTest={false} />
    </mesh>
  );
}
