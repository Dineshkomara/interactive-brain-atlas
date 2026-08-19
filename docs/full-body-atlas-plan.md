# Full-Body Interactive Atlas — Extension Plan

## Companion to `docs/detailed-plan.md`. Same strategy, same rules, same choices — extended to the rest of the body.

---

# 0. The key fact that makes this cheap

**Z-Anatomy is not a brain model. It's a full-body model.** We only tagged and exported
the nervous system out of it. The Blender application template we already installed
(`blender/source/downloads/Z-Anatomy.zip`) contains the entire body — confirmed by
directly inspecting the live Blender scene:

```text
Scene: 7,183 objects total across 1,944 collections

1: Skeletal system              2,218 objects
2: Muscular insertions              —  (attachment-point layer, advanced/optional)
3: Joints                           —  (advanced/optional)
4: Muscular system                 894 objects
5: Cardiovascular system           757 objects
6: Lymphoid organs                 276 objects
6: Nervous system & Sense organs   842 objects   ← already built (this project)
7: Visceral systems                479 objects
8: Regions of human body           343 objects   (surface landmarks, not organs)
9: Reference lines/planes/movements  —  (anatomical-position reference geometry)
```

`7: Visceral systems` is itself already subdivided by the source data into exactly the
systems a biology curriculum would expect:

```text
Visceral systems.g
├── Digestive system.g      (221 objects)
├── Respiratory system.g    (127 objects)
├── Endocrine glands.g       (43 objects)
├── Urinary system.g         (31 objects)
├── Genital systems.g        (35 objects)
├── Abdominopelvic cavity.g  (13 objects — serous membranes, low priority)
└── Thoracic cavity.g         (2 objects — low priority)
```

**Consequence:** no new model sourcing, no new licensing decision, no new download.
Same CC BY-SA 4.0 terms, same attribution obligation, same Credits panel — just extend
it to say "full-body model" instead of "brain model." The only new work is Blender
tagging/export (repeating the exact pipeline in `blender/scripts/build_brain_export.py`)
and building out the content (`regions.json` / `lessons.json` / `quizzes.json`) per
system.

---

# 1. What's already reusable as-is vs. what needs generalizing

Nothing in the current app is hardcoded to "brain" at the interaction level — the
design was already data-driven. Auditing each piece:

| Component | Reusable as-is? | Notes |
|---|---|---|
| `BrainViewer.js` (scene/camera/renderer/lighting) | Yes | Rename to `ModelViewer.js` eventually; behavior is generic |
| `BrainLoader.js` (GLTFLoader + region index) | Yes | Already just walks `extras.region_id` |
| `RegionPicker.js` (raycasting) | Yes | No brain-specific logic |
| `CameraController.js` (best-angle, orbit slerp, min-distance) | Yes | Fully generic 3D-scene math |
| `RegionHighlighter.js` (isolate/x-ray fade) | Mostly | The `SURFACE_REGIONS` set (which regions count as "outer layer" for x-ray mode) is brain-specific and needs a per-system definition — e.g. for the muscular system, "surface" would mean superficial muscles, not skin |
| `RegionColors.js` (mesh + accent palettes) | No — needs data | Palette itself is per-system; the *mechanism* (`colorForRegion`/`accentColorForRegion`) is reusable |
| `LabelsOverlay.js` | Yes | Fully generic (silhouette-based offset, separation, hover-preview) |
| `StructureSearch.js` | Yes | Just needs a `systemGroups` taxonomy per system |
| `WalkthroughPanel.js` / `lessons.json` schema | Yes | Content-driven already |
| `QuizPanel.js` (incl. x-ray mode) | Yes | `INTERNAL_CATEGORIES` check generalizes directly |
| `CreditsPanel.js` | Yes | Just update the copy to describe the full-body source |
| `main.js` | No — needs restructuring | Currently wires one hardcoded model; needs to become system-aware (Section 3) |

**Bottom line:** the 3D interaction engine is done. What's new is (a) a system-switching
shell, (b) per-system data, and (c) repeating the Blender tagging pass per system.

---

# 2. Content governance carried over unchanged

