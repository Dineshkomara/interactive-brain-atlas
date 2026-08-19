import * as THREE from "three";
import regions from "../data/regions.json";
import { accentColorForRegion } from "../brain/RegionColors.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const SILHOUETTE_MARGIN = 26;
const EDGE_MARGIN = 8;
const SMOOTHING = 0.25;
const SEPARATION_ITERATIONS = 4;
const LABEL_HALF_HEIGHT = 15;
const LABEL_GAP = 6;

function cssColor(hex) {
  return `#${hex.toString(16).padStart(6, "0")}`;
}

/**
 * Permanent on-model labels (Section 25): each tagged region gets a
 * clickable, color-coded tag that rotates/moves with the model, connected
 * by a straight leader line back to its exact 3D position — but the tag
 * itself is kept in the empty space around the brain's silhouette rather
 * than sitting on top of the model. A fixed pixel offset from the anchor
 * isn't enough for that: a structure anchored near the middle of the
 * screen would still land its label on the visible surface. Instead each
 * label is pushed out along the direction from the brain's own projected
 * center through its anchor, until it clears the brain's estimated
 * on-screen radius (recomputed every frame from the live camera, via
 * setSceneScale) — so the label always ends up past the outline, however
 * deep the actual structure is, while the leader line still runs from the
 * true anchor point out to it.
 *
 * A pairwise separation pass then nudges apart any labels that still
 * overlap each other — several regions (thalamus, hippocampus, amygdala,
 * the basal ganglia, the ventricles) sit close together near the brain's
 * center, so without this they'd stack on top of each other even once
 * they're all outside the silhouette.
 *
 * Every label/line pair is tinted with that region's accent color (see
 * RegionColors.ACCENT_COLORS) so it's obvious which line belongs to which
 * label even when several pass near each other.
 *
 * Hovering a label (without clicking) briefly previews that structure via
 * onHoverStart/onHoverEnd — lets a student sweep across labels and see each
 * one light up before committing to a click.
 *
 * The displayed position is smoothed (lerped) toward the target position
 * every frame rather than snapping instantly, so orbiting reads as motion
 * rather than a jump.
 *
 * The anchor point itself needs care: several regions (whole lobes,
 * cerebrum, cerebellum, brainstem, the whole brain) are groups spanning
 * BOTH hemispheres. The bounding-box center of a bilateral group sits on
 * the midline between the two sides — in the gap, not on any actual
 * tissue — so the leader line would point at nothing. Anchoring instead to
 * the single largest mesh inside each region's subtree lands the point on
 * real, solid geometry every time; for regions that are already just one
 * mesh (thalamus, hippocampus, ...) this is unchanged.
 */
export class LabelsOverlay {
  constructor(container, regionIndex, { onSelect, onHoverStart, onHoverEnd }) {
    this.container = container;
    this.onSelect = onSelect;
    this.onHoverStart = onHoverStart || (() => {});
    this.onHoverEnd = onHoverEnd || (() => {});
    this.visible = false;
    this.entries = [];
    this.sceneCenter = null;
    this.sceneRadius = null;

    this.svg = document.createElementNS(SVG_NS, "svg");
    this.svg.setAttribute("class", "label-lines");
    container.appendChild(this.svg);

    const box = new THREE.Box3();
    for (const [regionId, object3D] of regionIndex.entries()) {
      const data = regions[regionId];
      if (!data) continue;

      const accent = cssColor(accentColorForRegion(regionId));

      const el = document.createElement("button");
      el.type = "button";
      el.className = "model-label";
      el.style.setProperty("--label-accent", accent);
      el.style.display = "none";
      el.innerHTML = `<span class="label-dot"></span>${data.name}`;
      el.addEventListener("click", () => this.onSelect(regionId));
      el.addEventListener("mouseenter", () => {
        el.classList.add("hovered");
        line.classList.add("hovered");
        this.onHoverStart(regionId);
      });
      el.addEventListener("mouseleave", () => {
        el.classList.remove("hovered");
        line.classList.remove("hovered");
        this.onHoverEnd(regionId);
      });
      container.appendChild(el);

      const line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("class", "label-line");
      line.style.setProperty("--label-accent", accent);
      this.svg.appendChild(line);

      const worldCenter = this._anchorPoint(object3D, box);

      this.entries.push({
        regionId,
        worldCenter,
        el,
        line,
        anchorX: 0,
        anchorY: 0,
        targetX: 0,
        targetY: 0,
        halfWidth: 45,
        displayX: null,
        displayY: null,
      });
    }
  }

  /** Call once after the model loads (and its scale is known) so labels
   * know how big the brain's silhouette is on screen. */
  setSceneScale(center, radius) {
    this.sceneCenter = center.clone();
    this.sceneRadius = radius;
  }

  /** Finds the largest single mesh in `object3D`'s subtree (by bounding-box
   * volume) and returns its world-space center — see class doc for why. */
  _anchorPoint(object3D, scratchBox) {
    let bestMesh = null;
    let bestVolume = -Infinity;
    const size = new THREE.Vector3();

    object3D.traverse((child) => {
      if (!child.isMesh) return;
      scratchBox.setFromObject(child);
      scratchBox.getSize(size);
      const volume = size.x * size.y * size.z;
      if (volume > bestVolume) {
        bestVolume = volume;
        bestMesh = child;
      }
    });

    scratchBox.setFromObject(bestMesh || object3D);
    return scratchBox.getCenter(new THREE.Vector3());
  }

