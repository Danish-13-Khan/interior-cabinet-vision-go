/**
 * Generates minimal soft-goods placeholder GLBs with named meshes for material slots.
 * Run: node scripts/generate-soft-goods-glbs.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Scene,
} from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

// GLTFExporter expects browser FileReader when serializing binary output.
if (typeof globalThis.FileReader === "undefined") {
  globalThis.FileReader = class FileReaderPolyfill {
    result = null;
    onloadend = null;
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((buffer) => {
        this.result = buffer;
        this.onloadend?.({ target: this });
      });
    }
  };
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "models", "soft-goods");

function mesh(name, geometry, color, y, opts = {}) {
  const material = new MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.7,
    metalness: opts.metalness ?? 0,
  });
  const item = new Mesh(geometry, material);
  item.name = name;
  item.position.y = y;
  item.castShadow = true;
  item.receiveShadow = true;
  return item;
}

function sofa() {
  const group = new Group();
  group.name = "sofa-3-seat";
  group.add(mesh("upholstery_body", new BoxGeometry(2.0, 0.28, 0.78), "#c8baa6", 0.38));
  group.add(mesh("upholstery_back", new BoxGeometry(1.95, 0.42, 0.18), "#c8baa6", 0.68));
  group.add(mesh("legs_fl", new CylinderGeometry(0.03, 0.035, 0.18, 12), "#2d302f", 0.09, { metalness: 0.7, roughness: 0.35 }));
  group.add(mesh("legs_fr", new CylinderGeometry(0.03, 0.035, 0.18, 12), "#2d302f", 0.09, { metalness: 0.7, roughness: 0.35 }));
  group.children[2].position.x = -0.85;
  group.children[2].position.z = -0.28;
  group.children[3].position.x = 0.85;
  group.children[3].position.z = -0.28;
  group.add(mesh("legs_bl", new CylinderGeometry(0.03, 0.035, 0.18, 12), "#2d302f", 0.09, { metalness: 0.7, roughness: 0.35 }));
  group.add(mesh("legs_br", new CylinderGeometry(0.03, 0.035, 0.18, 12), "#2d302f", 0.09, { metalness: 0.7, roughness: 0.35 }));
  group.children[4].position.x = -0.85;
  group.children[4].position.z = 0.28;
  group.children[5].position.x = 0.85;
  group.children[5].position.z = 0.28;
  return group;
}

function loungeChair() {
  const group = new Group();
  group.name = "lounge-chair";
  group.add(mesh("upholstery_seat", new BoxGeometry(0.62, 0.14, 0.55), "#73765a", 0.42));
  group.add(mesh("upholstery_back", new BoxGeometry(0.62, 0.42, 0.14), "#73765a", 0.68));
  group.add(mesh("frame_left", new BoxGeometry(0.06, 0.28, 0.55), "#b98a58", 0.45));
  group.add(mesh("frame_right", new BoxGeometry(0.06, 0.28, 0.55), "#b98a58", 0.45));
  group.children[2].position.x = -0.34;
  group.children[3].position.x = 0.34;
  return group;
}

function coffeeTable() {
  const group = new Group();
  group.name = "coffee-table";
  group.add(mesh("top", new BoxGeometry(1.2, 0.05, 0.65), "#b98a58", 0.355));
  for (const [x, z] of [[-0.48, -0.24], [0.48, -0.24], [-0.48, 0.24], [0.48, 0.24]]) {
    const leg = mesh(`frame_leg_${x}_${z}`, new BoxGeometry(0.04, 0.33, 0.04), "#2d302f", 0.165, { metalness: 0.7, roughness: 0.35 });
    leg.position.x = x;
    leg.position.z = z;
    group.add(leg);
  }
  return group;
}

function sideTable() {
  const group = new Group();
  group.name = "side-table";
  group.add(mesh("top", new CylinderGeometry(0.24, 0.24, 0.03, 32), "#b98a58", 0.505));
  group.add(mesh("frame_stem", new CylinderGeometry(0.025, 0.025, 0.44, 16), "#2d302f", 0.25, { metalness: 0.7, roughness: 0.35 }));
  group.add(mesh("frame_base", new CylinderGeometry(0.16, 0.16, 0.03, 32), "#2d302f", 0.015, { metalness: 0.7, roughness: 0.35 }));
  return group;
}

function floorLamp() {
  const group = new Group();
  group.name = "floor-lamp";
  group.add(mesh("frame_base", new CylinderGeometry(0.14, 0.14, 0.03, 24), "#2d302f", 0.015, { metalness: 0.7, roughness: 0.35 }));
  group.add(mesh("frame_stem", new CylinderGeometry(0.02, 0.02, 1.2, 12), "#2d302f", 0.63, { metalness: 0.7, roughness: 0.35 }));
  group.add(mesh("shade", new CylinderGeometry(0.14, 0.2, 0.35, 24), "#c8baa6", 1.4, { roughness: 0.95 }));
  return group;
}

function indoorPlant() {
  const group = new Group();
  group.name = "indoor-plant";
  group.add(mesh("planter", new CylinderGeometry(0.18, 0.14, 0.32, 24), "#b8a68d", 0.16, { roughness: 1 }));
  group.add(mesh("foliage_a", new CylinderGeometry(0.16, 0.04, 0.45, 16), "#73765a", 0.95, { roughness: 0.95 }));
  group.add(mesh("foliage_b", new CylinderGeometry(0.14, 0.04, 0.4, 16), "#73765a", 1.05, { roughness: 0.95 }));
  group.children[1].position.x = -0.08;
  group.children[2].position.x = 0.1;
  return group;
}

async function exportGlb(group, fileName) {
  const scene = new Scene();
  scene.add(group);
  const exporter = new GLTFExporter();
  const arrayBuffer = await exporter.parseAsync(scene, { binary: true });
  writeFileSync(join(outDir, fileName), Buffer.from(arrayBuffer));
}

mkdirSync(outDir, { recursive: true });
await exportGlb(sofa(), "sofa-3-seat.glb");
await exportGlb(loungeChair(), "lounge-chair.glb");
await exportGlb(coffeeTable(), "coffee-table.glb");
await exportGlb(sideTable(), "side-table.glb");
await exportGlb(floorLamp(), "floor-lamp.glb");
await exportGlb(indoorPlant(), "indoor-plant.glb");
console.log(`Wrote soft-goods GLBs to ${outDir}`);
