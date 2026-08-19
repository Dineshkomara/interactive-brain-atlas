# Interactive Brain Atlas

A browser-based, student-focused interactive 3D brain atlas. Built with Blender (asset
preparation) and Three.js (browser 3D interaction). See
[`docs/detailed-plan.md`](docs/detailed-plan.md) for the full development plan.

## Status

Early scaffolding. No brain model has been selected/imported yet.

## Repository layout

```text
interactive-brain-atlas/
├── app/            Three.js web application
├── blender/        Blender source files, scripts, and GLB exports
├── data/           Educational content (regions, lessons, quizzes, references)
├── docs/           Architecture, asset spec, content guidelines, testing docs
└── screenshots/    Visual snapshots for review
```

## Development

```bash
cd app
npm install
npm run dev
```

## Asset pipeline

Source anatomical model → Blender (naming, collections, metadata, optimization) →
`blender/exports/brain.glb` → copied to `app/public/models/brain.glb` → loaded by the
Three.js viewer.

See [`blender/notes/`](blender/notes/) for model sourcing and licensing notes.
