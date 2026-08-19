import * as THREE from "three";

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Smooth camera fly-to on top of an existing OrbitControls instance.
 * Section 13: never teleport instantly unless explicitly asked.
 */
const MIN_DISTANCE_FRACTION = 1.05;
const ELEVATION_BIAS = 0.22;

export class CameraController {
  constructor(camera, controls) {
    this.camera = camera;
    this.controls = controls;
    this._activeTween = null;
    this.sceneDiameter = null;
    this.sceneCenter = null;
  }

  /** Call once after the model loads: small structures get a sane zoom floor,
   * and every fly-to picks a "best angle" radiating outward from this center
   * rather than reusing whatever direction the user last happened to be
   * looking from. */
  setSceneScale(rootObject) {
    const box = new THREE.Box3().setFromObject(rootObject);
    const size = box.getSize(new THREE.Vector3());
    this.sceneDiameter = Math.max(size.x, size.y, size.z);
    this.sceneCenter = box.getCenter(new THREE.Vector3());
  }

  /**
   * `bestAngle: true` picks a curated viewing direction (radiating outward
   * from the whole-brain center) — used for guided/teaching navigation:
   * label clicks, search, tour steps, related-region chips. Left at its
   * default `false` for direct clicks on the model itself, which only
   * reframes distance/target and keeps whatever direction the user has
   * freely orbited to — so exploring the model never gets its view yanked
   * out from under it.
   */
  flyTo(targetObject, { durationMs = 800, padding = 1.8, bestAngle = false } = {}) {
    const box = new THREE.Box3().setFromObject(targetObject);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 0.05;
    const minDistance = (this.sceneDiameter ?? maxDim) * MIN_DISTANCE_FRACTION;
    const distance = Math.max(maxDim * padding, minDistance);

    const direction = bestAngle ? this._bestDirection(center) : this._currentDirection();
    const endPosition = center.clone().add(direction.multiplyScalar(distance));
    const endTarget = center.clone();

    this._runTween(endPosition, endTarget, durationMs);
  }

  _currentDirection() {
    const direction = this.camera.position.clone().sub(this.controls.target);
    if (direction.lengthSq() < 1e-6) direction.set(0, 0, 1);
    return direction.normalize();
  }

  /** Radiates outward from the whole-brain center toward the target, biased
   * slightly upward for a flattering three-quarter angle instead of a flat
   * side-on view. Falls back to the current viewing direction for targets
   * that sit almost exactly at the brain's center (e.g. midline structures). */
  _bestDirection(targetCenter) {
    if (!this.sceneCenter) return this._currentDirection();

    const radial = targetCenter.clone().sub(this.sceneCenter);
    if (radial.lengthSq() < 1e-6) return this._currentDirection();
    radial.normalize();

    radial.y += ELEVATION_BIAS;
    radial.normalize();
    return radial;
  }

  /**
   * Interpolating camera.position linearly between two points cuts a
   * straight chord through 3D space. That's fine when start/end are close,
   * but between two very different viewing angles (e.g. hopping from one
   * side of the brain to the other) a straight-line chord swings through
   * the middle at an odd speed and reads as a jump/cut rather than a turn.
   * Instead this orbits: the viewing *direction* (camera position relative
   * to target) is interpolated along the shortest great-circle arc via
   * quaternion slerp, while target and distance interpolate linearly — so
   * the camera always arcs around the model like a real orbit, regardless
   * of how far apart the two angles are.
   */
  _runTween(endPosition, endTarget, durationMs) {
    if (this._activeTween) cancelAnimationFrame(this._activeTween.rafId);

    const startTarget = this.controls.target.clone();
    const startOffset = this.camera.position.clone().sub(startTarget);
    const startDistance = startOffset.length() || 1;
    const startDir = startOffset.clone().divideScalar(startDistance);

    const endOffset = endPosition.clone().sub(endTarget);
    const endDistance = endOffset.length() || 1;
    const endDir = endOffset.clone().divideScalar(endDistance);

    const rotation = new THREE.Quaternion().setFromUnitVectors(startDir, endDir);
    const identity = new THREE.Quaternion();
    const q = new THREE.Quaternion();
    const dir = new THREE.Vector3();
    const target = new THREE.Vector3();

    const startTime = performance.now();
    const tween = { rafId: 0 };
    this._activeTween = tween;

    const step = (now) => {
      const t = Math.min(1, (now - startTime) / durationMs);
      const eased = easeInOutCubic(t);

      target.lerpVectors(startTarget, endTarget, eased);
      const distance = startDistance + (endDistance - startDistance) * eased;
      q.copy(identity).slerp(rotation, eased);
      dir.copy(startDir).applyQuaternion(q);

      this.camera.position.copy(target).addScaledVector(dir, distance);
      this.controls.target.copy(target);
      this.controls.update();

      if (t < 1) {
        tween.rafId = requestAnimationFrame(step);
      } else if (this._activeTween === tween) {
        this._activeTween = null;
      }
    };

    tween.rafId = requestAnimationFrame(step);
  }
}
