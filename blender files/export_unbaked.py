"""Export Baking.blend as a web-ready, unbaked GLB with baked base colors.

Run with:
  blender -b "blender files/Baking.blend" --python "blender files/export_unbaked.py"

The script does not save the .blend. It works on an in-memory copy and writes
public/models/room_unbaked.glb.

What it does:
- Fixes the duplicated far wall (pared1_third + Cube.031) and removes the
  empty poster frame.
- Assigns the materials that were missing.
- Bakes the Base Color of procedural materials to per-object textures, so the
  wood/stone/fabric patterns survive the glTF export.
- Keeps image-based materials (posters, screen, PBR photos) untouched.
- Downscales the remaining large textures and exports WebP + Draco.
"""

import bpy
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
TARGET = os.path.join(REPO_ROOT, "public", "models", "room_unbaked.glb")
MAX_TEX = 2048
SKIP_BAKE = os.environ.get("SKIP_BAKE", "0") == "1"


def set_single_material(obj_name, mat_name):
    obj = bpy.data.objects.get(obj_name)
    mat = bpy.data.materials.get(mat_name)
    if not obj or obj.type != 'MESH':
        print("SKIP_MATERIAL", obj_name, "(mesh not found)")
        return
    if not mat:
        print("SKIP_MATERIAL", obj_name, "(material not found:", mat_name, ")")
        return
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    print("MATERIAL", obj_name, "->", mat_name)


# ---------------------------------------------------------------------------
# 1. Fix the duplicated far wall and the empty poster frame.
# ---------------------------------------------------------------------------
cube_shell = bpy.data.objects.get("Cube.031")
room_material = bpy.data.materials.get("Room")
if cube_shell and room_material:
    # Cube.031 already contains the same 6 faces as pared1_third. Give those
    # faces the pink Room material and delete the duplicate wall.
    existing = [m for m in cube_shell.data.materials]
    if room_material not in existing:
        cube_shell.data.materials.append(room_material)
    room_index = list(cube_shell.data.materials).index(room_material)

    far_faces = 0
    for poly in cube_shell.data.polygons:
        center = cube_shell.matrix_world @ poly.center
        if poly.area >= 4.0 and center.y > 4.3:
            poly.material_index = room_index
            far_faces += 1
    print("CUBE031_FAR_FACES", far_faces)

duplicate_wall = bpy.data.objects.get("pared1_third")
if duplicate_wall:
    bpy.data.objects.remove(duplicate_wall, do_unlink=True)
    print("REMOVED pared1_third")

# Keep the blank white poster that sits between the computer furniture and
# the smaller posters on the right wall.
blank_poster = bpy.data.objects.get("poster8_third.001")
if blank_poster:
    blank_material = bpy.data.materials.get("BlankPoster")
    if not blank_material:
        blank_material = bpy.data.materials.new("BlankPoster")
        blank_material.use_nodes = True
        blank_bsdf = next(
            (node for node in blank_material.node_tree.nodes if node.type == 'BSDF_PRINCIPLED'),
            None,
        )
        if blank_bsdf:
            blank_bsdf.inputs['Base Color'].default_value = (0.95, 0.95, 0.95, 1.0)
            blank_bsdf.inputs['Roughness'].default_value = 0.9
    if blank_poster.data.materials:
        blank_poster.data.materials[0] = blank_material
    else:
        blank_poster.data.materials.append(blank_material)
    print("BLANK_POSTER", blank_poster.name, "->", blank_material.name)

# Missing materials detected in the first export.
# The slab under the wood floor is a smooth base, not a rock surface.
slab_material = bpy.data.materials.get("Slab_Flat")
if not slab_material:
    slab_material = bpy.data.materials.new("Slab_Flat")
    slab_material.use_nodes = True
    slab_bsdf = next(
        (node for node in slab_material.node_tree.nodes if node.type == 'BSDF_PRINCIPLED'),
        None,
    )
    if slab_bsdf:
        slab_bsdf.inputs['Base Color'].default_value = (0.71, 0.65, 0.56, 1.0)
        slab_bsdf.inputs['Roughness'].default_value = 0.9
set_single_material("losa_third", "Slab_Flat")
set_single_material("cama2_second", "Material.015")


