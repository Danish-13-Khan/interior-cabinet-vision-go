import { ContactShadows, Edges, Environment, Html, Lightformer, OrbitControls } from "@react-three/drei";
import { type ThreeEvent, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import {
  MOUSE,
  ACESFilmicToneMapping,
  PCFShadowMap,
  PCFSoftShadowMap,
  Plane,
  SRGBColorSpace,
  Vector3,
} from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { Point3Mm, RenderComposition, RenderQuality } from "../../domain/interiorProject";
import type {
  CompiledLivingRoomScene,
  CompiledMaterial,
  CompiledPrimitive,
  CompiledSceneNode,
} from "../../domain/livingRoom";
import { getRenderQualityPreset, resolveRenderCameraPose } from "../../domain/livingRoom";
import { getCompiledGeometry } from "./geometryCache";
import { getProceduralMaterialMaps } from "./proceduralMaterialMaps";

const FLOOR_DRAG_PLANE = new Plane(new Vector3(0, 1, 0), 0);

type SceneRendererProps = {
  scene: CompiledLivingRoomScene;
  selectedIds: string[];
  activeCameraId: string | null;
  snapSizeMm: number;
  showGrid: boolean;
  cutawayWalls: boolean;
  interactive?: boolean;
  renderQuality?: RenderQuality;
  renderComposition?: RenderComposition;
  onSelect: (objectId: string | null, additive?: boolean) => void;
  onMove: (objectId: string, position: Point3Mm) => void;
};

function degrees(value: number) {
  return value * Math.PI / 180;
}

function CompiledMaterialView({
  material,
  primitiveId,
}: {
  material: CompiledMaterial;
  primitiveId: string;
}) {
  const isGlass = material.kind === "glass";
  const isFabric = material.kind === "fabric";
  const isWood = material.kind === "wood" || material.kind === "laminate";
  const isMetal = material.kind === "metal";
  const isMirror = primitiveId === "mirror";
  const transparent = material.opacity < 1 || isGlass;
  const maps = getProceduralMaterialMaps(material);
  return (
    <meshPhysicalMaterial
      color={material.color}
      map={maps.map}
      bumpMap={maps.bumpMap}
      bumpScale={maps.bumpScale}
      roughness={isMirror ? 0.08 : material.roughness}
      metalness={isMirror ? 0.82 : material.metalness}
      opacity={isMirror ? 1 : isGlass ? Math.max(0.42, material.opacity) : material.opacity}
      transparent={isMirror ? false : transparent}
      depthWrite={isMirror || !transparent}
      transmission={isMirror ? 0 : isGlass ? 0.72 : 0}
      thickness={isGlass ? 0.018 : 0}
      ior={isGlass ? 1.5 : 1.45}
      clearcoat={isWood ? 0.22 : material.kind === "paint" ? 0.05 : 0}
      clearcoatRoughness={isWood ? 0.52 : 0.78}
      sheen={isFabric ? 0.72 : 0}
      sheenColor={isFabric ? material.color : "#000000"}
      sheenRoughness={isFabric ? 0.82 : 1}
      envMapIntensity={isMirror ? 2 : isMetal ? 1.35 : isGlass ? 1.1 : isWood ? 0.82 : isFabric ? 0.38 : 0.48}
      specularIntensity={isFabric ? 0.28 : isWood ? 0.5 : 1}
    />
  );
}

function CompiledPrimitiveView({
  primitive,
  material,
  selected,
}: {
  primitive: CompiledPrimitive;
  material: CompiledMaterial;
  selected: boolean;
}) {
  return (
    <mesh
      geometry={getCompiledGeometry(primitive)}
      dispose={null}
      position={[
        primitive.positionMm.x / 1000,
        primitive.positionMm.y / 1000,
        primitive.positionMm.z / 1000,
      ]}
      rotation={[
        degrees(primitive.rotationDegrees.x),
        degrees(primitive.rotationDegrees.y),
        degrees(primitive.rotationDegrees.z),
      ]}
      castShadow={primitive.castShadow}
      receiveShadow={primitive.receiveShadow}
    >
      <CompiledMaterialView material={material} primitiveId={primitive.id} />
      {selected ? <Edges color="#0878bd" threshold={12} lineWidth={1.35} /> : null}
    </mesh>
  );
}

type DragState = {
  pointerId: number;
  startPoint: Vector3;
  startPosition: Point3Mm;
};

function CompiledNodeView({
  node,
  materials,
  selected,
  snapSizeMm,
  onSelect,
  onMove,
  onDragStateChange,
  interactive,
}: {
  node: CompiledSceneNode;
  materials: Map<string, CompiledMaterial>;
  selected: boolean;
  snapSizeMm: number;
  onSelect: (objectId: string, additive?: boolean) => void;
  onMove: (objectId: string, position: Point3Mm) => void;
  onDragStateChange: (dragging: boolean) => void;
  interactive: boolean;
}) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [preview, setPreview] = useState<Point3Mm | null>(null);
  const sourceObjectId = node.sourceObjectId;
  const position = preview ?? node.positionMm;

  function groundPoint(event: ThreeEvent<PointerEvent>) {
    const result = new Vector3();
    return event.ray.intersectPlane(FLOOR_DRAG_PLANE, result) ? result : null;
  }

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    if (!interactive || !sourceObjectId || event.button !== 0) return;
    event.stopPropagation();
    onSelect(sourceObjectId, event.shiftKey || event.metaKey || event.ctrlKey);
    const point = groundPoint(event);
    if (!point || event.shiftKey || event.metaKey || event.ctrlKey) return;
    (event.nativeEvent.target as Element | null)?.setPointerCapture(event.pointerId);
    setDrag({ pointerId: event.pointerId, startPoint: point, startPosition: node.positionMm });
    setPreview({ ...node.positionMm });
    onDragStateChange(true);
  }

  function handlePointerMove(event: ThreeEvent<PointerEvent>) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.stopPropagation();
    const point = groundPoint(event);
    if (!point) return;
    setPreview({
      ...drag.startPosition,
      x: Math.round((drag.startPosition.x + (point.x - drag.startPoint.x) * 1000) / snapSizeMm) * snapSizeMm,
      z: Math.round((drag.startPosition.z + (point.z - drag.startPoint.z) * 1000) / snapSizeMm) * snapSizeMm,
    });
  }

  function finishDrag(event: ThreeEvent<PointerEvent>) {
    if (!drag || drag.pointerId !== event.pointerId || !sourceObjectId) return;
    event.stopPropagation();
    (event.nativeEvent.target as Element | null)?.releasePointerCapture(event.pointerId);
    if (preview && (preview.x !== drag.startPosition.x || preview.z !== drag.startPosition.z)) {
      onMove(sourceObjectId, preview);
    }
    setDrag(null);
    setPreview(null);
    onDragStateChange(false);
  }

  return (
    <group
      position={[position.x / 1000, position.y / 1000, position.z / 1000]}
      rotation={[
        degrees(node.rotationDegrees.x),
        degrees(node.rotationDegrees.y),
        degrees(node.rotationDegrees.z),
      ]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
    >
      {node.primitives.map((primitive) => (
        <CompiledPrimitiveView
          key={primitive.id}
          primitive={primitive}
          material={materials.get(primitive.materialId) ?? materials.get("compiled:fallback")!}
          selected={selected}
        />
      ))}
      {selected || node.placeholder ? (
        <Html
          position={[0, Math.max(0.3, ...node.primitives.map((primitive) => primitive.positionMm.y / 1000)) + 0.35, 0]}
          center
          distanceFactor={7}
          className={`lr-model-object-label ${node.placeholder ? "is-placeholder" : ""}`}
        >
          {node.placeholder ? `Missing adapter · ${node.name}` : node.name}
        </Html>
      ) : null}
    </group>
  );
}

