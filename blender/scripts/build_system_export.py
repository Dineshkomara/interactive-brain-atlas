"""
Generalized Tier A tagging + glTF export pipeline, extracted from
build_brain_export.py so every body system (docs/full-body-atlas-plan.md)
can reuse the same three steps:
  1. Tag each Tier A source object with region_id/region_name/system/category/
     side custom properties (glTF extras) and rename it to region_<id>[_<side>].
  2. Convert the FONT-type hierarchy/group nodes under the export root to
     plain Empty objects (glTF cannot carry Blender text objects), preserving
     parenting — including re-deriving every tagged region's parent from a
     pre-conversion snapshot, since the two-pass FONT->Empty rewrite does not
     reliably preserve parent links for renamed (tagged) nodes.
  3. Assembles an export collection from the full subtree under the root
     region and exports it to glTF, filtering out both empty-geometry meshes
     and Z-Anatomy's non-region marker meshes: muscle attachment markers
     (names ending .o/.o.NNN "origin", .e/.e.NNN "extremity"/insertion) and
     merged group-overview proxy meshes (names ending .j), none of which are
     real region geometry — they're editor-only annotation objects that ride
     along in the same collections as actual bones/organs.

Run inside Blender after opening the Z-Anatomy application template. See
docs/full-body-atlas-plan.md Section 3.3 for the per-system NAME_MAPs.
"""

import bpy
import os
import re

MARKER_SUFFIX_RE = re.compile(r"\.(o|e)\d*(\.\d+)?$")
MERGED_PROXY_RE = re.compile(r"\.j\d*(\.\d+)?$")


def tag_regions(name_map):
    """Renames + tags every NAME_MAP source object, and returns a snapshot of
    each tagged object's pre-rename parent name (or None), used later to
    reconnect the hierarchy after FONT->Empty conversion."""
    tagged = []
    original_parent_of = {}
    for src_name, (rid, rname, system, category, side) in name_map.items():
        obj = bpy.data.objects.get(src_name)
        if obj is None:
            raise RuntimeError(f"Expected source object not found: {src_name!r}")
        full_rid = rid + (f"_{side}" if side else "")
        new_name = f"region_{full_rid}"
        original_parent_of[new_name] = obj.parent.name if obj.parent else None
        obj.name = new_name
        obj["region_id"] = full_rid
        obj["region_name"] = rname
        obj["system"] = system
        obj["category"] = category
        obj["side"] = side or ""
        obj["version"] = "1.0"
        tagged.append(obj.name)
    return tagged, original_parent_of


def convert_font_node_to_empty(old):
    empty = bpy.data.objects.new(old.name + "__new", None)
    empty.empty_display_type = "PLAIN_AXES"
    empty.empty_display_size = 0.03
    for coll in old.users_collection:
        coll.objects.link(empty)
    empty.matrix_world = old.matrix_world.copy()
    for k in old.keys():
        empty[k] = old[k]
    return empty


def convert_all_font_nodes_in_subtree(root_name):
    def collect(name, acc, children_map):
        for c in children_map.get(name, []):
            acc.append(c)
            collect(c.name, acc, children_map)

    children_map = {}
    for o in bpy.data.objects:
        if o.parent is not None:
            children_map.setdefault(o.parent.name, []).append(o)

    subtree = [bpy.data.objects[root_name]]
    collect(root_name, subtree, children_map)
    font_objs = [o for o in subtree if o.type == "FONT"]

    old_to_new = {old.name: convert_font_node_to_empty(old) for old in font_objs}

    for o in list(bpy.data.objects):
        if o.parent is not None and o.parent.name in old_to_new and o not in font_objs:
            world = o.matrix_world.copy()
            o.parent = old_to_new[o.parent.name]
            o.matrix_world = world

    for old_name, new_obj in old_to_new.items():
        old_obj = bpy.data.objects.get(old_name)
        old_parent = old_obj.parent if old_obj else None
        if old_parent is None:
            continue
        target_parent = old_to_new.get(old_parent.name, old_parent)
        world = new_obj.matrix_world.copy()
        new_obj.parent = target_parent
        new_obj.matrix_world = world

    for old_name in list(old_to_new.keys()):
        old_obj = bpy.data.objects.get(old_name)
        if old_obj is None:
            continue
        data = old_obj.data
        for coll in list(old_obj.users_collection):
            coll.objects.unlink(old_obj)
        bpy.data.objects.remove(old_obj, do_unlink=True)
        if data is not None and data.users == 0:
            bpy.data.curves.remove(data)

    for old_name, new_obj in old_to_new.items():
        new_obj.name = old_name

    return len(font_objs)


