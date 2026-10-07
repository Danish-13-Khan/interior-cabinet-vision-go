"""Cycles still engine entry point. Run by `scripts/cycles/render-still.mjs`:

  blender -b --python render-sources/blender/render_still.py -- \
      --bundle <dir>/bundle.json --out <dir>/still.png --provenance <dir>/provenance.json \
      --root <repo root> [--device auto|cpu|gpu] [--samples N] [--time-cap S] [--rerun]

Deterministic by construction: pinned seed, fixed sample cap and time cap, CPU
OpenImageDenoise, AgX view transform. `--rerun` renders twice and records the
mean absolute 8-bit channel difference, the trust contract's deterministic gate.
"""
from __future__ import annotations

import hashlib
import json
import math
import os
import platform
import sys
import time

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import cycles_scene as cs  # noqa: E402
import still_bundle_math as m3  # noqa: E402

ENGINE_ID = "stilljob-cycles"
ENGINE_VERSION = "1.0.0"
DETERMINISTIC_MAD_LIMIT = 0.02 * 255


def parse_args(argv):
    args = {"device": "auto", "rerun": False}
    i = 0
    while i < len(argv):
        key = argv[i]
        if key == "--rerun":
            args["rerun"] = True
            i += 1
            continue
        if key.startswith("--") and i + 1 < len(argv):
            args[key[2:]] = argv[i + 1]
            i += 2
            continue
        i += 1
    for required in ("bundle", "out", "provenance", "root"):
        if required not in args:
            raise SystemExit(f"missing --{required}")
    return args


def pick_device(preference: str) -> str:
    """Enable the first GPU backend Cycles finds, unless the run asked for CPU."""
    if preference == "cpu":
        return "CPU"
    prefs = bpy.context.preferences.addons.get("cycles")
    if not prefs:
        return "CPU"
    cycles_prefs = prefs.preferences
    for backend in ("METAL", "CUDA", "OPTIX", "HIP", "ONEAPI"):
        try:
            cycles_prefs.compute_device_type = backend
        except TypeError:
            continue
        cycles_prefs.get_devices()
        gpus = [d for d in cycles_prefs.devices if d.type != "CPU"]
        if gpus:
            for device in cycles_prefs.devices:
                device.use = device.type != "CPU"
            return "GPU"
    return "CPU"


def configure_render(scene, bundle: dict, args: dict) -> dict:
    render = bundle["render"]
    scene.render.engine = "CYCLES"
    cycles = scene.cycles
    device = pick_device(args.get("device", render.get("device", "auto")))
    cycles.device = device
    cycles.samples = int(args.get("samples") or render["samplesMax"])
    cycles.use_adaptive_sampling = True
    cycles.adaptive_threshold = 0.02
    cycles.time_limit = float(args.get("time-cap") or render["timeCapSeconds"])
    cycles.seed = int(render["seed"])
    cycles.use_animated_seed = False
    cycles.use_denoising = bool(render.get("denoise", True))
    try:
        cycles.denoiser = "OPENIMAGEDENOISE"
        cycles.denoising_use_gpu = False  # CPU OIDN keeps reruns bit-stable across GPU drivers
    except (AttributeError, TypeError):
        pass
    cycles.max_bounces = 8
    cycles.diffuse_bounces = 4
    cycles.glossy_bounces = 4
    cycles.transmission_bounces = 8
    cycles.caustics_reflective = False
    cycles.caustics_refractive = False
    scene.render.resolution_x = int(render["widthPx"])
    scene.render.resolution_y = int(render["heightPx"])
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = False
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.color_depth = "8"
    view = scene.view_settings
    try:
        view.view_transform = "AgX" if bundle["environment"]["toneMapping"] == "agx" else "Filmic"
    except TypeError:
        view.view_transform = "Filmic"
    view.look = "None"
    view.exposure = m3.exposure_stops(float(bundle["environment"]["exposure"])) + m3.EXPOSURE_OFFSET_STOPS
    view.gamma = 1.0
    return {"device": device, "samples": cycles.samples, "timeLimit": cycles.time_limit}