# ---------------------------------------------------------------------------
# 1b. Depink the Room (walls) material: shift pinkish color-ramp elements
# toward cool lavender grays, keeping luminance. Masks and already-cool
# colors are left untouched.
# ---------------------------------------------------------------------------
room_mat = bpy.data.materials.get("Room")
if room_mat and room_mat.use_nodes:
    def depink(color):
        r, g, b = color[0], color[1], color[2]
        if r > g + 0.03 and r >= b - 0.02 and b > g:
            new_r = min(1.0, (g + b) / 2.0 * 0.95)
            new_b = min(1.0, b * 1.05)
            return (new_r, g, new_b, 1.0)
        return None

    for node in room_mat.node_tree.nodes:
        if node.type == 'VALTORGB':
            for element in node.color_ramp.elements:
                fixed = depink(element.color)
                if fixed:
                    print(
                        "DEPINK", node.name, round(element.position, 3),
                        tuple(round(v, 3) for v in element.color),
                        "->", tuple(round(v, 3) for v in fixed),
                    )
                    element.color = fixed


# ---------------------------------------------------------------------------
# 2. Decide which objects need a base-color bake.
# ---------------------------------------------------------------------------
def chain_has_image(node, seen):
    if node.name in seen:
        return False
    seen.add(node.name)
    if node.type == 'TEX_IMAGE':
        return node.image is not None
    for socket in node.inputs:
        for link in socket.links:
            if chain_has_image(link.from_node, seen):
                return True
    return False


def material_uses_image(material):
    if not material or not material.use_nodes:
        return False
    bsdf = next(
        (node for node in material.node_tree.nodes if node.type == 'BSDF_PRINCIPLED'),
        None,
    )
    if not bsdf:
        return False
    for socket in bsdf.inputs:
        for link in socket.links:
            if chain_has_image(link.from_node, set()):
                return True
    return False


def material_has_procedural_base(material):
    if not material or not material.use_nodes:
        return False
    bsdf = next(
        (node for node in material.node_tree.nodes if node.type == 'BSDF_PRINCIPLED'),
        None,
    )
    if not bsdf:
        return False
    base = bsdf.inputs.get('Base Color')
    if not base or not base.links:
        return False
    return not any(chain_has_image(link.from_node, set()) for link in base.links)


def material_is_transparent(material):
    if not material:
        return False
    if 'Glass' in material.name or 'Water' in material.name:
        return True
    if material.use_nodes:
        bsdf = next(
            (node for node in material.node_tree.nodes if node.type == 'BSDF_PRINCIPLED'),
            None,
        )
        if bsdf:
            transmission = bsdf.inputs.get('Transmission Weight')
            if transmission and transmission.default_value > 0:
                return True
            alpha = bsdf.inputs.get('Alpha')
            if alpha and alpha.default_value < 0.999:
                return True
    return False


bakeable = []
skipped = []
for obj in bpy.data.objects:
    if obj.type != 'MESH' or not obj.data.polygons or obj.hide_render:
        continue
    slots = [ms.material for ms in obj.material_slots]
    if not slots or any(mat is None for mat in slots):
        skipped.append((obj.name, 'no material'))
        continue
    if any(not mat.use_nodes for mat in slots):
        skipped.append((obj.name, 'non-node material'))
        continue
    if any(material_is_transparent(mat) for mat in slots):
        skipped.append((obj.name, 'transparent/glass/water'))
        continue
    if any(material_uses_image(mat) for mat in slots):
        skipped.append((obj.name, 'image texture'))
        continue
    if not any(material_has_procedural_base(mat) for mat in slots):
        skipped.append((obj.name, 'flat color'))
        continue
    bakeable.append(obj)

print("BAKEABLE", len(bakeable))
print("SKIPPED", len(skipped))
for name, reason in skipped:
    print("SKIP_BAKE", name, "|", reason)


# ---------------------------------------------------------------------------
# 3. Bake Base Color per object.
# ---------------------------------------------------------------------------
def bake_resolution(obj):
    largest = max(obj.dimensions)
    if largest > 8.0:
        return 1024
    if largest > 2.0:
        return 512
    return 256


def select_only(obj):
    for other in bpy.context.view_layer.objects:
        try:
            other.select_set(False)
        except Exception:
            pass
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def _build_lc_map():
    # name -> (layer_collection, parent_layer_collection or None)
    mapping = {}

    def walk(lc, parent):
        mapping[lc.collection.name] = (lc, parent)
        for child in lc.children:
            walk(child, lc)

    root = bpy.context.view_layer.layer_collection
    for child in root.children:
        walk(child, None)
    return mapping