def reconnect_tagged_parents(root_name, name_map, original_parent_of):
    """Explicitly re-derives every tagged region's parent from the
    pre-conversion snapshot, translating any parent that was itself a
    NAME_MAP source through to its new region_<id> name. Runs regardless of
    whether the generic conversion pass already got it right — cheap and
    removes any dependency on that pass's incidental correctness."""
    renamed_from = {src: f"region_{rid}{('_' + side) if side else ''}" for src, (rid, _n, _s, _c, side) in name_map.items()}

    for full_name, original_parent in original_parent_of.items():
        if full_name == root_name or original_parent is None:
            continue
        parent_name = renamed_from.get(original_parent, original_parent)
        child = bpy.data.objects.get(full_name)
        parent = bpy.data.objects.get(parent_name)
        if child is None or parent is None or child.parent is parent:
            continue
        world = child.matrix_world.copy()
        child.parent = parent
        child.matrix_world = world


def is_export_excluded(obj):
    if obj.type == "MESH":
        if obj.data is None or len(obj.data.polygons) == 0:
            return True
        if MARKER_SUFFIX_RE.search(obj.name):
            return True
        if MERGED_PROXY_RE.search(obj.name):
            return True
    return False


def build_export_collection(root_name, collection_name):
    root = bpy.data.objects[root_name]
    children_map = {}
    for o in bpy.data.objects:
        if o.parent is not None:
            children_map.setdefault(o.parent.name, []).append(o)

    def collect(name, acc):
        for c in children_map.get(name, []):
            acc.append(c)
            collect(c.name, acc)

    subtree = [root]
    collect(root.name, subtree)

    export_objs = [o for o in subtree if not is_export_excluded(o)]

    coll = bpy.data.collections.get(collection_name)
    if coll is None:
        coll = bpy.data.collections.new(collection_name)
        bpy.context.scene.collection.children.link(coll)
    else:
        for o in list(coll.objects):
            coll.objects.unlink(o)
    for o in export_objs:
        coll.objects.link(o)

    return coll


def export_glb(collection, root_name, out_path):
    bpy.ops.object.select_all(action="DESELECT")
    for o in collection.objects:
        o.select_set(True)
    bpy.context.view_layer.objects.active = bpy.data.objects[root_name]
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format="GLB",
        use_selection=True,
        export_extras=True,
        export_apply=True,
        export_yup=True,
    )


def build_export(root_object_name, name_map, output_path, collection_name):
    root_src = bpy.data.objects.get(root_object_name)
    if root_src is None:
        raise RuntimeError(f"Root object not found: {root_object_name!r}")
    if root_object_name not in name_map:
        raise RuntimeError("root_object_name must have its own NAME_MAP entry (the whole-system region)")

    tagged, original_parent_of = tag_regions(name_map)
    print(f"Tagged {len(tagged)} Tier A regions")

    rid, _n, _s, _c, side = name_map[root_object_name]
    root_tagged_name = f"region_{rid}{('_' + side) if side else ''}"

    converted = convert_all_font_nodes_in_subtree(root_tagged_name)
    print(f"Converted {converted} FONT group nodes to Empty objects")

    reconnect_tagged_parents(root_tagged_name, name_map, original_parent_of)

    coll = build_export_collection(root_tagged_name, collection_name)
    print(f"Export collection assembled: {len(coll.objects)} objects")

    export_glb(coll, root_tagged_name, output_path)
    print(f"Exported: {output_path}")
