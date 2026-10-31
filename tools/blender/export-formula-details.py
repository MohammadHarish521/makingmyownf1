"""Procedural F1 helmet + steering wheel for Throttle Formula.

Run when Blender is available:
  blender --background --python tools/blender/export-formula-details.py

Exports GLB files next to the imported Qvist car. The game already ships a
procedural Three.js cockpit; these assets are an optional higher-detail swap.
"""
from pathlib import Path
import bpy
import math

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "models" / "qvist"
OUT.mkdir(parents=True, exist_ok=True)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def mesh(name, verts, faces):
    data = bpy.data.meshes.new(name)
    data.from_pydata(verts, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    return obj


def material(name, color, metallic=0.0, roughness=0.4):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    principled = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    principled.inputs["Base Color"].default_value = (*color, 1)
    principled.inputs["Metallic"].default_value = metallic
    principled.inputs["Roughness"].default_value = roughness
    return mat


def build_helmet():
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.125, segments=32, ring_count=16, location=(0, 0, 0.84))
    helmet = bpy.context.active_object
    helmet.name = "Helmet"
    helmet.data.materials.append(material("HelmetPaint", (0.88, 0.04, 0.05), 0.12, 0.16))
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.11, segments=24, ring_count=12, location=(0, 0.03, 0.83))
    visor = bpy.context.active_object
    visor.name = "Visor"
    visor.scale.y = 0.55
    visor.data.materials.append(material("Visor", (0.04, 0.06, 0.08), 0.85, 0.05))
    return helmet, visor


def build_wheel():
    bpy.ops.mesh.primitive_torus_add(major_radius=0.13, minor_radius=0.018, major_segments=36, location=(0, 0.38, 0.56))
    rim = bpy.context.active_object
    rim.name = "WheelGrip"
    rim.rotation_euler[0] = math.radians(-18)
    rim.data.materials.append(material("Grip", (0.06, 0.06, 0.07), 0.05, 0.86))
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0.38, 0.56))
    plate = bpy.context.active_object
    plate.name = "WheelPlate"
    plate.scale = (0.13, 0.015, 0.035)
    plate.data.materials.append(material("Carbon", (0.08, 0.09, 0.11), 0.7, 0.32))
    return rim, plate


def export(path):
    bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB", export_yup=True)


def main():
    reset()
    build_helmet()
    build_wheel()
    export(OUT / "cockpit-details.glb")
    print(f"Wrote {OUT / 'cockpit-details.glb'}")


if __name__ == "__main__":
    main()