Same rules as the brain module, applied uniformly to every new system:

- `region_<stable_id>_<side>` naming convention.
- Custom properties: `region_id`, `region_name`, `system`, `category`, `side`, `version`.
- Every region entry ships with `reviewStatus: "DRAFT"` and the same non-diagnostic
  disclaimer pattern used throughout `regions.json` today.
- Content stays high-school-level, plain-English, structured as WHERE/WHAT/FUNCTIONS/
  CONNECTED TO/WHY IT MATTERS — not textbook paragraphs.
- Same attribution requirement (CC BY-SA 4.0, Z-Anatomy + BodyParts3D credit, share-alike
  on the derived 3D assets) — one Credits panel, updated copy, covers all systems.

One new governance note specific to this expansion:

> **The underlying model appears to be male-only.** A scene-wide search found no
> uterus/ovary/vagina geometry — only "Male genital system.g" exists under
> `Genital systems.g`. If a female reproductive module matters for your curriculum,
> that's a real gap this dataset can't fill; it would need a supplementary source
> (with its own license check) rather than being solvable inside Z-Anatomy. Flagging
> this now rather than discovering it mid-build.

> **Reproductive system content in general** is legitimate standard biology curriculum
> material, not something to avoid — but you should decide for yourself whether it's
> in scope for your intended audience/deployment (grade level, school policy, region).
> My recommendation if you do include it: keep it as its own clearly-labeled module
> (not folded silently into a combined tour), written at the same clinical,
> textbook-standard register as the rest of the content — same approach real anatomy
> atlases take.

---

# 3. New architecture: supporting multiple systems

## 3.1 Data layout

Move from one flat `data/regions.json` to a per-system layout, with a top-level catalog:

```text
data/
├── systems.json              ← catalog: which systems exist, their status
└── systems/
    ├── nervous/
    │   ├── regions.json       (already exists — becomes this)
    │   ├── lessons.json
    │   └── quizzes.json
    ├── skeletal/
    │   ├── regions.json
    │   ├── lessons.json
    │   └── quizzes.json
    ├── muscular/
    │   └── ...
    ├── cardiovascular/
    │   └── ...
    └── ... (one folder per system)
```

`data/systems.json` (currently an empty stub) becomes:

```json
{
  "nervous": { "name": "Nervous System", "glb": "/models/nervous.glb", "status": "available" },
  "skeletal": { "name": "Skeletal System", "glb": "/models/skeletal.glb", "status": "available" },
  "muscular": { "name": "Muscular System", "glb": "/models/muscular.glb", "status": "coming_soon" }
}
```

## 3.2 App shell

`main.js` currently boots one hardcoded model. Restructure into:

- A **System Selector** screen (or a dropdown in the toolbar, next to the search box) —
  lists systems from `systems.json`, greyed out if `status: "coming_soon"`.
- A generic **mount/unmount** cycle: selecting a system disposes the current
  `RegionHighlighter`/`LabelsOverlay`/`RegionPicker`/lesson/quiz instances, loads that
  system's GLB + region/lesson/quiz JSON, and re-wires the same components against the
  new data. Every component listed as "reusable as-is" in Section 1 already supports
  this — none of them hold system-specific state beyond what's passed in.
- One `brain.glb`-sized model per system (not one giant combined model) — keeps load
  time reasonable and matches the original plan's own Section 30 guidance ("load only
  required assets," "multiple model tiers").

## 3.3 Blender pipeline generalization

`blender/scripts/build_brain_export.py` is currently brain-specific (hardcoded
`NAME_MAP`, hardcoded root object `"Brain.g"`). Generalize it into
`blender/scripts/build_system_export.py`, parameterized by:

```python
build_export(
    root_object_name="Skeletal system.g",
    name_map={...},               # per-system Tier A mapping
    output_path="skeletal.glb",
)
```

The FONT→Empty conversion, bilateral-midline anchor-fixing, junk-mesh filtering, and
export logic are all already system-agnostic — they operate on whatever subtree root
you give them. This is a refactor, not a rewrite.

## 3.4 Per-system `SURFACE_REGIONS` (x-ray mode)

