"""Pure helpers for the Cycles still engine: three.js → Blender transforms and light units.

No `bpy` import, so `python3 render-sources/blender/still_bundle_math.py` self-checks
against the numbers three.js produces (see `scripts/cycles/check-bundle-math.mjs`).

Conventions
- Bundle positions are metres in three.js axes (Y up). Blender is Z up.
- A three.js object matrix is T · R · S with R from an Euler in the bundle's order.
- `C` maps three world coordinates to Blender world coordinates: (x, y, z) → (x, −z, y).
- Light units follow `CYCLES_LIGHT_UNITS_VERSION = 1` in `src/domain/livingRoom/cyclesBundle/types.ts`.
"""
from __future__ import annotations

import math
from typing import Sequence

Matrix = list  # 4×4 nested lists; kept dependency-free so the self-check runs without Blender

LIGHT_UNITS_VERSION = 1

# Photometric → radiometric. 683 lm/W at 555 nm is the standard conversion; the
# calibration factors are the only tunables and start at 1. Change them only
# from a measured 2 BHK render and bump CYCLES_LIGHT_UNITS_VERSION with them.
LUMENS_PER_WATT = 683.0
CALIBRATION = {
    "area": 1.0,
    "point": 1.0,
    "spot": 1.0,
    "sun": 1.0,
    "emission": 1.0,
}

# Blender area light: radiance L = P / (π · A). Three rect lights are nits (cd/m² = lm/sr/m²).
def area_light_watts(nits: float, width_m: float, height_m: float) -> float:
    area = max(1e-6, width_m * height_m)
    return nits * area * math.pi / LUMENS_PER_WATT * CALIBRATION["area"]


# Blender point light: intensity I = P / (4π) W/sr. Three point lights are candela (lm/sr).
def point_light_watts(candela: float) -> float:
    return candela * 4.0 * math.pi / LUMENS_PER_WATT * CALIBRATION["point"]


# Blender spot power is specified as if the light were omnidirectional, so the cone does not change it.
def spot_light_watts(candela: float) -> float:
    return candela * 4.0 * math.pi / LUMENS_PER_WATT * CALIBRATION["spot"]


# Blender sun strength is irradiance in W/m². Three directional intensity is lux (lm/m²).
def sun_strength(lux: float) -> float:
    return lux / LUMENS_PER_WATT * CALIBRATION["sun"]


# Viewport `emissiveIntensity` is unitless on a 0–4 scale; map it to an emission strength.
def emission_strength(emissive_intensity: float) -> float:
    return emissive_intensity * 4.0 * CALIBRATION["emission"]


def identity() -> Matrix:
    return [[1.0 if r == c else 0.0 for c in range(4)] for r in range(4)]


def multiply(a: Matrix, b: Matrix) -> Matrix:
    return [[sum(a[r][k] * b[k][c] for k in range(4)) for c in range(4)] for r in range(4)]


def translation(x: float, y: float, z: float) -> Matrix:
    m = identity()
    m[0][3], m[1][3], m[2][3] = x, y, z
    return m


def scaling(x: float, y: float, z: float) -> Matrix:
    m = identity()
    m[0][0], m[1][1], m[2][2] = x, y, z
    return m


def rotation_x(rad: float) -> Matrix:
    c, s = math.cos(rad), math.sin(rad)
    return [[1, 0, 0, 0], [0, c, -s, 0], [0, s, c, 0], [0, 0, 0, 1]]


def rotation_y(rad: float) -> Matrix:
    c, s = math.cos(rad), math.sin(rad)
    return [[c, 0, s, 0], [0, 1, 0, 0], [-s, 0, c, 0], [0, 0, 0, 1]]


