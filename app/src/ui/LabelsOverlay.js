import * as THREE from "three";

const SVG_NS = "http://www.w3.org/2000/svg";
const COLUMN_MARGIN = 24;
const EDGE_MARGIN = 8;
const SMOOTHING = 0.25;
const SEPARATION_ITERATIONS = 4;
const LABEL_HALF_HEIGHT = 15;
const LABEL_GAP = 6;

function cssColor(hex) {
  return `#${hex.toString(16).padStart(6, "0")}`;
}

/**
 * Permanent on-model labels: each tagged region gets a clickable,
 * color-coded tag connected by a straight leader line back to its exact 3D
 * position — but the tag itself stays docked to the left or right edge of
 * the viewport, never on top of the model. An earlier version pushed each
 * label radially outward from the model's projected center until it
 * cleared an estimated on-screen radius; that reads fine for a roughly
 * round object like the brain, but breaks down for a tall, narrow model
 * like a full skeleton — a radius sized to the model's width is far too
 * small vertically, so head/foot labels landed back on the body.
 *
 * Docking to a fixed screen-edge column is shape-agnostic: whichever side of
 * the model an anchor projects to, its label slides to that edge and stays
 * there. The left/right split itself is decided from the *tagged anchors'*
 * own on-screen spread (the midpoint of their min/max projected X) each
 * frame, rather than the model's full bounding-box center — a couple of
 * small, off-axis structures (e.g. ear ossicles sitting beside the skull)
 * can pull that geometric center well off the body's visual midline, which
 * would otherwise route every label to the same side.
 *
 * A pairwise separation pass then nudges apart any labels that still
 * overlap each other — within either column, several regions can end up at
 * a similar screen height, so without this they'd stack on top of each
 * other.
 *
 * Every label/line pair is tinted with that region's accent color (from the
 * injected RegionColorScheme) so it's obvious which line belongs to which
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
  constructor(container, regionIndex, regions, colorScheme, { onSelect, onHoverStart, onHoverEnd }) {
    this.container = container;
    this.onSelect = onSelect;
    this.onHoverStart = onHoverStart || (() => {});
    this.onHoverEnd = onHoverEnd || (() => {});
    this.visible = false;
    this.entries = [];

    this.svg = document.createElementNS(SVG_NS, "svg");
    this.svg.setAttribute("class", "label-lines");
    container.appendChild(this.svg);

    const box = new THREE.Box3();
    for (const [regionId, object3D] of regionIndex.entries()) {
      const data = regions[regionId];
      if (!data) continue;

      const accent = cssColor(colorScheme.accentColorForRegion(regionId));

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
    const projected = new THREE.Vector3();
    const visible = [];
    let minAnchorX = Infinity;
    let maxAnchorX = -Infinity;

    for (const entry of this.entries) {
      projected.copy(entry.worldCenter).project(camera);
      if (projected.z > 1) {
        entry.el.style.display = "none";
        entry.line.style.display = "none";
        continue;
      }
      entry.anchorX = (projected.x * 0.5 + 0.5) * rect.width;
      entry.anchorY = (-projected.y * 0.5 + 0.5) * rect.height;
      minAnchorX = Math.min(minAnchorX, entry.anchorX);
      maxAnchorX = Math.max(maxAnchorX, entry.anchorX);

      entry.el.style.display = "flex";
      if (entry.el.offsetWidth) entry.halfWidth = entry.el.offsetWidth / 2 + LABEL_GAP;

      visible.push(entry);
    }

    // Split left/right by the midpoint of the tagged anchors' own on-screen
    // spread, not the model's full bounding-box center — a few small,
    // off-axis structures (e.g. ear ossicles sitting beside the skull) can
    // pull the geometric center away from the body's visual midline, which
    // would otherwise route every label to one side.
    const modelCX = visible.length ? (minAnchorX + maxAnchorX) / 2 : rect.width / 2;

    for (const entry of visible) {
      const onLeft = entry.anchorX < modelCX;
      entry.targetX = onLeft ? COLUMN_MARGIN + entry.halfWidth : rect.width - COLUMN_MARGIN - entry.halfWidth;
      entry.targetY = entry.anchorY;
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