  setVisible(visible) {
    this.visible = visible;
    this.svg.style.display = visible ? "block" : "none";
    if (!visible) {
      for (const entry of this.entries) {
        entry.el.style.display = "none";
        entry.line.style.display = "none";
      }
    }
  }

  toggle() {
    this.setVisible(!this.visible);
    return this.visible;
  }

  update(camera) {
    if (!this.visible) return;
    const rect = this.container.getBoundingClientRect();
    this.svg.setAttribute("width", rect.width);
    this.svg.setAttribute("height", rect.height);
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const projected = new THREE.Vector3();
    const visible = [];

    // Estimate the brain's on-screen silhouette: project its center, and a
    // point one scene-radius away along the camera's own right axis, then
    // measure the resulting pixel distance. Recomputed every frame so it
    // tracks zoom/distance changes automatically.
    let brainCX = cx;
    let brainCY = cy;
    let brainScreenRadius = 0;
    if (this.sceneCenter) {
      projected.copy(this.sceneCenter).project(camera);
      brainCX = (projected.x * 0.5 + 0.5) * rect.width;
      brainCY = (-projected.y * 0.5 + 0.5) * rect.height;

      const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
      const edgeWorld = this.sceneCenter.clone().addScaledVector(right, this.sceneRadius);
      projected.copy(edgeWorld).project(camera);
      const edgeX = (projected.x * 0.5 + 0.5) * rect.width;
      const edgeY = (-projected.y * 0.5 + 0.5) * rect.height;
      brainScreenRadius = Math.hypot(edgeX - brainCX, edgeY - brainCY);
    }

    for (const entry of this.entries) {
      projected.copy(entry.worldCenter).project(camera);
      if (projected.z > 1) {
        entry.el.style.display = "none";
        entry.line.style.display = "none";
        continue;
      }
      entry.anchorX = (projected.x * 0.5 + 0.5) * rect.width;
      entry.anchorY = (-projected.y * 0.5 + 0.5) * rect.height;

      let dirX = entry.anchorX - brainCX;
      let dirY = entry.anchorY - brainCY;
      const len = Math.hypot(dirX, dirY) || 1;
      dirX /= len;
      dirY /= len;
      if (len < 1) {
        dirX = 0.6;
        dirY = -0.8;
      }

      const reach = brainScreenRadius + SILHOUETTE_MARGIN;
      entry.targetX = brainCX + dirX * reach;
      entry.targetY = brainCY + dirY * reach;

      entry.el.style.display = "flex";
      if (entry.el.offsetWidth) entry.halfWidth = entry.el.offsetWidth / 2 + LABEL_GAP;

      visible.push(entry);
    }

    this._separate(visible);

    for (const entry of visible) {
      const targetX = Math.max(EDGE_MARGIN, Math.min(rect.width - EDGE_MARGIN, entry.targetX));
      const targetY = Math.max(EDGE_MARGIN, Math.min(rect.height - EDGE_MARGIN, entry.targetY));

      if (entry.displayX === null) {
        entry.displayX = targetX;
        entry.displayY = targetY;
      } else {
        entry.displayX += (targetX - entry.displayX) * SMOOTHING;
        entry.displayY += (targetY - entry.displayY) * SMOOTHING;
      }

      entry.el.style.left = `${entry.displayX}px`;
      entry.el.style.top = `${entry.displayY}px`;

      entry.line.style.display = "";
      entry.line.setAttribute("x1", entry.anchorX);
      entry.line.setAttribute("y1", entry.anchorY);
      entry.line.setAttribute("x2", entry.displayX);
      entry.line.setAttribute("y2", entry.displayY);
    }
  }

  /** Simple pairwise AABB repulsion: pushes any two overlapping label boxes
   * apart along whichever axis has less overlap, run a few times so chains
   * of overlaps settle into a non-overlapping (or much less crowded)
   * layout. Cheap enough at ~26 labels to run every frame. */
  _separate(list) {
    for (let iter = 0; iter < SEPARATION_ITERATIONS; iter++) {
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i];
          const b = list[j];
          const dx = b.targetX - a.targetX;
          const dy = b.targetY - a.targetY;
          const overlapX = a.halfWidth + b.halfWidth - Math.abs(dx);
          const overlapY = LABEL_HALF_HEIGHT * 2 - Math.abs(dy);
          if (overlapX <= 0 || overlapY <= 0) continue;

          if (overlapX < overlapY) {
            const push = (overlapX / 2) * (dx < 0 ? -1 : 1) || 1;
            a.targetX -= push;
            b.targetX += push;
          } else {
            const push = (overlapY / 2) * (dy < 0 ? -1 : 1) || 1;
            a.targetY -= push;
            b.targetY += push;
          }
        }
      }
    }
  }

  dispose() {
    for (const entry of this.entries) {
      entry.el.remove();
      entry.line.remove();
    }
    this.svg.remove();
  }
}
