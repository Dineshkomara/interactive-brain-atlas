import * as THREE from "three";
import { resolveRegionId } from "./BrainLoader.js";
import { colorForRegion } from "./RegionColors.js";

const FADED_OPACITY = 0.05;
const FADED_COLOR_SCALE = 0.5;

/** Outer/surface regions — faded during x-ray mode so internal structures
 * (thalamus, hippocampus, ventricles, basal ganglia...) become clickable
 * without singling out any one of them. */
const SURFACE_REGIONS = new Set([
  "brain",
  "cerebrum",
  "frontal_lobe",
  "parietal_lobe",
  "temporal_lobe",
  "occipital_lobe",
  "cerebellum",
  "brainstem",
]);

/**
 * Isolate-style selection feedback: the selected region's meshes render at
 * full opaque color; every other mesh fades to a faint, translucent ghost so
 * deep structures (thalamus, hippocampus, ventricles...) stay visible through
 * the surrounding cortex rather than being fully occluded by it.
 *
 * Kept deliberately plain: normal (not additive) blending at very low
 * opacity, so the faded brain reads as a faint outline rather than a glow —
 * additive blending was tried to fight the transparency-noise problem below,
 * but its brightness-stacking read as unwanted extra lighting/sparkle.
 * Z-Anatomy's source materials are double-sided, which under any
 * transparency means front AND back faces of the same folded, concave
 * cortex geometry both blend — forcing faded meshes to single-sided
 * (front-face only) removes that doubling and, combined with the very low
 * opacity, keeps the residual sort-order noise close to imperceptible.
 * Also applies the atlas-style per-region color coding (RegionColors).
 *
 * xray(true) is a second, independent mode layered on top of selection:
 * it fades every surface/cortex region uniformly (not the specific answer)
 * so internal structures become visible — used for quiz "identify"
 * questions that target something internal, without revealing which one
 * is correct. Fading alone isn't enough, though: Three.js raycasting
 * ignores material opacity entirely, so a click would still hit the
 * now-invisible cortex first, before ever reaching the internal structure
 * behind it. xray() also disables raycasting on faded surface meshes
 * (mesh.raycast = no-op) so clicks pass straight through to what's
 * actually visible.
 */
export class RegionHighlighter {
  constructor(root) {
    this.meshes = [];
    this.selectedRegionId = null;
    this.xrayActive = false;

    root.traverse((obj) => {
      if (obj.isMesh) {
        obj.material = Array.isArray(obj.material)
          ? obj.material.map((m) => m.clone())
          : obj.material.clone();
        obj.userData.resolvedRegionId = resolveRegionId(obj);

        const color = colorForRegion(obj.userData.resolvedRegionId);
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const material of materials) {
          if (color !== null && material.color) material.color.setHex(color);
          material.transparent = false;
          material.opacity = 1;
          material.depthWrite = true;
          material.userData.baseColor = material.color.clone();
          material.userData.baseSide = material.side;
        }

        this.meshes.push(obj);
      }
    });
  }

  select(regionId) {
    this.selectedRegionId = regionId;
    this._apply();
  }

  clear() {
    this.select(null);
  }

  /** Fades all surface/cortex regions uniformly, independent of the current
   * selection, so internal structures become clickable/visible together. */
  xray(active) {
    this.xrayActive = active;
    this._apply();
    for (const mesh of this.meshes) {
      if (!SURFACE_REGIONS.has(mesh.userData.resolvedRegionId)) continue;
      if (active) {
        mesh.raycast = () => {};
      } else {
        delete mesh.raycast;
      }
    }
  }

  _apply() {
    for (const mesh of this.meshes) {
      const faded = this.xrayActive
        ? SURFACE_REGIONS.has(mesh.userData.resolvedRegionId)
        : this.selectedRegionId !== null && mesh.userData.resolvedRegionId !== this.selectedRegionId;
      this._setFaded(mesh, faded);
    }
  }

  _setFaded(mesh, faded) {
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      const base = material.userData.baseColor;
      if (!base) continue;
      if (faded) {
        material.color.copy(base).multiplyScalar(FADED_COLOR_SCALE);
        material.transparent = true;
        material.opacity = FADED_OPACITY;
        material.depthWrite = false;
        material.side = THREE.FrontSide;
        material.blending = THREE.NormalBlending;
      } else {
        material.color.copy(base);
        material.transparent = false;
        material.opacity = 1;
        material.depthWrite = true;
        material.side = material.userData.baseSide;
        material.blending = THREE.NormalBlending;
      }
      material.needsUpdate = true;
    }
  }
}