LC_MAP = _build_lc_map()


def ensure_in_view_layer(obj):
    # Objects in excluded/disabled collections cannot be selected for baking
    # (the room shell 'Cube' was here), which left their procedural materials
    # unbaked and exported as a flat fallback color. Re-enable the chain of
    # collections the object lives in before touching it.
    coll = obj.users_collection[0] if obj.users_collection else None
    if coll is None:
        # Orphan object with no collection at all: link it to the active
        # collection so it enters the view layer and can be baked.
        try:
            target = bpy.context.view_layer.active_layer_collection.collection
        except Exception:
            target = bpy.context.scene.collection
        target.objects.link(obj)
        print("RELINKED", obj.name, "->", target.name)
        coll = obj.users_collection[0] if obj.users_collection else None
    entry = LC_MAP.get(coll.name) if coll else None
    lc = entry[0] if entry else None
    while lc is not None:
        lc.hide_viewport = False
        try:
            lc.exclude = False
        except Exception:
            pass
        lc = LC_MAP[lc.collection.name][1]
    try:
        obj.hide_set(False)
    except Exception:
        pass


def bake_object(obj):
    ensure_in_view_layer(obj)

    # Linked duplicates must be made single-user before touching their data.
    if obj.data.users > 1:
        obj.data = obj.data.copy()

    select_only(obj)

    old_uv = obj.data.uv_layers.get("BakeUV")
    if old_uv:
        obj.data.uv_layers.remove(old_uv)
    uv = obj.data.uv_layers.new(name="BakeUV")
    obj.data.uv_layers.active = uv
    try:
        uv.active_render = True
    except Exception:
        pass

    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    try:
        bpy.ops.uv.smart_project(
            angle_limit=1.15192,
            island_margin=0.02,
            area_weight=0.0,
            correct_aspect=True,
            scale_to_bounds=False,
        )
    finally:
        bpy.ops.object.mode_set(mode='OBJECT')

    resolution = bake_resolution(obj)
    safe_name = obj.name.replace('.', '_').replace('#', 's')
    image = bpy.data.images.new(
        f"Bake_{safe_name}", resolution, resolution, alpha=False
    )
    image.colorspace_settings.name = 'sRGB'

    temp_nodes = []
    for slot in obj.material_slots:
        material = slot.material
        if not material or not material.use_nodes:
            continue
        node = material.node_tree.nodes.new('ShaderNodeTexImage')
        node.name = "BAKE_TARGET_TMP"
        node.image = image
        material.node_tree.nodes.active = node
        for other in material.node_tree.nodes:
            try:
                other.select = (other == node)
            except Exception:
                pass
        temp_nodes.append((material, node))

    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 1
    scene.cycles.use_denoising = False
    scene.render.bake.use_clear = True
    scene.render.bake.margin = 4
    scene.render.bake.use_selected_to_active = False

    try:
        bpy.ops.object.bake(
            type='DIFFUSE',
            pass_filter={'COLOR'},
            use_clear=True,
            margin=4,
        )
    finally:
        for material, node in temp_nodes:
            try:
                material.node_tree.nodes.remove(node)
            except Exception:
                pass

    baked_material = bpy.data.materials.new(f"Baked_{safe_name}")
    baked_material.use_nodes = True
    baked_material.use_backface_culling = False
    nodes = baked_material.node_tree.nodes
    links = baked_material.node_tree.links
    nodes.clear()

    output = nodes.new('ShaderNodeOutputMaterial')
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    texture = nodes.new('ShaderNodeTexImage')
    uv_node = nodes.new('ShaderNodeUVMap')
    uv_node.uv_map = 'BakeUV'
    texture.image = image
    texture.interpolation = 'Linear'

    links.new(uv_node.outputs['UV'], texture.inputs['Vector'])
    links.new(texture.outputs['Color'], bsdf.inputs['Base Color'])
    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    bsdf.inputs['Roughness'].default_value = 0.8
    bsdf.inputs['Metallic'].default_value = 0.0

    obj.data.materials.clear()
    obj.data.materials.append(baked_material)
    return resolution


baked_count = 0
bake_failures = []
if SKIP_BAKE:
    print("BAKE_SKIPPED (SKIP_BAKE=1)")
