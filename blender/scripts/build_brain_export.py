"""
Builds the Tier A brain export from the Z-Anatomy application template.

Run inside Blender after: Blender icon menu > Install Application Template >
Z-Anatomy.zip, then File > New > Z-Anatomy.

Does three things:
  1. Tags 26 Tier A structures with region_id/region_name/system/category/side
     custom properties (glTF extras) and renames them to region_<id>[_<side>].
  2. Converts the FONT-type hierarchy/group nodes under Brain.g to plain Empty
     objects (glTF cannot carry Blender text objects), preserving parenting.
  3. Assembles COLLECTION_BRAIN_EXPORT from the full region_brain subtree and
     exports it to blender/exports/brain.glb.

See docs/detailed-plan.md Section 47 for the Tier A region rationale, and
blender/notes/model-sourcing.md for licensing.
"""

import bpy
import os

NAME_MAP = {
    "Brain.g":             ("brain", "Brain", "whole_brain", "root", None),
    "Cerebrum.g":          ("cerebrum", "Cerebrum", "cerebrum", "surface", None),
    "Frontal lobe.g":      ("frontal_lobe", "Frontal Lobe", "cerebrum", "lobe", None),
    "Parietal lobe.g":     ("parietal_lobe", "Parietal Lobe", "cerebrum", "lobe", None),
    "Temporal lobe.g":     ("temporal_lobe", "Temporal Lobe", "cerebrum", "lobe", None),
    "Occipital lobe.g":    ("occipital_lobe", "Occipital Lobe", "cerebrum", "lobe", None),
    "Cerebellum.g":        ("cerebellum", "Cerebellum", "cerebellum", "surface", None),
    "Brainstem.g":         ("brainstem", "Brainstem", "brainstem", "surface", None),
    "Corpus callosum":     ("corpus_callosum", "Corpus Callosum", "limbic_system", "white_matter", None),
    "Hypothalamus":        ("hypothalamus", "Hypothalamus", "limbic_system", "subcortical", None),
    "Third ventricle":     ("third_ventricle", "Third Ventricle", "ventricular_system", "ventricle", None),
    "Fourth ventricle":    ("fourth_ventricle", "Fourth Ventricle", "ventricular_system", "ventricle", None),
    "Thalamus.l":          ("thalamus", "Left Thalamus", "diencephalon", "subcortical", "left"),
    "Thalamus.r":          ("thalamus", "Right Thalamus", "diencephalon", "subcortical", "right"),
    "Hippocampus.l":       ("hippocampus", "Left Hippocampus", "limbic_system", "subcortical", "left"),
    "Hippocampus.r":       ("hippocampus", "Right Hippocampus", "limbic_system", "subcortical", "right"),
    "Amygdaloid body.l":   ("amygdala", "Left Amygdala", "limbic_system", "subcortical", "left"),
    "Amygdaloid body.r":   ("amygdala", "Right Amygdala", "limbic_system", "subcortical", "right"),
    "Caudate nucleus.l":   ("caudate_nucleus", "Left Caudate Nucleus", "basal_ganglia", "subcortical", "left"),
    "Caudate nucleus.r":   ("caudate_nucleus", "Right Caudate Nucleus", "basal_ganglia", "subcortical", "right"),
    "Putamen.l":           ("putamen", "Left Putamen", "basal_ganglia", "subcortical", "left"),
    "Putamen.r":           ("putamen", "Right Putamen", "basal_ganglia", "subcortical", "right"),
    "Globus pallidus.l":   ("globus_pallidus", "Left Globus Pallidus", "basal_ganglia", "subcortical", "left"),
    "Globus pallidus.r":   ("globus_pallidus", "Right Globus Pallidus", "basal_ganglia", "subcortical", "right"),
    "Lateral ventricle.l": ("lateral_ventricle", "Left Lateral Ventricle", "ventricular_system", "ventricle", "left"),
    "Lateral ventricle.r": ("lateral_ventricle", "Right Lateral Ventricle", "ventricular_system", "ventricle", "right"),
}