The quiz "x-ray" mode (fade the outer layer so internal structures become clickable)
needs a per-system definition of "what counts as outer":

| System | "Surface" layer for x-ray purposes |
|---|---|
| Nervous | cortex/cerebellum/brainstem (done) |
| Skeletal | mostly moot — bones don't occlude each other much; skip x-ray, keep normal isolate |
| Muscular | superficial muscle layer, to reveal deep muscles underneath — this is the system where x-ray/"peel" mode matters *most* |
| Cardiovascular | mostly moot — vessels are thin, rarely occlude each other |
| Digestive/Respiratory/Urinary | outer organ surfaces (e.g. liver/stomach wall) fade to reveal ducts/internal structure where relevant |

---

# 4. Per-system detailed plan

Each section: source collection (real counts from the live scene), a recommended
Tier A structure list sized like the brain's (~20–35), naming pattern, and
system-specific notes.

## 4.1 Skeletal System — `1: Skeletal system` (2,218 objects)

Source is extremely granular (individual foramina, sutures, processes). Real top-level
grouping found in Blender:

```text
Skeletal system.g
├── Axial skeleton.g
│   ├── Cranium.g
│   ├── Extracranial bones of head.g
│   ├── Vertebral column.g
│   └── Thoracic skeleton.g
├── Appendicular skeleton.g
│   ├── Bony pelvis.g
│   ├── Bones of upper limb.g
│   └── Bones of lower limb.g
├── Auditory ossicles.g
├── Cartilages of ear.g / Laryngeal cartilages.g / Nasal cartilages.g
└── Teeth.g
```

**Tier A (~28 regions):**

| region_id | Display name | side |
|---|---|---|
| `skull` | Skull | — |
| `mandible` | Mandible | — |
| `vertebral_column` | Vertebral Column | — |
| `cervical_vertebrae` | Cervical Vertebrae | — |
| `thoracic_vertebrae` | Thoracic Vertebrae | — |
| `lumbar_vertebrae` | Lumbar Vertebrae | — |
| `sacrum` | Sacrum | — |
| `sternum` | Sternum | — |
| `ribs` | Ribs | — (bilateral group, like brain lobes) |
| `clavicle` | Clavicle | left/right |
| `scapula` | Scapula | left/right |
| `humerus` | Humerus | left/right |
| `radius` | Radius | left/right |
| `ulna` | Ulna | left/right |
| `hand_bones` | Bones of the Hand | left/right |
| `pelvis` | Pelvis (Os Coxae) | left/right |
| `femur` | Femur | left/right |
| `patella` | Patella | left/right |
| `tibia` | Tibia | left/right |
| `fibula` | Fibula | left/right |
| `foot_bones` | Bones of the Foot | left/right |

**Notes:** Bones are naturally non-occluding (no x-ray mode needed — the whole
skeleton is "surface"). This is the *easiest* system to build after nervous — every
structure is trivially clickable, no thin-geometry or internal-visibility problems.
Good candidate for **Phase 1**.

## 4.2 Muscular System — `4: Muscular system` (894 objects)

Organized by body region rather than individual muscle at the top level:

```text
Muscular system.g
├── Cranial part.g / Cervical part.g / Thoracic part.g / Abdominal part.g / Dorsal part.g / Pelvic part.g
├── Muscular system of upper limb.g → Muscles of upper limb.g
├── Muscular system of lower limb.g
├── Synovial bursae.g / Tendon sheaths.g   (advanced, skip for Tier A)
```

**Tier A (~24 regions)** — major named muscles, one level deeper than the region
groupings above (needs a follow-up Blender inspection pass into
`Muscles of upper limb.g` etc. to get exact names, same process used for the brain):
Trapezius, Deltoid, Pectoralis Major, Biceps Brachii, Triceps Brachii,
Latissimus Dorsi, Rectus Abdominis, External Oblique, Sternocleidomastoid,
Gluteus Maximus, Quadriceps Femoris (group), Hamstrings (group), Gastrocnemius,
Soleus, Erector Spinae — left/right where applicable, per the same convention.