else:
    for index, obj in enumerate(bakeable, start=1):
        try:
            resolution = bake_object(obj)
            baked_count += 1
            print(f"BAKED {index}/{len(bakeable)} {obj.name} @ {resolution}")
        except Exception as exc:
            bake_failures.append((obj.name, repr(exc)))
            print(f"BAKE_FAIL {index}/{len(bakeable)} {obj.name} | {exc!r}")
            try:
                bpy.ops.object.mode_set(mode='OBJECT')
            except Exception:
                pass

    print("BAKED_COUNT", baked_count)
    for name, error in bake_failures:
        print("BAKE_FAILURE", name, "|", error)


# ---------------------------------------------------------------------------
# 4. Flatten any procedural materials left on skipped/mixed objects.
# ---------------------------------------------------------------------------
def collect_ramp_colors(node, seen, has_image):
    if node.name in seen:
        return []
    seen.add(node.name)
    if node.type == 'TEX_IMAGE':
        has_image[0] = True
        return []
    colors = []
    if node.type == 'VALTORGB':
        for element in node.color_ramp.elements:
            colors.append(tuple(element.color[:3]))
    for socket in node.inputs:
        for link in socket.links:
            colors += collect_ramp_colors(link.from_node, seen, has_image)
    return colors


report = []
for material in bpy.data.materials:
    if not material.use_nodes:
        continue
    bsdf = next(
        (node for node in material.node_tree.nodes if node.type == 'BSDF_PRINCIPLED'),
        None,
    )
    if not bsdf:
        continue
    base = bsdf.inputs.get('Base Color')
    if not base or not base.links:
        continue

    has_image = [False]
    colors = []
    seen = set()
    for link in base.links:
        colors += collect_ramp_colors(link.from_node, seen, has_image)

    if has_image[0]:
        report.append((material.name, 'kept-image', None))
        continue

    colored = [c for c in colors if (max(c) - min(c)) > 0.06 and max(c) > 0.03]
    pool = colored if colored else colors
    if not pool:
        report.append((material.name, 'no-color', None))
        continue

    r = sum(c[0] for c in pool) / len(pool)
    g = sum(c[1] for c in pool) / len(pool)
    b = sum(c[2] for c in pool) / len(pool)

    for link in list(base.links):
        material.node_tree.links.remove(link)
    base.default_value = (r, g, b, 1.0)
    material.diffuse_color = (r, g, b, 1.0)
    report.append((material.name, 'flattened', (round(r, 3), round(g, 3), round(b, 3))))

print("=== FLATTEN REPORT ===")
for name, kind, color in report:
    print("FLAT", name, "|", kind, "|", color)


# ---------------------------------------------------------------------------
# 5. Downscale remaining large textures (in memory only).
# ---------------------------------------------------------------------------
print("=== TEXTURE RESIZE ===")
for image in bpy.data.images:
    if image.name in ('Render Result',) or image.name.startswith('uv grid'):
        continue
    try:
        width, height = image.size
    except Exception:
        continue
    if not width or not height or max(width, height) <= MAX_TEX:
        continue

    scale = MAX_TEX / float(max(width, height))
    new_width = max(1, int(round(width * scale)))
    new_height = max(1, int(round(height * scale)))
    try:
        image.scale(new_width, new_height)
        print("TEX", image.name, f"{width}x{height}", "->", f"{new_width}x{new_height}")
    except Exception as exc:
        print("TEX", image.name, "resize failed:", exc)


# ---------------------------------------------------------------------------
# 6. Export.
# ---------------------------------------------------------------------------
bpy.ops.export_scene.gltf(
    filepath=TARGET,
    export_format='GLB',
    use_selection=False,
    use_visible=False,
    export_apply=True,
    export_yup=True,
    export_texcoords=True,
    export_normals=True,
    export_tangents=False,
    export_materials='EXPORT',
    export_image_format='WEBP',
    export_image_quality=80,
    export_image_add_webp=True,
    export_image_webp_fallback=False,
    export_unused_images=False,
    export_unused_textures=False,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_draco_position_quantization=14,
    export_draco_normal_quantization=10,
    export_draco_texcoord_quantization=12,
    export_cameras=False,
    export_lights=False,
    export_animations=False,
    export_skins=False,
    export_morph=False,
    export_extras=False,
)

print("EXPORTED:", TARGET)
print("SIZE_MB:", round(os.path.getsize(TARGET) / 1048576.0, 2))