def _compositor_tree(scene):
    """Blender 5 keeps the compositor in a node group on the scene; 4.x uses scene.node_tree."""
    if hasattr(scene, "compositing_node_group"):
        tree = bpy.data.node_groups.new("still-glow", "CompositorNodeTree")
        scene.compositing_node_group = tree
        return tree
    scene.use_nodes = True
    return scene.node_tree


def _set_glare(glare, name: str, value):
    """Glare settings are inputs from 4.4 on and properties before that."""
    socket = glare.inputs.get(name) if hasattr(glare, "inputs") else None
    if socket is not None:
        socket.default_value = value
        return
    attr = {"Threshold": "threshold", "Size": "size", "Strength": "mix"}.get(name)
    if attr and hasattr(glare, attr):
        setattr(glare, attr, value)


def configure_glow(scene) -> bool:
    """Glare only on the emission pass, added back to the image: fixtures glow, nothing else blooms.

    Returns False (and leaves the plain image) when this Blender's compositor API differs.
    """
    try:
        scene.view_layers[0].use_pass_emit = True
        tree = _compositor_tree(scene)
        for node in list(tree.nodes):
            tree.nodes.remove(node)
        layers = tree.nodes.new("CompositorNodeRLayers")
        glare = tree.nodes.new("CompositorNodeGlare")
        if "Type" in glare.inputs:
            try:
                glare.inputs["Type"].default_value = "FOG_GLOW"
            except TypeError:
                glare.inputs["Type"].default_value = "Fog Glow"  # Blender 5 names the enum by label
        else:
            glare.glare_type = "FOG_GLOW"
        _set_glare(glare, "Threshold", 1.0)
        _set_glare(glare, "Size", 7)
        _set_glare(glare, "Strength", 1.0)
        try:
            add = tree.nodes.new("CompositorNodeMixRGB")
            add.blend_type = "ADD"
            add.inputs[0].default_value = 0.6
            add_a, add_b, add_out = add.inputs[1], add.inputs[2], add.outputs[0]
        except RuntimeError:
            # Blender 5 shares the shader Mix node with the compositor.
            try:
                add = tree.nodes.new("CompositorNodeMix")
            except RuntimeError:
                add = tree.nodes.new("ShaderNodeMix")
            add.data_type = "RGBA"
            add.blend_type = "ADD"
            for socket in add.inputs:
                if socket.identifier == "Factor_Float":
                    socket.default_value = 0.6
            add_a = next(s for s in add.inputs if s.identifier == "A_Color")
            add_b = next(s for s in add.inputs if s.identifier == "B_Color")
            add_out = next(s for s in add.outputs if s.identifier == "Result_Color")
        try:
            composite = tree.nodes.new("CompositorNodeComposite")
            composite_in = composite.inputs["Image"]
        except RuntimeError:
            # Blender 5: the compositing node group ends in a group output with an Image socket.
            tree.interface.new_socket("Image", in_out="OUTPUT", socket_type="NodeSocketColor")
            composite = tree.nodes.new("NodeGroupOutput")
            composite_in = composite.inputs["Image"]
        emit = next((o for o in layers.outputs if o.name in ("Emit", "Emission")), None)
        if emit is None:
            raise KeyError("render layers expose no emission pass")
        tree.links.new(emit, glare.inputs["Image"])
        glare_out = glare.outputs["Glare"] if "Glare" in glare.outputs else glare.outputs["Image"]
        tree.links.new(layers.outputs["Image"], add_a)
        tree.links.new(glare_out, add_b)
        tree.links.new(add_out, composite_in)
        return True
    except Exception as error:  # noqa: BLE001 - glow is cosmetic; the still must still render
        print(f"[cycles] glow disabled: {error}")
        if hasattr(scene, "compositing_node_group"):
            scene.compositing_node_group = None
        else:
            scene.use_nodes = False
        return False


def render_to(scene, path: str) -> float:
    scene.render.filepath = path
    started = time.monotonic()
    bpy.ops.render.render(write_still=True)
    return time.monotonic() - started


