# Brain Model Sourcing Notes

## Decision: Z-Anatomy

Selected Z-Anatomy as the source anatomical model (2026-08-19).

- Source: https://github.com/Z-Anatomy/Models-of-human-anatomy ("The-blend")
- Downloaded asset: `blender/source/downloads/Z-Anatomy.zip` (~83MB, not committed to git)
- Installed as a Blender Application Template (Blender 5.2)
- License: CC BY-SA 4.0 (share-alike, commercial use OK with attribution).
  Underlying data originates from BodyParts3D (CC-BY-SA 2.1 Japan, DBCLS).
  One sub-component (inner ear) is CC-BY-NC-SA 4.0 — excluded, not used (brain-only scope).
- Full license/attribution text: see `License.txt` inside the downloaded zip, and
  `Anatomy.txt`/repo README at the source URL above.

## What we imported

The Z-Anatomy template's `Startup.blend` contains the full human body (~7,183 objects,
1,944 collections). Only the "Brain" subtree (everything under the `Brain.g` node in the
"Nervous system & Sense organs" collection) was brought into our export pipeline —
excludes spinal cord, peripheral nerves, eye, and ear.

## Tier A region set (v1)

26 structures tagged with `region_id` custom properties, per `docs/detailed-plan.md`
Section 47. See `blender/scripts/build_brain_export.py` for the exact, re-runnable
name-mapping/tagging/export pipeline.

Bilateral/whole regions (single clickable node, both hemispheres): brain, cerebrum,
frontal_lobe, parietal_lobe, temporal_lobe, occipital_lobe, cerebellum, brainstem,
corpus_callosum, hypothalamus, third_ventricle, fourth_ventricle.

Left/right pairs: thalamus, hippocampus, amygdala, caudate_nucleus, putamen,
globus_pallidus, lateral_ventricle.

Untagged gyri/sulci and other sub-detail remain in the export as visual-only geometry;
clicking them resolves up the parent hierarchy to the nearest tagged ancestor
(see `resolveRegionId` in `app/src/brain/BrainLoader.js`).

## Export

`blender/exports/brain.glb` — 294 objects (46 empty hierarchy nodes + 248 meshes),
~335K verts / ~510K polys, 7.8MB. Z-Anatomy's built-in materials (Principled BSDF,
no textures) used as-is; their `emissiveFactor=[1,1,1]` (used by Z-Anatomy's in-Blender
highlight UI) is neutralized at load time in the Three.js app, not in the export.