**Notes:** This is the system where the **x-ray/peel mode already built for the
quiz** earns its keep the most — superficial vs. deep muscle layers is a classic
teaching need (Section 23 of the original plan, "Peel the Brain," generalizes
directly to "Peel the Muscles"). Good **Phase 2** — proves the x-ray mechanism
generalizes before committing to it elsewhere.

## 4.3 Cardiovascular System — `5: Cardiovascular system` (757 objects)

```text
Arterial system.g
├── Heart.g            (chambers, valves — confirmed present)
├── Arteries of heart.g (coronary arteries)
├── Pulmonary arteries.g
└── Systemic arteries.g
Venous system.g
└── (parallel venous structure)
```

**Tier A (~22 regions):** Right Atrium, Right Ventricle, Left Atrium, Left Ventricle,
Aorta, Pulmonary Artery, Pulmonary Vein, Superior Vena Cava, Inferior Vena Cava,
Coronary Arteries, Carotid Artery (L/R), Jugular Vein (L/R), Subclavian Artery (L/R),
Femoral Artery (L/R), Femoral Vein (L/R).

**Notes — real technical challenge:** vessels are thin, tube-like geometry. Precise
clicking may be genuinely harder than anything in the brain module (where structures
are chunky). Options: increase the label hit-area disproportionately for this system,
or accept lower click-precision and lean harder on search/labels/tour navigation
rather than raw click-to-identify for thin vessels. Worth prototyping early rather
than assuming it'll "just work" like the brain did.

**Pedagogical bonus:** natural fit for a **"trace the blood flow" guided tour** —
order the walkthrough steps along the actual circulation path (right atrium → right
ventricle → pulmonary artery → [lungs, conceptual] → pulmonary vein → left atrium →
left ventricle → aorta → body) rather than an anatomical-region order. The existing
`WalkthroughPanel` needs no changes to support this — it's just step ordering.

## 4.4 Respiratory System — `Visceral systems > Respiratory system.g` (127 objects)

```text
Respiratory system.g
├── Nose.g / Paranasal sinuses.g
├── Larynx.g
├── Tracheobronchial tree.g
└── Lungs.g → Left lung.g, Right lung.g
```

**Tier A (~14 regions):** Nasal Cavity, Larynx, Trachea, Right Bronchus, Left Bronchus,
Right Lung (upper/middle/lower lobe), Left Lung (upper/lower lobe), Diaphragm.

**Notes:** Small, fast to build. Good early win — recommend bundling with Phase 3 or
right after Skeletal as a quick confidence-builder before tackling the harder systems.

## 4.5 Digestive System — `Visceral systems > Digestive system.g` (221 objects)

```text
Digestive system.g
├── Mouth.g / Fauces.g / Pharynx.g
├── Digestive canal.g → Oesophagus, Stomach, Small intestine.g, Large intestine.g
├── Liver
├── Gallbladder
├── Extrahepatic bile ducts.g
└── Pancreas
```

**Tier A (~18 regions):** Esophagus, Stomach, Liver, Gallbladder, Pancreas, Small
Intestine (Duodenum/Jejunum/Ileum as one or three regions depending on desired
granularity), Large Intestine (Cecum, Colon, Rectum).

**Notes:** Same "trace the path" pedagogical opportunity as cardiovascular — a
"follow a meal through the digestive tract" tour ordering.

## 4.6 Endocrine System — `Visceral systems > Endocrine glands.g` (43 objects)

```text
Endocrine glands.g
├── Hypophysis.g (pituitary)
├── Parathyroid glands.g
├── Pineal gland
├── Suprarenal gland (left/right)  (adrenal glands)
└── Thyroid gland
```

**Tier A (~8 regions):** Pituitary Gland, Thyroid Gland, Parathyroid Glands,
Adrenal Glands (L/R), Pineal Gland — cross-reference Pancreas (digestive) and
Ovaries/Testes (reproductive) as "also endocrine" in `relatedRegions` rather than
duplicating the 3D tag.

**Notes:** Smallest system by structure count. Good candidate for a quick Phase
alongside Urinary — conceptually important (hormones) despite being visually small.