def mean_abs_diff(path_a: str, path_b: str) -> float:
    import numpy as np

    a = bpy.data.images.load(path_a)
    b = bpy.data.images.load(path_b)
    pa = np.array(a.pixels[:], dtype=np.float32).reshape(-1, 4)[:, :3]
    pb = np.array(b.pixels[:], dtype=np.float32).reshape(-1, 4)[:, :3]
    return float(np.abs(pa - pb).mean() * 255.0)


def sha256(path: str) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    args = parse_args(argv)
    with open(args["bundle"], "r", encoding="utf8") as handle:
        bundle = json.load(handle)
    if bundle["job"]["engine"]["id"] != ENGINE_ID:
        raise SystemExit(f"bundle engine {bundle['job']['engine']['id']} is not {ENGINE_ID}")
    root = os.path.abspath(args["root"])

    scene = cs.clear_scene()
    settings = configure_render(scene, bundle, args)
    materials = cs.build_materials(bundle, root)
    cs.build_nodes(bundle, materials, root)
    cs.build_fixtures(bundle)
    ambient = cs.build_recipe_lights(bundle)
    cs.build_camera(bundle)
    cs.build_world(bundle, root, ambient)
    glow = configure_glow(scene)

    out = os.path.abspath(args["out"])
    os.makedirs(os.path.dirname(out), exist_ok=True)
    elapsed = render_to(scene, out)
    rerun = None
    if args["rerun"]:
        rerun_path = out[:-4] + ".rerun.png"
        rerun_elapsed = render_to(scene, rerun_path)
        mad = mean_abs_diff(out, rerun_path)
        rerun = {"mad": mad, "limit": DETERMINISTIC_MAD_LIMIT, "pass": mad <= DETERMINISTIC_MAD_LIMIT, "seconds": rerun_elapsed}

    lights = sum(len(f["lights"]) for f in bundle["fixtures"]) + len(bundle["recipeLights"]) + len(bundle["windowKeys"])
    provenance = {
        "schemaVersion": bundle["job"]["schemaVersion"],
        "engine": {"id": ENGINE_ID, "version": ENGINE_VERSION},
        "lightUnitsVersion": m3.LIGHT_UNITS_VERSION,
        "jobId": bundle["job"]["jobId"],
        "projectId": bundle["job"]["projectId"],
        "projectContentHash": bundle["job"]["projectContentHash"],
        "snapshotId": bundle["job"]["snapshotId"],
        "cameraId": bundle["job"]["cameraId"],
        "seed": bundle["render"]["seed"],
        "materialIds": bundle["materialIds"],
        "lightCount": lights,
        "bundleSha256": sha256(args["bundle"]),
        "blender": bpy.app.version_string,
        "platform": f"{platform.system()} {platform.machine()}",
        "device": settings["device"],
        "samplesMax": settings["samples"],
        "timeCapSeconds": settings["timeLimit"],
        "elapsedSeconds": round(elapsed, 2),
        "resolution": [scene.render.resolution_x, scene.render.resolution_y],
        "denoise": "OpenImageDenoise (CPU)" if scene.cycles.use_denoising else "none",
        "viewTransform": scene.view_settings.view_transform,
        "emissionGlow": glow,
        "deterministicRerun": rerun,
        "warnings": bundle.get("warnings", []),
        "stillPath": os.path.basename(out),
    }
    with open(args["provenance"], "w", encoding="utf8") as handle:
        json.dump(provenance, handle, indent=2)
    print(f"[cycles] {out} in {elapsed:.1f}s on {settings['device']} ({settings['samples']} samples max, cap {settings['timeLimit']:.0f}s)")
    if rerun:
        print(f"[cycles] rerun MAD {rerun['mad']:.3f} / {DETERMINISTIC_MAD_LIMIT:.2f} → {'pass' if rerun['pass'] else 'FAIL'}")


if __name__ == "__main__":
    try:
        main()
    except Exception:  # noqa: BLE001 - background Blender would otherwise exit 0 after a traceback
        import traceback

        traceback.print_exc()
        sys.exit(1)