function CameraRig({
  scene,
  activeCameraId,
  controlsRef,
  composition,
}: {
  scene: CompiledLivingRoomScene;
  activeCameraId: string | null;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  composition: RenderComposition;
}) {
  const { camera } = useThree();
  const projectCamera = scene.cameras.find((candidate) => candidate.id === activeCameraId)
    ?? scene.cameras.find((candidate) => candidate.isDefault)
    ?? scene.cameras[0];
  const preset = projectCamera
    ? resolveRenderCameraPose(projectCamera, scene.bounds, composition)
    : null;
  useEffect(() => {
    if (preset) {
      camera.position.set(
        preset.position.x / 1000,
        preset.position.y / 1000,
        preset.position.z / 1000,
      );
      if ("fov" in camera) {
        camera.fov = preset.fieldOfViewDegrees;
        camera.updateProjectionMatrix();
      }
      controlsRef.current?.target.set(
        preset.target.x / 1000,
        preset.target.y / 1000,
        preset.target.z / 1000,
      );
    } else {
      const { center, size } = scene.bounds;
      const distance = Math.max(size.widthMm, size.depthMm, size.heightMm) / 1000 * 1.05;
      camera.position.set(center.x / 1000 + distance, center.y / 1000 + distance * 0.55, center.z / 1000 + distance);
      controlsRef.current?.target.set(center.x / 1000, center.y / 1000, center.z / 1000);
    }
    controlsRef.current?.update();
  }, [
    activeCameraId,
    camera,
    composition,
    controlsRef,
    preset,
    scene.bounds.center.x,
    scene.bounds.center.y,
    scene.bounds.center.z,
    scene.bounds.size.depthMm,
    scene.bounds.size.heightMm,
    scene.bounds.size.widthMm,
  ]);
  return null;
}

