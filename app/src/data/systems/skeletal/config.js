/**
 * Skeletal system UI configuration — mirrors
 * ../nervous/config.js's structure; see that file and
 * ../../../brain/RegionColorScheme.js for what each export feeds into.
 *
 * Bones don't occlude each other the way cortex hides deep brain structures,
 * so SURFACE_REGIONS is empty — x-ray mode is never triggered for this
 * system (see docs/full-body-atlas-plan.md Section 4.1).
 */
export const MESH_COLORS = {
  skeleton: 0xe8dfc8,
  skull: 0xe3d9bd,
  mandible: 0xdccdaa,
  vertebral_column: 0xe0d6bf,
  cervical_vertebrae: 0xe0d6bf,
  thoracic_vertebrae: 0xdccfb5,
  lumbar_vertebrae: 0xd8caae,
  sacrum: 0xd2c2a3,
  sternum: 0xe6dcc4,
  ribs: 0xe2d7bd,
  clavicle: 0xe4d9bd,
  scapula: 0xdccfb0,
  humerus: 0xe0d4b6,
  radius: 0xdccfae,
  ulna: 0xd8cba9,
  hand_bones: 0xe2d5b8,
  pelvis: 0xd6c8a9,
  femur: 0xe0d2b0,
  patella: 0xdccdaa,
  tibia: 0xdccfae,
  fibula: 0xd6c8a3,
  foot_bones: 0xe0d2b0,
};

export const ACCENT_COLORS = {
  skeleton: 0x9aa4b2,
  skull: 0xd9a441,
  mandible: 0xc97b3d,
  vertebral_column: 0x4a90d9,
  cervical_vertebrae: 0x5fa8e0,
  thoracic_vertebrae: 0x3d7fc9,
  lumbar_vertebrae: 0x2e63a8,
  sacrum: 0x6a4fc9,
  sternum: 0xd94f6b,
  ribs: 0xe0708a,
  clavicle: 0x4caf6e,
  scapula: 0x37905a,
  humerus: 0xd9b02e,
  radius: 0xc78f26,
  ulna: 0xa8731e,
  hand_bones: 0xe08c3c,
  pelvis: 0xb0529c,
  femur: 0x2eb8a0,
  patella: 0x33bcd4,
  tibia: 0x2a9db3,
  fibula: 0x1f7d8f,
  foot_bones: 0xe0793c,
};

export const BASE_NAMES = {
  skeleton: "Skeleton (Whole)",
  skull: "Skull",
  mandible: "Mandible",
  vertebral_column: "Vertebral Column",
  cervical_vertebrae: "Cervical Vertebrae",
  thoracic_vertebrae: "Thoracic Vertebrae",
  lumbar_vertebrae: "Lumbar Vertebrae",
  sacrum: "Sacrum",
  sternum: "Sternum",
  ribs: "Ribs",
  clavicle: "Clavicle",
  scapula: "Scapula",
  humerus: "Humerus",
  radius: "Radius",
  ulna: "Ulna",
  hand_bones: "Bones of the Hand",
  pelvis: "Pelvis (Hip Bone)",
  femur: "Femur",
  patella: "Patella",
  tibia: "Tibia",
  fibula: "Fibula",
  foot_bones: "Bones of the Foot",
};

/** No structures need fading for a click-through "identify" quiz question —
 * every bone is externally visible, unlike the brain's cortex-hidden
 * subcortical structures. */
export const SURFACE_REGIONS = [];

export const GROUP_ORDER = ["skeleton", "axial_skull", "spine", "thorax", "upper_limb", "pelvis_lower_limb"];

export const GROUP_LABELS = {
  skeleton: "Whole Skeleton",
  axial_skull: "Skull & Face",
  spine: "Vertebral Column",
  thorax: "Thorax",
  upper_limb: "Upper Limb",
  pelvis_lower_limb: "Pelvis & Lower Limb",
};
