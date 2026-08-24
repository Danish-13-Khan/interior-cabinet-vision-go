import type { CameraEntity } from "../../domain/interiorProject";
import type { CompiledLivingRoomScene } from "../../domain/livingRoom";
import {
  validateCameraFraming,
  type CameraFramingReport,
} from "../../domain/livingRoom/renderQa/cameraFramingValidation";
import {
  getMaterialAsset,
  getTextureAsset,
  resolveEnvironmentDrawState,
  resolveNodeDrawStrategy,
} from "../assets/assetRegistry";
import { resolveMaterialTextureUrls } from "../materials/resolveMaterialTextureUrls";

export type RenderDiagnosticWarning = {
  code:
    | "glb-fallback"
    | "hdri-fallback"
    | "material-map-fallback"
    | "missing-material-asset"
    | "camera-framing";
  severity: "warning" | "error";
  message: string;
  subjectId?: string;
};

export type RenderDiagnosticsReport = {
  generatedAt: string;
  sceneFingerprint: string;
  lightingRecipeId: string;
  glbNodeCount: number;
  proceduralFallbackCount: number;
  materialFallbackCount: number;
  hdriFallback: boolean;
  camera: CameraFramingReport;
  warnings: RenderDiagnosticWarning[];
};

function materialFallbackWarning(
  materialId: string,
  materialAssetId: string | undefined,
): RenderDiagnosticWarning | null {
  const asset = getMaterialAsset(materialAssetId ?? materialId)
    ?? getMaterialAsset(materialId);
  if (!asset) {
    return {
      code: "missing-material-asset",
      severity: "warning",
      subjectId: materialId,
      message: `Material ${materialId} has no registry asset; procedural color used.`,
    };
  }

  const mapIds = [
    asset.colorMapId,
    asset.normalMapId,
    asset.roughnessMapId,
    asset.aoMapId,
  ].filter((id): id is string => Boolean(id));
  if (mapIds.length === 0) return null;

  const unavailable = mapIds.filter((id) => getTextureAsset(id)?.available !== true);
  if (unavailable.length > 0) {
    return {
      code: "material-map-fallback",
      severity: "warning",
      subjectId: materialId,
      message: `Material ${asset.name} missing maps (${unavailable.join(", ")}); procedural maps used.`,
    };
  }

  const urls = resolveMaterialTextureUrls({
    id: materialId,
    materialAssetId: asset.id,
    name: asset.name,
    kind: asset.kind,
    color: asset.baseColor,
    roughness: asset.roughness,
    metalness: asset.metalness,
    opacity: asset.opacity,
    uvScaleMm: asset.uvScaleMm,
  });
  if (urls.map || urls.normalMap || urls.roughnessMap || urls.aoMap) return null;
  return {
    code: "material-map-fallback",
    severity: "warning",
    subjectId: materialId,
    message: `Material ${asset.name} could not resolve texture URLs; procedural maps used.`,
  };
}

/** Collect asset / material / camera diagnostics for the compiled scene. */
export function collectRenderDiagnostics(
  scene: CompiledLivingRoomScene,
  activeCamera: CameraEntity | null | undefined,
  now = new Date().toISOString(),
): RenderDiagnosticsReport {
  const warnings: RenderDiagnosticWarning[] = [];
  let glbNodeCount = 0;
  let proceduralFallbackCount = 0;

  for (const node of scene.nodes) {
    const binding = node.renderBinding;
    if (binding.strategy !== "glb") continue;
    if (resolveNodeDrawStrategy(binding) === "glb") {
      glbNodeCount += 1;
      continue;
    }
    proceduralFallbackCount += 1;
    warnings.push({
      code: "glb-fallback",
      severity: "warning",
      subjectId: node.id,
      message: `Node ${node.name} requested GLB ${binding.modelAssetId ?? "?"} but drew procedural.`,
    });
  }

  let materialFallbackCount = 0;
  for (const material of scene.materials) {
    const warning = materialFallbackWarning(material.id, material.materialAssetId);
    if (!warning) continue;
    materialFallbackCount += 1;
    warnings.push(warning);
  }

  const env = resolveEnvironmentDrawState(scene.lightingRecipeId);
  const hdriFallback = env.fallbackRequired;
  if (hdriFallback) {
    warnings.push({
      code: "hdri-fallback",
      severity: "warning",
      subjectId: scene.lightingRecipeId,
      message: `HDRI unavailable for ${scene.lightingRecipeId}; Lightformer fallback active.`,
    });
  }

  const camera = validateCameraFraming(activeCamera, scene.bounds);
  for (const issue of camera.issues) {
    warnings.push({
      code: "camera-framing",
      severity: issue.severity,
      subjectId: camera.cameraId ?? undefined,
      message: issue.message,
    });
  }

  return {
    generatedAt: now,
    sceneFingerprint: scene.fingerprint,
    lightingRecipeId: scene.lightingRecipeId,
    glbNodeCount,
    proceduralFallbackCount,
    materialFallbackCount,
    hdriFallback,
    camera,
    warnings,
  };
}