def rotation_z(rad: float) -> Matrix:
    c, s = math.cos(rad), math.sin(rad)
    return [[c, -s, 0, 0], [s, c, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]


AXIS = {"X": rotation_x, "Y": rotation_y, "Z": rotation_z}


def euler_matrix(degrees: Sequence[float], order: str = "XYZ") -> Matrix:
    """three.js Euler semantics: the matrix is the product of the axis rotations in `order`."""
    rad = {"X": math.radians(degrees[0]), "Y": math.radians(degrees[1]), "Z": math.radians(degrees[2])}
    m = identity()
    for axis in order:
        m = multiply(m, AXIS[axis](rad[axis]))
    return m


def transform_matrix(transform: dict) -> Matrix:
    """T · R · S for a bundle `CyclesTransform` (degrees, metres)."""
    p = transform["position"]
    r = transform["rotation"]
    s = transform.get("scale") or {"x": 1.0, "y": 1.0, "z": 1.0}
    m = translation(p["x"], p["y"], p["z"])
    m = multiply(m, euler_matrix([r["x"], r["y"], r["z"]], r.get("order", "XYZ")))
    return multiply(m, scaling(s["x"], s["y"], s["z"]))


# three (x, y, z) → Blender (x, −z, y)
THREE_TO_BLENDER: Matrix = [[1, 0, 0, 0], [0, 0, -1, 0], [0, 1, 0, 0], [0, 0, 0, 1]]
BLENDER_TO_THREE: Matrix = [[1, 0, 0, 0], [0, 0, 1, 0], [0, -1, 0, 0], [0, 0, 0, 1]]


def to_blender_keeping_local(three_world: Matrix) -> Matrix:
    """Object matrix for a mesh or light whose vertices / local axes stay in three.js convention.

    v_blender = C · M · v_three_local, so Blender's local −Z is still the emitter axis.
    """
    return multiply(THREE_TO_BLENDER, three_world)


def to_blender_rebased(three_world: Matrix) -> Matrix:
    """Object matrix for content the glTF importer already converted to Z up: C · M · Cᵀ."""
    return multiply(multiply(THREE_TO_BLENDER, three_world), BLENDER_TO_THREE)


def look_at(eye: dict, target: dict, up=(0.0, 1.0, 0.0)) -> Matrix:
    """three.js camera / light frame: looks down local −Z at `target`. Returned in three space."""
    zx, zy, zz = eye["x"] - target["x"], eye["y"] - target["y"], eye["z"] - target["z"]
    zl = math.sqrt(zx * zx + zy * zy + zz * zz) or 1.0
    zx, zy, zz = zx / zl, zy / zl, zz / zl
    ux, uy, uz = up
    xx, xy, xz = uy * zz - uz * zy, uz * zx - ux * zz, ux * zy - uy * zx
    xl = math.sqrt(xx * xx + xy * xy + xz * xz)
    if xl < 1e-6:  # looking straight up or down: pick any perpendicular
        xx, xy, xz, xl = 1.0, 0.0, 0.0, 1.0
    xx, xy, xz = xx / xl, xy / xl, xz / xl
    yx, yy, yz = zy * xz - zz * xy, zz * xx - zx * xz, zx * xy - zy * xx
    return [
        [xx, yx, zx, eye["x"]],
        [xy, yy, zy, eye["y"]],
        [xz, yz, zz, eye["z"]],
        [0.0, 0.0, 0.0, 1.0],
    ]


def apply(m: Matrix, v: Sequence[float]) -> tuple:
    x, y, z = v
    return (
        m[0][0] * x + m[0][1] * y + m[0][2] * z + m[0][3],
        m[1][0] * x + m[1][1] * y + m[1][2] * z + m[1][3],
        m[2][0] * x + m[2][1] * y + m[2][2] * z + m[2][3],
    )


def exposure_stops(linear_exposure: float) -> float:
    """three `toneMappingExposure` is a linear multiplier; Blender film exposure is in stops."""
    return math.log2(max(1e-6, linear_exposure))


if __name__ == "__main__":
    import json
    import sys

    # Self-check driver: read {transform, point} pairs on stdin, print transformed points.
    payload = json.load(sys.stdin)
    out = []
    for case in payload:
        m = transform_matrix(case["transform"])
        out.append({
            "three": apply(m, case["point"]),
            "blender": apply(to_blender_keeping_local(m), case["point"]),
        })
    json.dump(out, sys.stdout)