## 4.7 Urinary System — `Visceral systems > Urinary system.g` (31 objects)

**Tier A (~8 regions):** Kidney (L/R), Renal Pelvis (L/R), Ureter (L/R), Urinary
Bladder, Urethra.

**Notes:** Small, straightforward, no unusual technical challenges.

## 4.8 Lymphatic/Immune System — `6: Lymphoid organs` (276 objects)

**Tier A (~10 regions):** Spleen, Thymus, Tonsils, Cervical Lymph Nodes, Axillary
Lymph Nodes, Inguinal Lymph Nodes, Thoracic Duct.

**Notes:** Conceptually pairs well with either Cardiovascular (shares vessel-like
geometry challenges) or stands alone as a short module.

## 4.9 Reproductive System — `Visceral systems > Genital systems.g` (35 objects)

**Only male anatomy exists in this dataset** (see Section 2 governance note).

**Tier A (~8 regions, male only):** Testis (L/R), Epididymis (L/R), Vas Deferens,
Prostate Gland, Seminal Vesicle, Penis.

**Notes:** Build as its own clearly-labeled, opt-in module per the governance note
above. If female anatomy is required, that's a separate sourcing decision — flag to
revisit rather than solve inside this dataset.

## 4.10 Integumentary System (Skin) — likely **not viable from this dataset**

Z-Anatomy is a dissection-style model built to show what's *underneath* skin — a
quick scene search found no meaningful skin/integument geometry. Recommend **skipping
the 3D model for this system** and using licensed 2D diagrams instead, per the
original plan's own fallback option (Section 3: "simple diagrams/images where
licensed"). Not worth forcing into the 3D pipeline.

## 4.11 Nervous System — already shipped

No new work; this is the reference implementation the rest of this plan follows.

---

# 5. Suggested build order

Mirrors the original plan's own philosophy (Section 39/40: one capability at a time,
prove it before generalizing) — order chosen by a mix of "quick wins first" and
"prove the harder mechanisms (x-ray/thin-geometry) early, not last":

```text
Phase 1 — Skeletal System
    Easiest possible: no occlusion problems, no x-ray needed, huge structure
    availability. Proves the multi-system app shell (Section 3) works at all.

Phase 2 — Muscular System
    Proves the x-ray/"peel" mechanism generalizes beyond the brain.

Phase 3 — Respiratory + Urinary + Endocrine
    Three small, fast systems, bundled together as a batch — low structure counts,
    no major new technical risk. Good momentum phase.

Phase 4 — Digestive System
    Medium size, "trace the path" tour pattern established here.

Phase 5 — Cardiovascular System
    Deliberately not first — thin-vessel click precision is a real open question,
    worth tackling once the app shell and content pipeline are both proven stable.

Phase 6 — Lymphatic System
    Pairs naturally with whichever of Cardiovascular/Endocrine is more convenient
    at the time.

Phase 7 — Reproductive System (male)
    Built last, as its own opt-in module, once you've decided whether it's in scope.

Not planned — Integumentary System
    2D diagrams instead of a 3D model, if wanted at all.
```

---

# 6. What stays exactly the same throughout

To be explicit about "same rules and choices," carried unchanged into every phase
above:

- CC BY-SA 4.0 licensing, same Credits panel mechanism, same share-alike obligation
  on the derived 3D assets.
- `region_<stable_id>_<side>` naming; `region_id`/`region_name`/`system`/`category`/
  `side`/`version` custom properties.
- Backup discipline: the pristine `Z-Anatomy.zip` is never modified; each system's
  tagging happens on the live Blender session and exports to its own `.glb`, exactly
  like `build_brain_export.py` does today.
- Content governance: `DRAFT` review status, non-diagnostic disclaimers, high-school
  reading level, structured WHERE/WHAT/FUNCTIONS/CONNECTED TO/WHY-IT-MATTERS panels.
- All the interaction fixes already built — color-coded labels outside the model
  silhouette, hover-preview, smooth orbit camera transitions, opacity-isolate
  selection, search/tour/quiz — apply automatically to every new system once its
  data exists, with zero UI code changes required per system.