function CompiledLights({
  scene,
  shadowMapSize,
  shadowRadius,
}: {
  scene: CompiledLivingRoomScene;
  shadowMapSize: number;
  shadowRadius: number;
}) {
  return (
    <>
      {scene.lights.filter((light) => light.enabled).map((light) => {
        const position: [number, number, number] = [
          light.position.x / 1000,
          light.position.y / 1000,
          light.position.z / 1000,
        ];
        if (light.kind === "ambient") {
          return <ambientLight key={light.id} color={light.color} intensity={light.intensity * 0.58} />;
        }
        if (light.kind === "directional") {
          return <directionalLight key={light.id} position={position} color={light.color} intensity={light.intensity * 0.86} castShadow={light.parameters.castShadow === true} shadow-mapSize={[shadowMapSize, shadowMapSize]} shadow-bias={-0.00028} shadow-normalBias={0.04} shadow-radius={shadowRadius + 2} shadow-camera-near={0.1} shadow-camera-far={30} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} />;
        }
        if (light.kind === "point") {
          return <pointLight key={light.id} position={position} color={light.color} intensity={light.intensity} distance={Number(light.parameters.rangeMm ?? 5000) / 1000} castShadow shadow-radius={shadowRadius} />;
        }
        if (light.kind === "spot") {
          return <spotLight key={light.id} position={position} color={light.color} intensity={light.intensity} angle={Math.PI / 4} penumbra={0.5} castShadow shadow-radius={shadowRadius} />;
        }
        return (
          <rectAreaLight
            key={light.id}
            position={position}
            rotation={[degrees(light.rotation.x), degrees(light.rotation.y), degrees(light.rotation.z)]}
            color={light.color}
            intensity={light.intensity}
            width={Number(light.parameters.widthMm ?? 1200) / 1000}
            height={Number(light.parameters.heightMm ?? 900) / 1000}
          />
        );
      })}
    </>
  );
}

function RendererColorPipeline({ scene }: { scene: CompiledLivingRoomScene }) {
  const { gl } = useThree();
  useEffect(() => {
    gl.outputColorSpace = SRGBColorSpace;
    gl.toneMapping = ACESFilmicToneMapping;
    gl.toneMappingExposure = scene.style.colorManagement.exposure;
    gl.shadowMap.type = scene.style.colorManagement.exposure > 1 ? PCFSoftShadowMap : PCFShadowMap;
  }, [gl, scene.style.colorManagement]);
  return null;
}

