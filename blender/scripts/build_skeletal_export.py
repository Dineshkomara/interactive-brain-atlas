"""
Skeletal system Tier A tagging + export. Run inside Blender (Z-Anatomy
template loaded) after build_system_export.py's functions are available.

Real Blender group/object names below were confirmed by live inspection of
the Z-Anatomy scene (not assumed from the plan doc) — see
docs/full-body-atlas-plan.md Section 4.1 for the Tier A rationale.

Two source branches exist for limb bones: `Appendicular skeleton.g` (a
sparse, unused duplicate hierarchy — every node under it resolves to a
zero-polygon `.j` proxy mesh and nothing else) and `Bones of upper/lower
limb.g` (the real, detailed hierarchy actually containing bone geometry).
This map tags only the latter; the former gets pulled into the export
harmlessly since the shared zero-polygon/`.j` filters drop it entirely.
"""

from build_system_export import build_export

NAME_MAP = {
    "Skeletal system.g": ("skeleton", "Skeleton (Whole)", "skeleton", "bone", None),
    "Bones of cranium.g": ("skull", "Skull", "axial_skull", "bone", None),
    "Mandible": ("mandible", "Mandible", "axial_skull", "bone", None),
    "Vertebral column.g": ("vertebral_column", "Vertebral Column", "spine", "bone", None),
    "Cervical vertebrae.g": ("cervical_vertebrae", "Cervical Vertebrae", "spine", "bone", None),
    "Thoracic vertebrae.g": ("thoracic_vertebrae", "Thoracic Vertebrae", "spine", "bone", None),
    "Lumbar vertebrae.g": ("lumbar_vertebrae", "Lumbar Vertebrae", "spine", "bone", None),
    "Sacrum": ("sacrum", "Sacrum", "spine", "bone", None),
    "Sternum.g": ("sternum", "Sternum", "thorax", "bone", None),
    "Ribs.g": ("ribs", "Ribs", "thorax", "bone", None),
    "Clavicle.l": ("clavicle", "Left Clavicle", "upper_limb", "bone", "left"),
    "Clavicle.r": ("clavicle", "Right Clavicle", "upper_limb", "bone", "right"),
    "Scapula.l": ("scapula", "Left Scapula", "upper_limb", "bone", "left"),
    "Scapula.r": ("scapula", "Right Scapula", "upper_limb", "bone", "right"),
    "Humerus.l": ("humerus", "Left Humerus", "upper_limb", "bone", "left"),
    "Humerus.r": ("humerus", "Right Humerus", "upper_limb", "bone", "right"),
    "Radius.l": ("radius", "Left Radius", "upper_limb", "bone", "left"),
    "Radius.r": ("radius", "Right Radius", "upper_limb", "bone", "right"),
    "Ulna.l": ("ulna", "Left Ulna", "upper_limb", "bone", "left"),
    "Ulna.r": ("ulna", "Right Ulna", "upper_limb", "bone", "right"),
    "Bones of free part of upper limb.g": ("hand_bones", "Bones of the Hand", "upper_limb", "bone", None),
    "Hip bone.l": ("pelvis", "Left Hip Bone", "pelvis_lower_limb", "bone", "left"),
    "Hip bone.r": ("pelvis", "Right Hip Bone", "pelvis_lower_limb", "bone", "right"),
    "Femur.l": ("femur", "Left Femur", "pelvis_lower_limb", "bone", "left"),
    "Femur.r": ("femur", "Right Femur", "pelvis_lower_limb", "bone", "right"),
    "Patella.l": ("patella", "Left Patella", "pelvis_lower_limb", "bone", "left"),
    "Patella.r": ("patella", "Right Patella", "pelvis_lower_limb", "bone", "right"),
    "Tibia.l": ("tibia", "Left Tibia", "pelvis_lower_limb", "bone", "left"),
    "Tibia.r": ("tibia", "Right Tibia", "pelvis_lower_limb", "bone", "right"),
    "Fibula.l": ("fibula", "Left Fibula", "pelvis_lower_limb", "bone", "left"),
    "Fibula.r": ("fibula", "Right Fibula", "pelvis_lower_limb", "bone", "right"),
    "Bones of free part of lower limb.g": ("foot_bones", "Bones of the Foot", "pelvis_lower_limb", "bone", None),
}


def main():
    build_export(
        root_object_name="Skeletal system.g",
        name_map=NAME_MAP,
        output_path=__import__("bpy").path.abspath("//../exports/skeletal.glb"),
        collection_name="COLLECTION_SKELETAL_EXPORT",
    )


if __name__ == "__main__":
    main()
