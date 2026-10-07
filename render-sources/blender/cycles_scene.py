"""Rebuild a `CyclesStillBundle` inside Blender: materials, geometry, GLB imports, fixtures, lights, camera, world.

Runs inside Blender only (`bpy`). All geometry is created in three.js local
coordinates and placed with `still_bundle_math.to_blender_keeping_local`, so the
bundle's transforms are used as-is and the Z-up change happens once per object.
"""
from __future__ import annotations

import json
import math
import os

import bpy
import mathutils
from mathutils import Matrix as BMatrix
from mathutils.geometry import tessellate_polygon

import still_bundle_math as m3

PI = math.pi


def hex_to_linear(value: str):
    value = value.lstrip("#")
    r, g, b = (int(value[i:i + 2], 16) / 255.0 for i in (0, 2, 4))
    def lin(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (lin(r), lin(g), lin(b), 1.0)


def bmatrix(rows) -> BMatrix:
    return BMatrix([[float(v) for v in row] for row in rows])


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    return scene


# ---------------------------------------------------------------- materials

def _socket(node, name: str, output: bool = False):
    sockets = node.outputs if output else node.inputs
    for socket in sockets:
        if socket.identifier == name or socket.name == name:
            return socket
    raise KeyError(f"{node.bl_idname} has no socket {name}")


def _load_image(path: str, colorspace: str):
    image = bpy.data.images.load(path, check_existing=True)
    image.colorspace_settings.name = colorspace
    return image


def _scan_means(source_dir: str):
    """Means precomputed by `scripts/cycles/scan-means.mjs` into source.json; None when absent."""
    path = os.path.join(source_dir, "source.json")
    try:
        with open(path, "r", encoding="utf8") as handle:
            data = json.load(handle)
    except OSError:
        return None
    if "colorMeanLinear" not in data or "roughnessMean" not in data:
        return None
    return data


def build_material(spec: dict, root: str):
    mat = bpy.data.materials.new(spec["id"])
    mat.use_nodes = True
    tree = mat.node_tree
    bsdf = tree.nodes["Principled BSDF"]
    tint = hex_to_linear(spec["color"])
    _socket(bsdf, "Base Color").default_value = tint
    _socket(bsdf, "Roughness").default_value = float(spec["roughness"])
    _socket(bsdf, "Metallic").default_value = float(spec["metalness"])
    kind = spec.get("kind")
    if kind == "glass":
        _socket(bsdf, "Transmission Weight").default_value = 1.0
        _socket(bsdf, "Roughness").default_value = min(0.08, float(spec["roughness"]))
    opacity = float(spec.get("opacity", 1.0))
    if opacity < 1.0:
        _socket(bsdf, "Alpha").default_value = opacity
        if hasattr(mat, "blend_method"):
            try:
                mat.blend_method = "BLEND"
            except TypeError:
                pass

    scan = spec.get("scan")
    source_dir = os.path.join(root, scan["sourceDir"]) if scan else None
    means = _scan_means(source_dir) if source_dir else None
    if not scan or means is None:
        return mat

    tile_m = max(0.01, float(spec.get("tileMm") or scan.get("tileMm") or 1000) / 1000.0)
    coord = tree.nodes.new("ShaderNodeTexCoord")
    mapping = tree.nodes.new("ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = (1.0 / tile_m, 1.0 / tile_m, 1.0)
    rotation = float(spec.get("uvRotationDeg") or 0.0)
    if spec.get("grainDirection") == "crosswise":
        rotation += 90.0
    mapping.inputs["Rotation"].default_value = (0.0, 0.0, math.radians(rotation))
    tree.links.new(coord.outputs["UV"], mapping.inputs["Vector"])

    # Colour: the scan is detail around its own mean; the style colour is the albedo.
    color_tex = tree.nodes.new("ShaderNodeTexImage")
    color_tex.image = _load_image(os.path.join(source_dir, "color.png"), "sRGB")
    tree.links.new(mapping.outputs["Vector"], color_tex.inputs["Vector"])
    mean = means["colorMeanLinear"]
    factor = tuple(tint[i] / max(1e-4, mean[i]) for i in range(3)) + (1.0,)
    mix = tree.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "MULTIPLY"
    mix.clamp_result = True
    _socket(mix, "Factor_Float").default_value = 1.0
    tree.links.new(color_tex.outputs["Color"], _socket(mix, "A_Color"))
    _socket(mix, "B_Color").default_value = factor
    tree.links.new(_socket(mix, "Result_Color", output=True), _socket(bsdf, "Base Color"))

    # Roughness: scan variation lifted to the material roughness.
    rough_tex = tree.nodes.new("ShaderNodeTexImage")
    rough_tex.image = _load_image(os.path.join(source_dir, "roughness.png"), "Non-Color")
    tree.links.new(mapping.outputs["Vector"], rough_tex.inputs["Vector"])
    scale = tree.nodes.new("ShaderNodeMath")
    scale.operation = "MULTIPLY"
    scale.use_clamp = True
    scale.inputs[1].default_value = float(spec["roughness"]) / max(1e-4, float(means["roughnessMean"]))
    tree.links.new(rough_tex.outputs["Color"], scale.inputs[0])
    tree.links.new(scale.outputs["Value"], _socket(bsdf, "Roughness"))

    normal_tex = tree.nodes.new("ShaderNodeTexImage")
    normal_tex.image = _load_image(os.path.join(source_dir, "normal.png"), "Non-Color")
    tree.links.new(mapping.outputs["Vector"], normal_tex.inputs["Vector"])
    normal_map = tree.nodes.new("ShaderNodeNormalMap")
    normal_map.inputs["Strength"].default_value = 1.0
    tree.links.new(normal_tex.outputs["Color"], normal_map.inputs["Color"])
    tree.links.new(normal_map.outputs["Normal"], _socket(bsdf, "Normal"))
    return mat


def build_materials(bundle: dict, root: str) -> dict:
    return {spec["id"]: build_material(spec, root) for spec in bundle["materials"]}


def emissive_material(name: str, color: str, metalness: float, roughness: float, emissive: str | None, strength: float):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    _socket(bsdf, "Base Color").default_value = hex_to_linear(color)
    _socket(bsdf, "Metallic").default_value = metalness
    _socket(bsdf, "Roughness").default_value = roughness
    if emissive and strength > 0:
        _socket(bsdf, "Emission Color").default_value = hex_to_linear(emissive)
        _socket(bsdf, "Emission Strength").default_value = m3.emission_strength(strength)
    return mat


# ---------------------------------------------------------------- geometry (three.js local coordinates)

def _box_uv(normal, p):
    nx, ny, nz = (abs(c) for c in normal)
    if nx >= ny and nx >= nz:
        return (p[2], p[1])
    if ny >= nx and ny >= nz:
        return (p[0], p[2])
    return (p[0], p[1])


def _mesh_object(name: str, verts, faces, material, matrix: BMatrix, cast_shadow=True):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([tuple(v) for v in verts], [], [tuple(f) for f in faces])
    mesh.update()
    uv_layer = mesh.uv_layers.new(name="UVMap")
    for poly in mesh.polygons:
        normal = poly.normal
        for loop_index in poly.loop_indices:
            vertex = mesh.vertices[mesh.loops[loop_index].vertex_index].co
            uv_layer.data[loop_index].uv = _box_uv(normal, vertex)
    mesh.materials.append(material)
    obj = bpy.data.objects.new(name, mesh)
    obj.matrix_world = matrix
    obj.visible_shadow = cast_shadow
    bpy.context.scene.collection.objects.link(obj)
    return obj


def box_geometry(w: float, h: float, d: float):
    x, y, z = w / 2, h / 2, d / 2
    verts = [(-x, -y, -z), (x, -y, -z), (x, y, -z), (-x, y, -z), (-x, -y, z), (x, -y, z), (x, y, z), (-x, y, z)]
    faces = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    return verts, faces


def cylinder_geometry(r_top: float, r_bottom: float, height: float, segments: int):
    """Axis along local Y like three's CylinderGeometry. r_top = 0 gives a cone."""
    segments = max(3, int(segments))
    half = height / 2
    verts, faces = [], []
    for i in range(segments):
        a = 2 * PI * i / segments
        verts.append((r_bottom * math.cos(a), -half, r_bottom * math.sin(a)))
    top_start = len(verts)
    if r_top > 1e-6:
        for i in range(segments):
            a = 2 * PI * i / segments
            verts.append((r_top * math.cos(a), half, r_top * math.sin(a)))
        for i in range(segments):
            j = (i + 1) % segments
            faces.append((i, j, top_start + j, top_start + i))
        faces.append(tuple(range(top_start, top_start + segments)))
    else:
        apex = len(verts)
        verts.append((0.0, half, 0.0))
        for i in range(segments):
            faces.append((i, (i + 1) % segments, apex))
    faces.append(tuple(reversed(range(segments))))
    return verts, faces


def prism_geometry(outline, holes, height: float):
    """three's ExtrudeGeometry: shape (x, z) in the local XY plane, extruded along local Z, centred."""
    half = height / 2
    rings = [[(p["x"], p["z"]) for p in outline]] + [[(p["x"], p["z"]) for p in hole] for hole in holes]
    flat = [p for ring in rings for p in ring]
    triangles = tessellate_polygon([[mathutils.Vector((x, y, 0.0)) for (x, y) in ring] for ring in rings])
    n = len(flat)
    verts = [(x, y, -half) for (x, y) in flat] + [(x, y, half) for (x, y) in flat]
    faces = [tuple(reversed(t)) for t in triangles] + [tuple(i + n for i in t) for t in triangles]
    offset = 0
    for ring in rings:
        count = len(ring)
        for i in range(count):
            a, b = offset + i, offset + (i + 1) % count
            faces.append((a, b, b + n, a + n))
        offset += count
    return verts, faces


def primitive_geometry(prim: dict):
    kind = prim["kind"]
    if kind in ("box", "rounded-box"):
        s = prim["sizeM"]
        return box_geometry(s["width"], s["height"], s["depth"])
    if kind == "cylinder":
        return cylinder_geometry(prim["radiusTopM"], prim["radiusBottomM"], prim["heightM"], prim["radialSegments"])
    return prism_geometry(prim["outlineM"], prim["holesM"], prim["heightM"])


# ---------------------------------------------------------------- scene

GROUND_SLAB_MARGIN_M = 3.0
GROUND_SLAB_THICKNESS_M = 0.3


def build_ground_slab(bundle: dict):
    """A dark slab under every floor. Closes the floor/wall seams against sky from below."""
    xs, ys, zs = [], [], []
    for node in bundle["nodes"]:
        p = node["world"]["position"]
        xs.append(p["x"]); ys.append(p["y"]); zs.append(p["z"])
    if not xs:
        return
    floor_bottom = min(ys) - 0.02
    cx, cz = (min(xs) + max(xs)) / 2, (min(zs) + max(zs)) / 2
    w = (max(xs) - min(xs)) + GROUND_SLAB_MARGIN_M * 2
    d = (max(zs) - min(zs)) + GROUND_SLAB_MARGIN_M * 2
    verts, faces = box_geometry(w, GROUND_SLAB_THICKNESS_M, d)
    material = bpy.data.materials.new("cycles-ground-slab")
    material.use_nodes = True
    _socket(material.node_tree.nodes["Principled BSDF"], "Base Color").default_value = (0.05, 0.045, 0.04, 1.0)
    three = m3.translation(cx, floor_bottom - GROUND_SLAB_THICKNESS_M / 2, cz)
    _mesh_object("cycles-ground-slab", verts, faces, material, bmatrix(m3.to_blender_keeping_local(three)))


def build_nodes(bundle: dict, materials: dict, root: str):
    build_ground_slab(bundle)
    fallback = bpy.data.materials.new("cycles-missing-material")
    for node in bundle["nodes"]:
        world = m3.transform_matrix(node["world"])
        for prim in node["primitives"]:
            local = m3.multiply(world, m3.transform_matrix(prim["local"]))
            verts, faces = primitive_geometry(prim)
            material = materials.get(prim["materialId"], fallback)
            _mesh_object(f"{node['id']}:{prim['id']}", verts, faces, material, bmatrix(m3.to_blender_keeping_local(local)), prim.get("castShadow", True))
        model = node.get("model")
        if model:
            import_model(node, model, world, materials, root)


def import_model(node: dict, model: dict, world, materials: dict, root: str):
    path = os.path.join(root, "public", model["assetKey"])
    if not os.path.exists(path):
        print(f"[cycles] missing model {path}; node {node['id']} keeps no geometry")
        return
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    imported = [obj for obj in bpy.data.objects if obj not in before]
    parent = bpy.data.objects.new(f"{node['id']}:model", None)
    bpy.context.scene.collection.objects.link(parent)
    s = model["scale"]
    three = m3.multiply(world, m3.scaling(s["x"], s["y"], s["z"]))
    parent.matrix_world = bmatrix(m3.to_blender_rebased(three))
    for obj in imported:
        if obj.parent is None:
            obj.parent = parent
        if obj.type != "MESH":
            continue
        bind_model_materials(obj, model, materials)


def bind_model_materials(obj, model: dict, materials: dict):
    groups = model.get("materialGroups") or {}
    bindings = model.get("materialBindings") or {}
    mesh_name = obj.name.lower()
    for slot in obj.material_slots:
        source = slot.material
        source_name = (source.name if source else "").lower()
        if model.get("preserveSourceMaterials") and source and source.use_nodes and any(
            n.bl_idname == "ShaderNodeTexImage" and n.image for n in source.node_tree.nodes
        ):
            continue
        chosen = None
        for semantic, token in groups.items():
            token = str(token).lower()
            if token and (token in source_name or token in mesh_name):
                chosen = bindings.get(semantic)
                break
        if chosen is None and len(bindings) == 1:
            chosen = next(iter(bindings.values()))
        if chosen and chosen in materials:
            slot.material = materials[chosen]


def _light_object(name: str, data, matrix: BMatrix):
    obj = bpy.data.objects.new(name, data)
    obj.matrix_world = matrix
    bpy.context.scene.collection.objects.link(obj)
    return obj


def build_fixture_light(fixture: dict, light: dict, group):
    within = m3.transform_matrix(light["within"]) if light.get("within") else m3.identity()
    three = m3.multiply(m3.multiply(group, within), m3.transform_matrix(light["local"]))
    matrix = bmatrix(m3.to_blender_keeping_local(three))
    color = hex_to_linear(light["color"])[:3]
    if light["kind"] == "area":
        data = bpy.data.lights.new(light["id"], "AREA")
        data.shape = "RECTANGLE"
        data.size = max(0.005, light["sizeM"]["width"])
        data.size_y = max(0.005, light["sizeM"]["height"])
        data.energy = m3.area_light_watts(light["nits"], data.size, data.size_y)
    elif light["kind"] == "spot":
        data = bpy.data.lights.new(light["id"], "SPOT")
        data.spot_size = math.radians(max(1.0, min(179.0, light["beamAngleDeg"])))
        data.spot_blend = float(light.get("penumbra", 0.5))
        data.energy = m3.spot_light_watts(light["candela"])
        data.shadow_soft_size = 0.02
    else:
        data = bpy.data.lights.new(light["id"], "POINT")
        data.shadow_soft_size = float(light.get("radiusM", 0.03))
        data.energy = m3.point_light_watts(light["candela"])
    data.color = color
    data.use_shadow = bool(light.get("castShadow", True))
    _light_object(f"{fixture['lightId']}:{light['id']}", data, matrix)


def build_fixtures(bundle: dict):
    for fixture in bundle["fixtures"]:
        group = m3.transform_matrix(fixture["group"])
        for index, part in enumerate(fixture["parts"]):
            within = m3.transform_matrix(part["within"]) if part.get("within") else m3.identity()
            three = m3.multiply(m3.multiply(group, within), m3.transform_matrix(part["local"]))
            if part["shape"] == "box":
                b = part["box"]
                verts, faces = box_geometry(b["width"], b["height"], b["depth"])
            else:
                c = part["cyl"]
                verts, faces = cylinder_geometry(c["radiusTop"], c["radiusBottom"], c["height"], c["segments"])
            material = emissive_material(
                f"{fixture['lightId']}:part{index}", part["color"], part["metalness"], part["roughness"],
                part.get("emissiveColor"), float(part.get("emissiveStrength", 0.0)),
            )
            _mesh_object(f"{fixture['lightId']}:part{index}", verts, faces, material, bmatrix(m3.to_blender_keeping_local(three)))
        for light in fixture["lights"]:
            build_fixture_light(fixture, light, group)


def build_sun(name: str, position: dict, target: dict, color: str, lux: float, cast_shadow: bool):
    data = bpy.data.lights.new(name, "SUN")
    data.energy = m3.sun_strength(lux)
    data.color = hex_to_linear(color)[:3]
    data.use_shadow = cast_shadow
    data.angle = math.radians(1.5)
    _light_object(name, data, bmatrix(m3.to_blender_keeping_local(m3.look_at(position, target))))


def build_recipe_lights(bundle: dict):
    ambient_total = 0.0
    for light in bundle["recipeLights"]:
        kind = light["kind"]
        if kind == "ambient":
            ambient_total += float(light["intensity"])
            continue
        if kind == "sun":
            build_sun(light["id"], light["positionM"], light["targetM"], light["color"], light["lux"], light["castShadow"])
            continue
        if kind == "area":
            data = bpy.data.lights.new(light["id"], "AREA")
            data.shape = "RECTANGLE"
            data.size, data.size_y = light["sizeM"]["width"], light["sizeM"]["height"]
            data.energy = m3.area_light_watts(light["nits"], data.size, data.size_y)
            data.color = hex_to_linear(light["color"])[:3]
            _light_object(light["id"], data, bmatrix(m3.to_blender_keeping_local(m3.transform_matrix(light["world"]))))
            continue
        p = light["positionM"]
        matrix = bmatrix(m3.to_blender_keeping_local(m3.translation(p["x"], p["y"], p["z"])))
        if kind == "spot":
            data = bpy.data.lights.new(light["id"], "SPOT")
            data.spot_size = math.radians(light["beamAngleDeg"])
            data.spot_blend = light["penumbra"]
            data.energy = m3.spot_light_watts(light["candela"])
        else:
            data = bpy.data.lights.new(light["id"], "POINT")
            data.energy = m3.point_light_watts(light["candela"])
            data.shadow_soft_size = 0.05
        data.color = hex_to_linear(light["color"])[:3]
        _light_object(light["id"], data, matrix)
    for key in bundle["windowKeys"]:
        build_sun(key["id"], key["positionM"], key["targetM"], key["color"], key["lux"], key["castShadow"])
    return ambient_total


def build_camera(bundle: dict):
    cam = bundle["camera"]
    data = bpy.data.cameras.new("still-camera")
    data.sensor_fit = "VERTICAL"
    data.angle_y = math.radians(float(cam["fovDeg"]))
    data.clip_start = 0.05
    data.clip_end = 200.0
    obj = _light_object("still-camera", data, bmatrix(m3.to_blender_keeping_local(m3.look_at(cam["eyeM"], cam["targetM"]))))
    bpy.context.scene.camera = obj
    return obj


def build_world(bundle: dict, root: str, ambient_total: float):
    env = bundle["environment"]
    world = bpy.data.worlds.new("still-world")
    world.use_nodes = True
    bpy.context.scene.world = world
    tree = world.node_tree
    background = tree.nodes["Background"]
    asset_key = env.get("hdriAssetKey")
    path = os.path.join(root, "public", asset_key) if asset_key else None
    if path and os.path.exists(path):
        tex = tree.nodes.new("ShaderNodeTexEnvironment")
        tex.image = bpy.data.images.load(path, check_existing=True)
        tree.links.new(tex.outputs["Color"], background.inputs["Color"])
        background.inputs["Strength"].default_value = float(env["hdriStrength"])
    else:
        background.inputs["Color"].default_value = hex_to_linear(env["backgroundColor"])
        background.inputs["Strength"].default_value = max(0.05, ambient_total)
