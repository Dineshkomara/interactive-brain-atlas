/**
 * Nervous system UI configuration — everything about how this system's data
 * gets displayed/grouped/colored, as opposed to the anatomical content
 * itself (which lives in regions.json/lessons.json/quizzes.json alongside
 * this file). See ../../../brain/RegionColorScheme.js for the generic
 * mechanism MESH_COLORS/ACCENT_COLORS/BASE_NAMES feed into.
 *
 * MESH_COLORS is the muted, natural palette applied to the 3D model itself;
 * ACCENT_COLORS is a separate, more saturated palette used only for UI
 * chrome (labels, legend, leader lines).
 */
export const MESH_COLORS = {
  brain: 0xcdb8a4,
  cerebrum: 0xd6c1ac,
  frontal_lobe: 0xcb9a7c,
  parietal_lobe: 0xc4ad8f,
  temporal_lobe: 0xc9a56d,
  occipital_lobe: 0xb0a37e,
  cerebellum: 0xaf8f7c,
  brainstem: 0xb4835f,
  corpus_callosum: 0xe6d9bf,
  hypothalamus: 0xac6f63,
  third_ventricle: 0x8fa7a3,
  fourth_ventricle: 0x8fa7a3,
  lateral_ventricle: 0x8fa7a3,
  thalamus: 0x9a8367,
  hippocampus: 0x8f6a63,
  amygdala: 0xa8735a,
  caudate_nucleus: 0xa89168,
  putamen: 0x9c7355,
  globus_pallidus: 0xa89a80,
};

export const ACCENT_COLORS = {
  brain: 0x9aa4b2,
  cerebrum: 0xd9a441,
  frontal_lobe: 0xe4593f,
  parietal_lobe: 0x4a90d9,
  temporal_lobe: 0xd9b02e,
  occipital_lobe: 0x4caf6e,
  cerebellum: 0xa25fd1,
  brainstem: 0xd2691e,
  corpus_callosum: 0xd9c53d,
  hypothalamus: 0xe0507a,
  third_ventricle: 0x33bcd4,
  fourth_ventricle: 0x33bcd4,
  lateral_ventricle: 0x33bcd4,
  thalamus: 0x2eb8a0,
  hippocampus: 0xb0529c,
  amygdala: 0xe0793c,
  caudate_nucleus: 0xb8a030,
  putamen: 0xc25a3a,
  globus_pallidus: 0x7fa889,
};

export const BASE_NAMES = {
  brain: "Brain (overall)",
  cerebrum: "Cerebrum",
  frontal_lobe: "Frontal Lobe",
  parietal_lobe: "Parietal Lobe",
  temporal_lobe: "Temporal Lobe",
  occipital_lobe: "Occipital Lobe",
  cerebellum: "Cerebellum",
  brainstem: "Brainstem",
  corpus_callosum: "Corpus Callosum",
  hypothalamus: "Hypothalamus",
  third_ventricle: "Ventricles",
  thalamus: "Thalamus",
  hippocampus: "Hippocampus",
  amygdala: "Amygdala",
  caudate_nucleus: "Caudate Nucleus",
  putamen: "Putamen",
  globus_pallidus: "Globus Pallidus",
};

/** Outer/surface regions — faded during quiz x-ray mode so internal
 * structures (thalamus, hippocampus, ventricles, basal ganglia...) become
 * clickable without singling out any one of them. */
export const SURFACE_REGIONS = [
  "brain",
  "cerebrum",
  "frontal_lobe",
  "parietal_lobe",
  "temporal_lobe",
  "occipital_lobe",
  "cerebellum",
  "brainstem",
];

/** Grouping for the "Choose a Structure" search box, keyed by each region's
 * `system` field in regions.json. */
export const GROUP_ORDER = [
  "whole_brain",
  "cerebrum",
  "diencephalon",
  "limbic_system",
  "basal_ganglia",
  "brainstem",
  "cerebellum",
  "ventricular_system",
];

export const GROUP_LABELS = {
  whole_brain: "Whole Brain",
  cerebrum: "Cerebrum & Lobes",
  diencephalon: "Diencephalon",
  limbic_system: "Limbic System",
  basal_ganglia: "Basal Ganglia",
  brainstem: "Brainstem",
  cerebellum: "Cerebellum",
  ventricular_system: "Ventricular System",
};