FONT_GROUP_SEED_NAMES = [
    "region_brain", "region_cerebrum", "region_frontal_lobe", "region_parietal_lobe",
    "region_temporal_lobe", "region_occipital_lobe", "region_cerebellum", "region_brainstem",
]


def find_nervous_system_collection():
    for c in bpy.data.collections:
        if "nervous system" in c.name.lower():
            return c
    raise RuntimeError("Could not find the 'Nervous system & Sense organs' collection")


def tag_regions(nervous):
    by_name = {o.name: o for o in nervous.objects}
    tagged = []
    for src_name, (rid, rname, system, category, side) in NAME_MAP.items():
        obj = by_name.get(src_name)
        if obj is None:
            raise RuntimeError(f"Expected source object not found: {src_name!r}")
        full_rid = rid + (f"_{side}" if side else "")
        obj.name = f"region_{full_rid}"
        obj["region_id"] = full_rid
        obj["region_name"] = rname
        obj["system"] = system
        obj["category"] = category
        obj["side"] = side or ""
        obj["version"] = "1.0"
        tagged.append(obj.name)
    return tagged


def convert_font_node_to_empty(old):
    """Replaces a FONT object with a plain Empty, preserving world transform,
    custom properties, and children. Caller is responsible for fixing the new
    empty's own parent afterwards (this only rewires children -> new empty)."""
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
    """Two-pass conversion: build replacements for every FONT descendant,
    reparent all real children onto the replacements, fix each replacement's
    own parent (translating through the old->new map), then delete originals."""
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


def fix_top_level_group_parents():
    """After the first-pass FONT->Empty conversion, the 8 top-level group
    nodes lose their parent link (Blender clears .parent when the object it
    pointed at is deleted). Reconnect them to their known correct parents."""
    fixes = {
        "region_cerebrum": "region_brain",
        "region_cerebellum": "region_brain",
        "region_brainstem": "region_brain",
        "region_frontal_lobe": "Telencephalon.g",
        "region_parietal_lobe": "Telencephalon.g",
        "region_temporal_lobe": "Telencephalon.g",
        "region_occipital_lobe": "Telencephalon.g",
    }
    for child_name, parent_name in fixes.items():
        child = bpy.data.objects.get(child_name)
        parent = bpy.data.objects.get(parent_name)
        if child is None or parent is None:
            continue
        world = child.matrix_world.copy()
        child.parent = parent
        child.matrix_world = world


def build_export_collection():
    root = bpy.data.objects["region_brain"]
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

    export_objs = [o for o in subtree if not (o.type == "MESH" and len(o.data.polygons) == 0)]

    coll = bpy.data.collections.get("COLLECTION_BRAIN_EXPORT")
    if coll is None:
        coll = bpy.data.collections.new("COLLECTION_BRAIN_EXPORT")
        bpy.context.scene.collection.children.link(coll)
    else:
        for o in list(coll.objects):
            coll.objects.unlink(o)
    for o in export_objs:
        coll.objects.link(o)

    return coll


def export_glb(collection, out_path):
    bpy.ops.object.select_all(action="DESELECT")
    for o in collection.objects:
        o.select_set(True)
    bpy.context.view_layer.objects.active = bpy.data.objects["region_brain"]
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format="GLB",
        use_selection=True,
        export_extras=True,
        export_apply=True,
        export_yup=True,
    )


def main():
    nervous = find_nervous_system_collection()
    tagged = tag_regions(nervous)
    print(f"Tagged {len(tagged)} Tier A regions")

    converted = convert_all_font_nodes_in_subtree("region_brain")
    print(f"Converted {converted} FONT group nodes to Empty objects")

    fix_top_level_group_parents()

    coll = build_export_collection()
    print(f"Export collection assembled: {len(coll.objects)} objects")

    out_path = bpy.path.abspath("//../exports/brain.glb")
    export_glb(coll, out_path)
    print(f"Exported: {out_path}")


if __name__ == "__main__":
    main()
