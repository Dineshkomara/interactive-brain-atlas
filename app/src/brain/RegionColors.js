/**
 * Atlas-style color coding, one hue per Tier A region (left/right pairs
 * share a color). Replaces Z-Anatomy's flat white/grey cortex materials with
 * a readable, distinct palette — same idea as classic printed brain atlases.
 */
export const REGION_COLORS = {
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

/** Strips a trailing _left/_right so both sides look up the same base color. */
function baseId(regionId) {
  return regionId ? regionId.replace(/_(left|right)$/, "") : null;
}

export function colorForRegion(regionId) {
  const base = baseId(regionId);
  return base ? (REGION_COLORS[base] ?? null) : null;
}

/**
 * Separate, more saturated palette used only for UI chrome — label chips,
 * leader lines, the legend — never for the 3D mesh itself. The model's own
 * colors are deliberately muted/natural; identification colors need to be
 * visually distinct at a glance, which muted tones aren't good at.
 */
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

export function accentColorForRegion(regionId) {
  const base = baseId(regionId);
  return base ? (ACCENT_COLORS[base] ?? 0x9aa4b2) : 0x9aa4b2;
}

/** Short display names for the legend — one entry per color, not per side. */
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
