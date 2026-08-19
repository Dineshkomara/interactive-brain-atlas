# Interactive Brain Atlas — Detailed Development Plan

## Project Goal

Build a browser-based, student-focused interactive 3D brain atlas inspired by the interaction model of Neurotorium's Brain Atlas, while using original implementation, original educational content, and appropriately licensed 3D assets.

The target experience is not a static anatomy page. It should allow a student to:

- rotate, zoom, and pan around a 3D brain;
- click individual anatomical structures;
- highlight the selected structure;
- automatically move the camera toward a selected structure;
- reveal educational information in a side panel;
- search for regions;
- show/hide anatomical layers;
- control surface transparency to reveal deeper structures;
- inspect sagittal, coronal, and axial/horizontal sections;
- switch between beginner-friendly and more detailed explanations;
- follow guided anatomy lessons;
- test knowledge with quizzes;
- eventually explore pathways, clinical relevance, and AI-assisted explanations.

The recommended architecture is:

> **Blender + Blender MCP for anatomical asset preparation, Three.js for browser-based 3D interaction, HTML/CSS/JavaScript or React for the application UI, and structured JSON/TypeScript data for educational content.**

---

# 1. Executive Recommendation

## Recommended stack

| Area | Recommended technology | Purpose |
|---|---|---|
| 3D asset creation/preparation | Blender 5.1+ | Import, clean, separate, name, optimize, inspect and prepare the brain model |
| AI control of Blender | Official Blender MCP where practical; another mature Blender MCP only when needed | Automate repetitive Blender operations and enable AI-assisted scene inspection/editing |
| Web 3D | Three.js | Render the brain in WebGL/WebGPU-compatible browser workflows and handle interaction |
| 3D format | GLB / glTF 2.0 | Deliver the prepared model to the browser |
| UI for MVP | HTML + CSS + JavaScript | Keep the first prototype simple and understandable |
| UI for full application | React + TypeScript | Scale the interface and state management after the 3D core is stable |
| Animation | Three.js animation utilities and optionally GSAP | Camera fly-to, transitions, guided demonstrations |
| Data | JSON initially; TypeScript interfaces | Brain region metadata, descriptions, functions, quiz questions, references |
| Optional backend | Node.js/Express or a serverless API | Accounts, analytics, content management, AI services, saved progress |
| Deployment | Vercel / Netlify / Cloudflare Pages or equivalent | Host the web application |
| Version control | Git + GitHub | Track models, code, data and releases |

### Why this architecture

Blender and the website have different responsibilities.

**Blender should own the 3D asset pipeline.**

**Three.js should own the browser experience.**

Do not try to turn Blender into the runtime web application.

Blender's current glTF 2.0 exporter supports `.glb` and `.gltf`, meshes, materials, textures, cameras, lights, animation, and custom properties. Custom properties can be exported as glTF `extras`, which is useful for associating anatomical metadata with objects. The Blender documentation describes glTF as a format intended for transmission and loading of 3D models in web and native applications. [Blender glTF 2.0 documentation](https://docs.blender.org/manual/en/dev/addons/scene_gltf2.html)

