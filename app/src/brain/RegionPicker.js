import * as THREE from "three";
import { resolveRegionId } from "./BrainLoader.js";

/**
 * Pointer raycasting against the brain model: click resolves a region and
 * reports it (walking up the parent chain to the nearest tagged ancestor);
 * pointer movement reports hover in/out for the same resolution, so the UI
 * can show a "what am I about to click" label before the user commits.
 * Clicks that hit nothing, or hit untagged geometry, report null/deselect.
 */
export class RegionPicker {
  constructor(camera, domElement, brainRoot, { onSelect, onDeselect, onHover, onHoverEnd }) {
    this.camera = camera;
    this.domElement = domElement;
    this.brainRoot = brainRoot;
    this.onSelect = onSelect;
    this.onDeselect = onDeselect;
    this.onHover = onHover;
    this.onHoverEnd = onHoverEnd;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this._hoveredRegionId = null;
    this._pendingHoverEvent = null;
    this._hoverRafId = 0;

    this._onClick = this._onClick.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerLeave = this._onPointerLeave.bind(this);
    this.domElement.addEventListener("click", this._onClick);
    this.domElement.addEventListener("pointermove", this._onPointerMove);
    this.domElement.addEventListener("pointerleave", this._onPointerLeave);
  }

  _resolveFromEvent(event) {
    const rect = this.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObject(this.brainRoot, true);
    if (hits.length === 0) return { regionId: null, object: null };
    return { regionId: resolveRegionId(hits[0].object), object: hits[0].object };
  }

  _onClick(event) {
    const { regionId, object } = this._resolveFromEvent(event);
    if (regionId) {
      this.onSelect(regionId, object);
    } else {
      this.onDeselect();
    }
  }

  _onPointerMove(event) {
    this._pendingHoverEvent = event;
    if (this._hoverRafId) return;
    this._hoverRafId = requestAnimationFrame(() => {
      this._hoverRafId = 0;
      const evt = this._pendingHoverEvent;
      if (!evt) return;
      const { regionId } = this._resolveFromEvent(evt);
      if (regionId !== this._hoveredRegionId) {
        this._hoveredRegionId = regionId;
        if (regionId) {
          this.onHover(regionId, evt.clientX, evt.clientY);
        } else {
          this.onHoverEnd();
        }
      } else if (regionId) {
        this.onHover(regionId, evt.clientX, evt.clientY);
      }
      this.domElement.style.cursor = regionId ? "pointer" : "grab";
    });
  }

  _onPointerLeave() {
    this._hoveredRegionId = null;
    this.onHoverEnd();
  }

  dispose() {
    this.domElement.removeEventListener("click", this._onClick);
    this.domElement.removeEventListener("pointermove", this._onPointerMove);
    this.domElement.removeEventListener("pointerleave", this._onPointerLeave);
    if (this._hoverRafId) cancelAnimationFrame(this._hoverRafId);
  }
}