export function CompiledSceneRenderer({
  scene,
  selectedIds,
  activeCameraId,
  snapSizeMm,
  showGrid,
  cutawayWalls,
  interactive = true,
  renderQuality = "standard",
  renderComposition = "project-camera",
  onSelect,
  onMove,
}: SceneRendererProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const [dragging, setDragging] = useState(false);
  const materialMap = new Map(scene.materials.map((material) => [material.id, material]));
  const projectCamera = scene.cameras.find((camera) => camera.id === activeCameraId)
    ?? scene.cameras.find((camera) => camera.isDefault)
    ?? scene.cameras[0];
  const renderCamera = projectCamera
    ? resolveRenderCameraPose(projectCamera, scene.bounds, renderComposition)
    : null;
  const cutawaySides = new Set([
    renderCamera && renderCamera.position.x < scene.bounds.center.x ? "left" : "right",
    renderCamera && renderCamera.position.z < scene.bounds.center.z ? "back" : "front",
  ]);
  const nodes = cutawayWalls
    ? scene.nodes.filter((node) => ![
        "wall",
        "opening",
      ].includes(String(node.metadata.role)) || !cutawaySides.has(String(node.metadata.wallSide)))
    : scene.nodes;
  const roomSpan = Math.max(scene.bounds.size.widthMm, scene.bounds.size.depthMm) / 1000;
  const environment = scene.style.environment;
  const quality = getRenderQualityPreset(renderQuality);

  return (
    <>
      <RendererColorPipeline scene={scene} />
      <CameraRig scene={scene} activeCameraId={activeCameraId} controlsRef={controlsRef} composition={renderComposition} />
      <color attach="background" args={[environment.backgroundColor]} />
      <fog attach="fog" args={[environment.fogColor, environment.fogNearMm / 1000, environment.fogFarMm / 1000]} />
      <hemisphereLight
        color={environment.hemisphereSkyColor}
        groundColor={environment.hemisphereGroundColor}
        intensity={environment.hemisphereIntensity * 0.64}
      />
      {renderQuality !== "draft" ? (
        <Environment resolution={quality.environmentResolution} frames={1}>
          <Lightformer form="rect" intensity={1.15} color="#fff8ef" position={[0, 5.5, 1]} rotation={[-Math.PI / 2, 0, 0]} scale={[7, 7, 1]} />
          <Lightformer form="rect" intensity={0.75} color="#dfeaff" position={[-5, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} scale={[3.5, 5, 1]} />
          <Lightformer form="rect" intensity={0.5} color="#ffe3c4" position={[4, 2, -3]} rotation={[0, -Math.PI / 3, 0]} scale={[2.5, 3.5, 1]} />
        </Environment>
      ) : null}
      <CompiledLights scene={scene} shadowMapSize={quality.shadowMapSize} shadowRadius={quality.shadowRadius} />
      {showGrid ? <gridHelper args={[Math.max(8, roomSpan + 2), Math.max(16, Math.round((roomSpan + 2) * 2)), environment.gridPrimaryColor, environment.gridSecondaryColor]} position={[0, 0.002, 0]} /> : null}
      {nodes.map((node) => (
        <CompiledNodeView
          key={node.id}
          node={node}
          materials={materialMap}
          selected={Boolean(node.sourceObjectId && selectedIds.includes(node.sourceObjectId))}
          snapSizeMm={snapSizeMm}
          onSelect={onSelect}
          onMove={onMove}
          onDragStateChange={setDragging}
          interactive={interactive}
        />
      ))}
      <ContactShadows
        key={scene.fingerprint}
        position={[0, 0.004, 0]}
        scale={Math.max(8, roomSpan + 1)}
        opacity={environment.contactShadowOpacity}
        blur={environment.contactShadowBlur}
        far={4}
        resolution={quality.contactShadowResolution}
        frames={1}
      />
      {interactive ? (
        <OrbitControls
          ref={controlsRef}
          enabled={!dragging}
          enableDamping
          dampingFactor={0.08}
          minDistance={1.4}
          maxDistance={20}
          maxPolarAngle={Math.PI / 2 - 0.02}
          mouseButtons={{ LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.PAN, RIGHT: MOUSE.PAN }}
        />
      ) : null}
    </>
  );
}