The current official Blender MCP setup documented by Intel's AI Playground points to Blender's official MCP project and notes Blender 5.1.0 as a prerequisite for that integration. [Blender MCP setup](https://github.com/intel/AI-Playground/blob/main/blender-mcp.md)

---

# 2. Product Vision

## Core learning loop

The experience should teach anatomy through a repeated sequence:

```text
WHERE IS IT?
      ↓
SHOW THE STRUCTURE
      ↓
WHAT IS IT?
      ↓
WHAT DOES IT DO?
      ↓
WHAT IS IT CONNECTED TO?
      ↓
WHY DOES IT MATTER?
      ↓
TEST THE STUDENT
```

This is more educational than presenting a static 3D model and several paragraphs of text.

## Core interaction

The single most important interaction is:

```text
Student clicks structure
        ↓
Three.js Raycaster identifies mesh
        ↓
Stable region ID is resolved
        ↓
Structure is highlighted
        ↓
Camera smoothly moves toward it
        ↓
Information panel opens
        ↓
Student learns
```

Everything else should build on this foundation.

---

# 3. Product Scope by Version

## Version 0.1 — 3D Viewer

Goal: prove that the selected brain model can run correctly in the browser.

Features:

- load GLB;
- orbit/rotate;
- zoom;
- pan;
- reset camera;
- responsive viewport;
- basic lighting;
- loading indicator;
- FPS/performance sanity check.

No advanced anatomy features yet.

### Definition of done

A student can open the page and interact smoothly with the brain on desktop.

---

## Version 0.2 — Selectable Anatomy

Features:

- click detection;
- mesh naming conventions;
- anatomical region IDs;
- selected-state highlight;
- deselection;
- hover state;
- basic labels;
- information panel.

### Definition of done

Clicking the hippocampus selects the hippocampus rather than the whole brain.

---

## Version 0.3 — Educational Atlas

Features:

- search;
- category filtering;
- region descriptions;
- function lists;
- location information;
- simple diagrams/images where licensed;
- references;
- show/hide layers;
- surface transparency.

### Definition of done

A student can search for a region and understand where it is and what it does.

---

## Version 0.4 — Anatomical Exploration

Features:

- sagittal section;
- coronal section;
- axial/horizontal section;
- adjustable clipping plane;
- internal structures;
- camera fly-to;
- isolate selected structure;
- restore whole brain.

### Definition of done

A student can understand both surface anatomy and deeper structures.

---

## Version 0.5 — Guided Learning

Features:

- guided tours;
- step-by-step lessons;
- animated camera transitions;
- guided labels;
- “continue” sequence;
- progress tracking.

Example:

```text
Cerebrum
  → Frontal lobe
  → Prefrontal cortex
  → Motor cortex
  → Broca's area
```

---

## Version 0.6 — Quiz Mode

Features:

- identify-the-structure quizzes;
- function questions;
- location questions;
- multiple choice;
- visual click-based questions;
- score;
- explanations after answers;
- retry.

Example:

```text
Question:
Which structure is associated with memory formation?

Student selects a structure on the brain.

Correct:
Hippocampus
```

---

## Version 0.7 — Advanced Anatomy

Features:

- functional systems;
- neural pathways;
- connected-region visualization;
- white matter / tract visualizations;
- cranial nerves where supported by the model;
- ventricular system;
- vascular layer if appropriately sourced;
- more detailed cross-sections;
- multiple model detail levels.

---

## Version 1.0 — Learning Platform

Features:

- search;
- explore;
- guided lessons;
- quiz mode;
- bookmarks/favorites;
- progress tracking;
- references;
- accessibility improvements;
- responsive mobile/tablet behavior;
- performance optimization;
- content versioning;
- analytics if appropriate.

---

# 4. Blender + Blender MCP Strategy

## Principle

Use Blender MCP as an **asset-production copilot**, not as the web runtime.

The useful pipeline is:

```text
Licensed anatomical source model
            ↓
          Blender
            ↓
      Blender MCP / AI
            ↓
  inspect → organize → rename
            ↓
  separate → tag → optimize
            ↓
          brain.glb
            ↓
          Three.js
```

## What Blender MCP should do

Good uses:

- inspect scene hierarchy;
- find specific meshes;
- rename objects consistently;
- create collections;
- separate structures that are already represented in the source model;
- assign stable IDs;
- create materials;
- adjust materials for web presentation;
- run `bpy` scripts for repetitive operations;
- create controlled camera viewpoints;
- validate object names;
- export selected collections;
- create preview renders/screenshots;
- run automated checks on the asset.

## What Blender MCP should not be trusted to decide on its own

Do not blindly ask an AI agent to invent medically accurate anatomy.

AI can assist with manipulation and automation, but anatomical truth should come from:

- a properly licensed high-quality model;
- authoritative anatomy references;
- subject-matter review;
- explicit validation of labels and educational claims.

The safer pattern is:

```text
Authoritative/licensed anatomy source
              ↓
       Blender preparation
              ↓
       AI-assisted operations
              ↓
       Human verification
              ↓
          Web release
```

---

# 5. Choosing the 3D Brain Model

## This is the most important decision in the whole project

A visually impressive generic brain is not sufficient.

For a true interactive atlas, the model should ideally have separate, addressable structures.

Bad model:

```text
Brain
└── One giant mesh
```

Good model:

```text
Brain
├── Cortex_Left
├── Cortex_Right
├── Frontal_Lobe
├── Parietal_Lobe
├── Temporal_Lobe
├── Occipital_Lobe
├── Cerebellum
├── Brainstem
├── Thalamus
├── Hippocampus_Left
├── Hippocampus_Right
├── Amygdala_Left
├── Amygdala_Right
└── ...
```

## Required asset characteristics

Prefer a model with:

- separate anatomical meshes or logically separable structures;
- left/right distinctions where appropriate;
- clean names or at least stable topology/material groups;
- reasonable polygon count;
- suitable licensing;
- clean normals;
- no unnecessary hidden geometry;
- textures only where they materially improve the educational experience;
- no dependency on proprietary runtime software.

## Model quality tiers

### Tier A — student/demo model

20–30 major structures.

Good for MVP.

### Tier B — university-level atlas

50–100+ logical structures.

Good for the main product.

### Tier C — detailed medical atlas

Hundreds of structures, pathways, vessels, nuclei, tracts and sectional data.

Much more expensive in asset preparation and content validation.

### Recommendation

Start with Tier A or lower Tier B and design the architecture so more structures can be added later.

---

# 6. Anatomical Object Naming Convention

Do not rely on whatever names happen to exist in a downloaded model.

Create a stable naming system.

Recommended pattern:

```text
region_<stable_id>_<side>
```

Examples:

```text
region_cortex_left
region_cortex_right
region_hippocampus_left
region_hippocampus_right
region_thalamus
region_cerebellum
region_brainstem
```

If a structure does not need laterality:

```text
region_thalamus
region_pituitary_gland
region_corpus_callosum
```

Stable IDs must not be changed casually after release.

---

# 7. Object Metadata Strategy

Blender custom properties can be exported as glTF extras when enabled in the export settings.

Example object metadata:

```text
region_id = "hippocampus_left"
region_name = "Left Hippocampus"
system = "limbic"
category = "subcortical"
side = "left"
version = "1.0"
```

The web application should still maintain its own authoritative content dataset rather than depending entirely on model metadata.

Use the model metadata primarily as a stable bridge between:

```text
3D object ↔ application region ID
```

Use JSON/TypeScript data for:

```text
region ID ↔ educational content
```

---

# 8. Recommended Data Model

Create:

```text
data/
├── regions.json
├── systems.json
├── pathways.json
├── lessons.json
├── quizzes.json
└── references.json
```

Example `regions.json`:

```json
{
  "hippocampus_left": {
    "name": "Left Hippocampus",
    "system": "limbic_system",
    "category": "subcortical",
    "side": "left",
    "summary": "A structure involved in memory-related processes.",
    "location": "Medial temporal lobe",
    "functions": [
      "Memory-related processing",
      "Spatial navigation"
    ],
    "clinicalRelevance": "Validated educational content goes here.",
    "relatedRegions": [
      "amygdala_left",
      "thalamus"
    ],
    "referenceIds": [
      "ref_001"
    ]
  }
}
```

Keep educational content separate from rendering code.

---

# 9. Web Application Architecture

Recommended initial folder structure:

```text
brain-atlas/
│
├── index.html
├── package.json
│
├── public/
│   ├── models/
│   │   └── brain.glb
│   ├── textures/
│   └── icons/
│
├── src/
│   ├── main.js
│   ├── brain/
│   │   ├── BrainViewer.js
│   │   ├── BrainLoader.js
│   │   ├── RegionPicker.js
│   │   ├── RegionHighlighter.js
│   │   ├── CameraController.js
│   │   ├── SectionController.js
│   │   ├── TransparencyController.js
│   │   └── LayerController.js
│   │
│   ├── data/
│   │   └── regions.json
│   │
│   ├── ui/
│   │   ├── SearchPanel.js
│   │   ├── RegionPanel.js
│   │   ├── Toolbar.js
│   │   ├── Labels.js
│   │   └── QuizPanel.js
│   │
│   └── utils/
│       ├── constants.js
│       └── helpers.js
│
└── styles/
    ├── main.css
    ├── viewer.css
    └── panels.css
```

For the first prototype, plain JavaScript is enough. Move to TypeScript/React after the viewer and data model stabilize.

---

# 10. Three.js Responsibilities

The Three.js layer should own:

## Scene

- scene creation;
- lighting;
- background;
- environment if required.

## Camera

- perspective camera;
- orbit controls;
- camera targets;
- fly-to animation;
- reset.

## Renderer

- WebGLRenderer initially;
- color space/tone settings;
- pixel ratio;
- resize handling;
- optional post-processing.

## Model loader

Use `GLTFLoader` for the GLB asset.

Conceptual flow:

```text
GLTFLoader
    ↓
load brain.glb
    ↓
scene graph
    ↓
index anatomical objects
    ↓
register region IDs
```

## Raycasting

Use a Three.js raycaster to detect selected objects.

Conceptual flow:

```text
pointer event
      ↓
normalized coordinates
      ↓
Raycaster
      ↓
intersections
      ↓
selected mesh
      ↓
region ID
```

Do not allow arbitrary object names to become user-facing labels.

Resolve everything through the stable data model.

---

# 11. Selection System

The selection system should maintain a single authoritative state:

```text
selectedRegionId
```

Example:

```js
selectedRegionId = "hippocampus_left";
```

Then multiple UI components react to the same state:

```text
selectedRegionId
      ├── 3D highlight
      ├── region panel
      ├── label
      ├── camera target
      └── related structures
```

This prevents synchronization bugs.

---

# 12. Highlighting System

Use several levels of feedback.

## Hover

Subtle visual feedback.

## Selected

Strong highlight.

## Isolated

Everything else becomes dimmed or hidden.

## Guided lesson

The highlighted target may pulse or animate.

Recommended state machine:

```text
NORMAL
  ↓
HOVERED
  ↓
SELECTED
  ↓
FOCUSED
  ↓
ISOLATED
```

A selected structure should never be visually identical to an unselected structure.

---

# 13. Camera System

The camera system should provide:

- default overview;
- focus on selected object;
- focus on a group of objects;
- anatomical preset views;
- reset;
- optional front/left/right/top/back/bottom views.

## Fly-to sequence

```text
Current camera
      ↓
calculate target bounding box
      ↓
calculate ideal camera distance
      ↓
interpolate camera position
      ↓
interpolate orbit target
      ↓
arrive at structure
```

Do not instantly teleport the camera unless the user explicitly asks for an instant change.

Smooth movement improves spatial understanding.

---

# 14. Transparency System

Transparency is one of the most useful teaching features.

Example UI:

```text
Surface transparency
0% ───────────────●── 100%
```

Use it primarily for structures that hide deeper anatomy.

Example educational sequence:

```text
Full cortex
     ↓
Reduce opacity
     ↓
Reveal deeper structures
     ↓
Select hippocampus
     ↓
Highlight hippocampus
```

The opacity system should distinguish:

- surface layer;
- selected object;
- hidden object;
- normal deep structures.

Never make every mesh transparent simultaneously if that creates visual noise.

---

# 15. Layer System

Recommended layer groups:

```text
Cerebral Cortex
Cerebral Lobes
Subcortical Structures
Limbic System
Brainstem
Cerebellum
Ventricular System
Cranial Nerves
White Matter
Pathways
```

For MVP, keep only 4–6 groups.

Every layer should support:

- show;
- hide;
- isolate;
- dim;
- optionally lock from interaction.

---

# 16. Slicing / Section Views

## Preferred long-term method

Use Three.js clipping planes for interactive 3D cutting.

Conceptually:

```text
3D brain
   │
   ▼
clipping plane
   │
   ├── sagittal
   ├── coronal
   └── axial
```

The student can drag a slider to move the plane.

Example:

```text
Sagittal position
LEFT ─────────●──────── RIGHT
```

## Important implementation detail

Do not implement clipping before the model, materials, transparency and selection systems are stable.

Otherwise debugging becomes difficult because several visibility systems interact at once.

---

# 17. Search System

Search should support:

- exact names;
- partial names;
- aliases;
- system names;
- categories.

Example:

```text
Search: hippoc

Results:
• Hippocampus
• Left Hippocampus
• Right Hippocampus
```

Selecting a result should:

```text
search result
    ↓
region ID
    ↓
select region
    ↓
focus camera
    ↓
highlight
    ↓
open information panel
```

Later, fuzzy search can be added.

---

# 18. Information Panel Design

Do not dump a textbook paragraph into the panel.

Recommended structure:

```text
PREfrontal Cortex
────────────────────────

WHERE IS IT?
Short spatial explanation.

WHAT IS IT?
Short definition.

MAIN FUNCTIONS
• Planning
• Decision making
• Working memory

CONNECTED TO
• Region A
• Region B
• Region C

WHY DOES IT MATTER?
Short educational explanation.

CLINICAL NOTE
Validated, non-diagnostic educational content.

REFERENCES
[1] ...
[2] ...

[ Explore connections ]
[ Test me ]
```

Keep the first paragraph short and scannable.

---

# 19. Student Learning Modes

## Mode 1 — Explore

Free exploration.

Student controls everything.

## Mode 2 — Learn

Guided explanation.

Example:

```text
Step 1: Find the frontal lobe
Step 2: Zoom in
Step 3: Locate the prefrontal cortex
Step 4: Learn its functions
Step 5: View a section
```

## Mode 3 — Quiz

Hide labels and ask questions.

Example:

```text
Find the hippocampus.
```

The student clicks it.

## Mode 4 — Clinical/Advanced

Introduce disease or lesion relationships carefully and educationally.

Do not present the site as a diagnostic system.

---

# 20. Guided Lesson Architecture

Represent lessons as data rather than hard-coding them.

Example concept:

```json
{
  "id": "lesson_frontal_lobe_01",
  "title": "Explore the Frontal Lobe",
  "steps": [
    {
      "type": "focus",
      "regionId": "frontal_lobe"
    },
    {
      "type": "explanation",
      "regionId": "frontal_lobe"
    },
    {
      "type": "focus",
      "regionId": "prefrontal_cortex"
    },
    {
      "type": "quiz",
      "questionId": "quiz_001"
    }
  ]
}
```

This means you can create new lessons without rewriting the renderer.

---

# 21. Quiz Architecture

Quiz question types:

### Identify

“Click the hippocampus.”

### Function

“Which function is associated with this structure?”

### Location

“Which lobe contains this structure?”

### Relationship

“Which structure is connected to this one in this lesson?”

### Cross-section

“Identify the structure shown in this slice.”

Quiz state:

```text
currentQuestion
selectedAnswer
correctAnswer
score
attempts
completedQuestions
```

Keep quiz logic independent from Three.js so it can be tested without rendering the model.

---

# 22. Advanced Feature: Relationship Visualization

Once region selection works, connect related structures.

Example:

```text
              Hippocampus
               /       \
              /         \
       Memory          Navigation
             \
              \
             Thalamus
```

In 3D, use curves/lines between selected structures.

The flow becomes:

```text
Select region
      ↓
Show related regions
      ↓
Highlight connections
      ↓
Explain relationship
```

This changes the site from an anatomy dictionary into a network-learning tool.

---

# 23. Advanced Feature: “Peel the Brain”

This can become one of the signature interactions.

Example progression:

```text
Layer 1 — cortex
      ↓
Layer 2 — white matter
      ↓
Layer 3 — basal structures
      ↓
Layer 4 — ventricles / deeper structures
```

Use controlled hiding/transparency rather than destructively modifying the model.

The student should always be able to press:

```text
RESET LAYERS
```

---

# 24. Advanced Feature: Cross-Section Explorer

A dedicated section-view mode can show:

```text
             3D VIEW
                │
                ▼
         SECTION PLANE
                │
       ┌────────┼────────┐
       ▼        ▼        ▼
    Sagittal  Coronal  Axial
```

Controls:

- plane orientation;
- plane position;
- show labels;
- transparency;
- isolate structure;
- reset plane.

For educational usability, display a small orientation widget or axis indicator.

---

# 25. Advanced Feature: Labels

Labels should be optional.

Modes:

```text
Labels OFF
Labels ON
Labels for selected region
Labels for current lesson
```

Avoid displaying hundreds of labels simultaneously.

Use labels primarily for teaching.

---

# 26. Advanced Feature: AI Tutor

This should be added only after the deterministic learning experience works.

Possible architecture:

```text
Student asks question
        ↓
AI Tutor
        ↓
Retrieve approved anatomy content
        ↓
Generate explanation
        ↓
Show source/reference
```

The AI tutor should not be allowed to invent anatomy.

Use a curated knowledge base and retrieval layer for the educational domain.

Potential later stack:

```text
Frontend
   ↓
API
   ↓
retrieval layer
   ↓
curated anatomy documents
   ↓
LLM
```

The AI tutor should be explicitly educational and should not present diagnosis or personalized medical advice.

---

# 27. Project Repository Strategy

Recommended repository structure:

```text
interactive-brain-atlas/
│
├── README.md
├── LICENSE
├── package.json
├── .gitignore
│
├── app/
│   ├── public/
│   │   └── models/
│   └── src/
│
├── blender/
│   ├── source/
│   │   └── brain_source.blend
│   ├── scripts/
│   │   ├── validate_names.py
│   │   ├── assign_region_ids.py
│   │   └── export_web_asset.py
│   ├── exports/
│   │   └── brain.glb
│   └── notes/
│
├── data/
│   ├── regions.json
│   ├── lessons.json
│   ├── quizzes.json
│   └── references.json
│
├── docs/
│   ├── architecture.md
│   ├── asset-spec.md
│   ├── content-guidelines.md
│   └── testing.md
│
└── screenshots/
```

Keep the source `.blend` file separate from the production `.glb`.

---

# 28. Blender Asset Pipeline

## Stage A — Acquire source

Verify:

- license;
- attribution requirements;
- redistribution rights;
- modification rights;
- commercial/non-commercial limitations;
- model quality;
- anatomical claims.

## Stage B — Import

Open in Blender.

## Stage C — Inspect

Determine:

- hierarchy;
- object count;
- mesh count;
- materials;
- polygon count;
- hidden objects;
- duplicate geometry;
- anatomical separation.

## Stage D — Normalize

Standardize:

- scale;
- orientation;
- naming;
- transforms;
- collections.

## Stage E — Anatomical organization

Move related objects into logical collections.

Example:

```text
COLLECTION_CORTEX
COLLECTION_SUBCORTICAL
COLLECTION_LIMBIC
COLLECTION_BRAINSTEM
COLLECTION_CEREBELLUM
```

## Stage F — Metadata

Attach region IDs.

## Stage G — Materials

Create web-friendly materials.

## Stage H — Optimization

Reduce unnecessary geometry and textures.

## Stage I — Export

Export `.glb` with required objects and custom properties.

## Stage J — Browser validation

Load the GLB in Three.js and verify every expected region.

---

# 29. Asset Validation Script

Create an automated validation script in Blender that reports:

```text
Expected region: hippocampus_left → FOUND
Expected region: hippocampus_right → FOUND
Expected region: thalamus → FOUND
...
```

Also validate:

- duplicate IDs;
- missing IDs;
- empty meshes;
- non-manifold issues where relevant;
- extreme scale differences;
- unexpected collection membership;
- missing materials;
- object names that violate conventions.

The build should fail or warn clearly when required anatomy is missing.

---

# 30. Web Asset Optimization

A high-detail medical model can become enormous.

Plan for at least two model tiers if necessary:

```text
brain_low.glb
brain_medium.glb
brain_high.glb
```

Potential strategies:

- reduce polygon count;
- remove unseen internal geometry when appropriate;
- reduce texture resolution;
- reuse materials;
- compress geometry using supported glTF workflows where practical;
- load only required assets for a given lesson;
- lazy-load advanced modules.

Target an experience that starts quickly on a typical student laptop.

---

# 31. Performance Strategy

Measure instead of guessing.

Track:

- initial load time;
- GLB download size;
- number of meshes;
- triangle count;
- draw calls;
- memory usage;
- frame rate;
- mobile behavior.

Potential architecture:

```text
Initial page
   ↓
load lightweight shell
   ↓
load model
   ↓
show basic viewer
   ↓
load deeper content lazily
```

Do not block the entire page on optional educational assets.

---

# 32. UX Layout Recommendation

Desktop layout:

```text
┌───────────────────────────────────────────────────────────────┐
│ Brain Atlas     Search __________________     Mode: Explore  │
├────────────────┬──────────────────────────────┬───────────────┤
│                │                              │               │
│ NAVIGATION     │                              │ REGION INFO   │
│                │                              │               │
│ Systems        │          3D BRAIN           │ Name          │
│ • Cortex       │                              │ Location      │
│ • Limbic       │                              │ Functions     │
│ • Brainstem    │                              │ Connections    │
│                │                              │ References    │
│ Lessons        │                              │               │
│ Quiz           │                              │               │
│                │                              │               │
├────────────────┴──────────────────────────────┴───────────────┤
│ Rotate  Zoom  Pan  Slice  Transparency  Labels  Reset       │
└───────────────────────────────────────────────────────────────┘
```

Mobile/tablet:

- viewer becomes primary;
- information appears in a bottom sheet;
- controls collapse into drawers;
- search remains prominent.

---

# 33. Visual Design Principles

The site should feel like a learning instrument, not a game dashboard.

Recommended principles:

- dark or neutral background behind the brain;
- strong contrast for selected anatomy;
- readable typography;
- restrained animation;
- no excessive gradients;
- consistent iconography;
- clear selected state;
- obvious reset control;
- calm colors for anatomy;
- one strong accent for interaction;
- clear distinction between information and controls.

The most important object on screen should remain the brain.

---

# 34. Accessibility

Do not make 3D interaction the only way to use the atlas.

Provide:

- keyboard-accessible search;
- keyboard-accessible controls;
- text alternatives for region information;
- visible focus states;
- high-contrast labels;
- reduced-motion setting;
- clear headings;
- readable font sizes;
- screen-reader-friendly information panels.

For example:

```text
3D region selected: Hippocampus

Use the information panel to read the description.
```

---

# 35. Content Governance

For every anatomical region, maintain:

```text
region ID
canonical name
aliases
system
location
function
connections
clinical relevance
source references
content version
review status
```

Example statuses:

```text
DRAFT
UNDER_REVIEW
APPROVED
PUBLISHED
```

Do not let AI-generated text directly become production medical educational content without review.

---

# 36. Reference and Citation Strategy

Every medically meaningful region description should have a source trail.

Recommended reference categories:

- anatomy textbooks;
- peer-reviewed sources;
- authoritative institutional educational resources;
- approved curriculum material.

The UI can show:

```text
Sources
[1] Anatomy reference
[2] Neuroscience reference
```

The web experience should not need to display enormous citation lists by default; allow expansion.

---

# 37. Testing Strategy

## Unit tests

Test:

- data lookup;
- search;
- quiz evaluation;
- selection state;
- lesson transitions.

## Asset tests

Test:

- required object IDs exist;
- no duplicate IDs;
- export loads correctly.

## Integration tests

Test:

```text
click object
   ↓
correct region selected
   ↓
correct content shown
   ↓
correct camera target
```

## Visual tests

Check:

- initial state;
- selected state;
- transparent cortex;
- clipped view;
- mobile layout;
- labels;
- reset.

## Performance tests

Use representative laptops/tablets rather than only a high-end development machine.

---

# 38. Milestone Plan

## Milestone 1 — Environment

Deliverables:

- Blender installed;
- Blender MCP connected;
- Node.js project created;
- Three.js project runs;
- Git repository initialized.

Success:

```text
AI agent can inspect Blender.
Browser can render a simple Three.js scene.
```

---

## Milestone 2 — Brain Asset

Deliverables:

- source model acquired;
- license documented;
- model imported;
- anatomical hierarchy documented;
- naming standard established;
- web-ready GLB export.

Success:

```text
brain.glb loads correctly.
```

---

## Milestone 3 — Viewer

Deliverables:

- camera;
- orbit controls;
- lighting;
- responsive renderer;
- loading state;
- reset.

Success:

```text
Smooth 3D manipulation.
```

---

## Milestone 4 — Interactive Anatomy

Deliverables:

- raycasting;
- object-to-region mapping;
- selection;
- highlight;
- info panel;
- camera fly-to.

Success:

```text
Click → Focus → Highlight → Explain
```

---

## Milestone 5 — Exploration Tools

Deliverables:

- search;
- layers;
- transparency;
- isolation;
- labels.

Success:

```text
Students can independently explore anatomy.
```

---

## Milestone 6 — Sectioning

Deliverables:

- clipping plane;
- sagittal;
- coronal;
- axial;
- section slider;
- section reset.

Success:

```text
Students can inspect internal structures.
```

---

## Milestone 7 — Learning System

Deliverables:

- lessons;
- guided tours;
- quiz mode;
- progress states.

Success:

```text
Students can learn without instructor assistance.
```

---

## Milestone 8 — Advanced Atlas

Deliverables:

- connections;
- pathways;
- advanced layers;
- additional anatomy;
- more detailed references.

---

# 39. Suggested Development Order

Do not build features in random order.

Use this dependency chain:

```text
1. Brain model
        ↓
2. GLB export
        ↓
3. Three.js loader
        ↓
4. Camera controls
        ↓
5. Raycasting
        ↓
6. Region IDs
        ↓
7. Highlighting
        ↓
8. Information panel
        ↓
9. Camera fly-to
        ↓
10. Search
        ↓
11. Layers
        ↓
12. Transparency
        ↓
13. Slicing
        ↓
14. Guided lessons
        ↓
15. Quiz
        ↓
16. Connections/pathways
        ↓
17. AI tutor
```

Each later stage depends on the earlier architecture being stable.

---

# 40. AI-Agent Development Workflow

A very effective workflow is:

```text
Plan
  ↓
Ask AI to implement one small capability
  ↓
Run app
  ↓
Capture screenshot/error
  ↓
Inspect
  ↓
Fix
  ↓
Commit
  ↓
Next capability
```

Do not ask the agent:

> “Build the entire brain atlas.”

Instead ask:

> “Load the GLB, index all objects by region ID, and print a validation report. Do not modify any other part of the application.”

Then:

> “Add raycasting and selection without changing the existing loader.”

Then:

> “Add the region information panel using `regions.json`.”

This keeps the system understandable and makes failures much easier to diagnose.

---

# 41. Suggested MCP Workflow for Blender

## Task 1 — Inspect model

Ask the agent to report:

- object count;
- collection tree;
- mesh names;
- materials;
- major anatomy candidates;
- polygon counts.

Do not alter the model yet.

## Task 2 — Create backup

Save:

```text
brain_source_original.blend
```

Then work on:

```text
brain_source_working.blend
```

## Task 3 — Normalize names

Use a deterministic naming map.

## Task 4 — Add region metadata

Attach custom properties.

## Task 5 — Validate

Run a validation script.

## Task 6 — Optimize

Reduce unnecessary geometry/material complexity.

## Task 7 — Export

Create:

```text
brain.glb
```

## Task 8 — Browser validation

Load the file in Three.js and check all required IDs.

---

# 42. Example AI Prompts for Blender MCP

## Scene inspection

```text
Inspect the current Blender scene without modifying it. Report the collection hierarchy, all mesh object names, approximate polygon counts, materials, and which objects appear to represent major brain structures. Group the report by likely anatomical system.
```

## Naming

```text
Do not change geometry. Rename only the objects listed in the mapping I provide. Preserve left/right distinctions. Use stable snake_case region identifiers and report every rename performed.
```

## Metadata

```text
For each selected anatomical object, add a Blender custom property named region_id using the exact ID provided. Do not invent IDs. After completion, print all object names and region IDs.
```

## Validation

```text
Run the anatomy validation script. Report missing required region IDs, duplicate region IDs, objects without region IDs, and objects whose names violate the project's naming convention. Do not modify the scene.
```

## Export

```text
Export only the approved anatomy collection as a GLB. Include custom properties. Do not include cameras, lights, hidden experimental objects, or unrelated meshes. Preserve object hierarchy and region metadata.
```

---

# 43. Example AI Prompts for the Web Application

## Loader

```text
Implement GLTFLoader for the existing Three.js viewer. Load public/models/brain.glb, show a loading state, and keep the existing camera controls unchanged. Add useful error logging. Do not implement selection yet.
```

## Raycasting

```text
Add pointer-based raycasting to the brain viewer. Only objects with a valid region_id should be selectable. On click, update a single selectedRegionId state. Do not modify the UI panel yet.
```

## Selection UI

```text
When selectedRegionId changes, look up the matching entry in regions.json and populate the region panel. Preserve the existing Three.js viewer and camera behavior.
```

## Camera focus

```text
When a region is selected, calculate a smooth camera target from the selected object's bounding box. Animate the camera and controls target without changing the model transform.
```

---

# 44. Important Architectural Rule: Separate Systems

Keep these responsibilities separate:

```text
3D rendering
        ≠
anatomy content
        ≠
UI
        ≠
lesson logic
        ≠
quiz logic
```

For example:

```text
Three.js
    knows:
    "this object has region_id hippocampus_left"

Content layer
    knows:
    "hippocampus_left means ..."

UI layer
    knows:
    "display the selected region"

Quiz layer
    knows:
    "is the selected region the correct answer?"
```

This separation will make the project expandable.

---

# 45. Common Mistakes to Avoid

## Mistake 1 — One giant brain mesh

It makes region selection difficult.

## Mistake 2 — Hard-coding object names everywhere

Use stable region IDs instead.

## Mistake 3 — Building React before proving Three.js

Prove the 3D core first.

## Mistake 4 — Overloading the first version

Do not build slicing, quizzes, AI, analytics, accounts, and pathways before basic selection works.

## Mistake 5 — Trusting AI-generated anatomy

Use authoritative/licensed anatomical sources and human review.

## Mistake 6 — Ignoring mobile performance

A beautiful desktop scene can fail completely on mobile.

## Mistake 7 — No asset versioning

Treat `brain.glb` like a software dependency.

## Mistake 8 — Mixing educational content with rendering code

Keep content in structured data.

---

# 46. Recommended MVP Feature Set

The first serious version should contain only:

```text
✓ 3D brain
✓ Rotate
✓ Zoom
✓ Pan
✓ Reset
✓ Click region
✓ Highlight region
✓ Camera fly-to
✓ Search
✓ Information panel
✓ Major layer visibility
✓ Surface transparency
✓ Basic labels
```

Do NOT put these in MVP unless the core is already stable:

```text
✗ AI tutor
✗ User accounts
✗ Social features
✗ complex analytics
✗ hundreds of quizzes
✗ complete neuroanatomical pathways
✗ full clinical simulator
```

---

# 47. Suggested Initial Anatomy Set

Start with enough structures to make the application meaningful without making the asset pipeline overwhelming.

## High-level regions

- Cerebrum
- Cerebral cortex
- Frontal lobe
- Parietal lobe
- Temporal lobe
- Occipital lobe
- Cerebellum
- Brainstem

## Major subcortical structures

- Thalamus
- Hypothalamus
- Hippocampus
- Amygdala
- Basal ganglia components where supported by the model
- Corpus callosum
- Ventricular system where supported

## Cortex examples

Eventually add major functional/anatomical areas such as:

- Prefrontal cortex
- Primary motor cortex
- Primary somatosensory cortex
- Visual cortex
- Auditory cortex
- Broca's area
- Wernicke-related language regions where anatomically appropriate to the chosen representation

The exact structure list should be finalized against the chosen source model and educational scope.

---

# 48. Definition of “Professional Quality”

The product should not be judged only by how realistic the brain looks.

Professional quality means:

```text
Anatomical structure quality
        +
Interaction quality
        +
Educational clarity
        +
Performance
        +
Accessibility
        +
Content quality
        +
Maintainability
```

A beautiful model with incorrect labels is worse than a simpler but trustworthy model.

---

# 49. Long-Term Architecture

When the product grows, use a feature-oriented architecture:

```text
src/
├── features/
│   ├── explorer/
│   ├── search/
│   ├── lessons/
│   ├── quiz/
│   ├── slicing/
│   ├── layers/
│   ├── pathways/
│   └── tutor/
│
├── engine/
│   ├── scene/
│   ├── camera/
│   ├── loader/
│   ├── interaction/
│   └── materials/
│
├── data/
├── ui/
└── shared/
```

This is more scalable than putting everything into one `main.js`.

---

# 50. Final Target Experience

The finished application should feel like:

```text
                    BRAIN ATLAS
                         │
        ┌────────────────┼─────────────────┐
        │                │                 │
        ▼                ▼                 ▼
     EXPLORE           LEARN              QUIZ
        │                │                 │
        │                │                 │
        ▼                ▼                 ▼
      3D Brain       Guided tours      Identify regions
        │                │                 │
        ├── Rotate       ├── Camera        ├── Click
        ├── Zoom         ├── Highlight     ├── Answer
        ├── Slice        ├── Explain       └── Score
        ├── Layer        └── Review
        └── Search
```

And beneath all of this:

```text
                CURATED ANATOMY DATA
                         │
                    REFERENCES
                         │
                REVIEWED CONTENT
                         │
                  3D REGION IDs
```

---

# 51. Recommended Immediate Execution Plan

Do the following in order.

## Step 1

Install/use Blender 5.1+ for the official Blender MCP path.

Reference: [Blender MCP setup](https://github.com/intel/AI-Playground/blob/main/blender-mcp.md)

## Step 2

Create the Git repository:

```text
interactive-brain-atlas
```

## Step 3

Create the browser project with Three.js.

## Step 4

Select and document a legally usable anatomical brain model.

## Step 5

Open the model in Blender.

## Step 6

Use Blender/MCP to inspect and document the scene before making modifications.

## Step 7

Define the stable region-ID convention.

## Step 8

Organize the model into anatomical collections.

## Step 9

Attach region IDs as custom properties where useful.

## Step 10

Export an initial GLB.

## Step 11

Create the Three.js viewer.

## Step 12

Implement selection and region lookup.

## Step 13

Add highlight + camera focus.

## Step 14

Add the educational panel.

## Step 15

Add search, layers and transparency.

## Step 16

Add slicing.

## Step 17

Add guided lessons.

## Step 18

Add quizzes.

## Step 19

Optimize and test.

## Step 20

Only then add advanced pathways and AI tutoring.

---

# 52. Suggested First Technical Milestone

The first milestone should be deliberately small:

```text
Blender
  ↓
prepared brain.glb
  ↓
Three.js
  ↓
render brain
  ↓
click hippocampus
  ↓
highlight hippocampus
  ↓
show “Hippocampus” in a panel
  ↓
fly camera toward it
```

When this works reliably, the project's core architecture has been proven.

Everything else becomes an incremental feature rather than a risky rewrite.

---

# 53. Success Criteria for the First Prototype

The prototype is successful when all of the following are true:

- the brain loads without console errors;
- the GLB is reasonably sized;
- the scene renders smoothly on a normal laptop;
- the user can rotate, zoom and pan;
- the user can select a structure;
- the selected structure is highlighted;
- the correct region ID is identified;
- the correct content is shown;
- the camera can focus on the structure;
- reset works every time;
- the asset can be re-exported without breaking IDs;
- the content can be updated without modifying Three.js code.

That is the foundation to protect throughout the project.

---

# 54. Technical References

- Neurotorium Brain Atlas: https://neurotorium.org/tool/brain-atlas/
- Neurotorium 3D Brain Atlas usage article: https://neurotorium.org/article/how-to-use-the-3d-brain-atlas/
- Blender official glTF documentation: https://docs.blender.org/manual/en/dev/addons/scene_gltf2.html
- Blender MCP setup/reference: https://github.com/intel/AI-Playground/blob/main/blender-mcp.md
- Official Blender project repository for MCP: https://projects.blender.org/lab/blender_mcp
- Three.js documentation: https://threejs.org/docs/
- Three.js GLTFLoader documentation: https://threejs.org/docs/#examples/en/loaders/GLTFLoader

Note: The MCP ecosystem changes quickly. Treat the Blender MCP repository and Blender's official documentation as the source of truth for installation details, compatibility and current tool availability.

---

# 55. Final Architecture Decision

## Use this:

```text
                    ┌───────────────────────┐
                    │     Student Browser   │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ HTML / CSS / React    │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │      Three.js         │
                    │                       │
                    │ Camera                │
                    │ Raycasting            │
                    │ Highlighting          │
                    │ Clipping              │
                    │ Layers                │
                    └───────────┬───────────┘
                                │
                                ▼
                         ┌──────────────┐
                         │   brain.glb  │
                         └──────┬───────┘
                                │
                                │ produced by
                                ▼
                    ┌───────────────────────┐
                    │       Blender         │
                    │                       │
                    │ Model preparation     │
                    │ Naming                │
                    │ Collections           │
                    │ Metadata              │
                    │ Optimization          │
                    └───────────┬───────────┘
                                │
                                │ AI-assisted via
                                ▼
                    ┌───────────────────────┐
                    │    Blender MCP        │
                    └───────────────────────┘
```

## In one sentence

> **Build the anatomy in Blender, use MCP to accelerate and automate Blender work, export a stable GLB, and build the actual student experience with Three.js and structured educational data.**

That is the architecture I recommend for this project because it gives you a strong MVP quickly while leaving a clean path toward slicing, layered anatomy, guided learning, quizzes, neural pathways, and an AI tutor.
