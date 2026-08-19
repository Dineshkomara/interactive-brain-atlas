import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CAMERA, BACKGROUND_COLOR } from "../utils/constants.js";

/**
 * Owns the Three.js scene, camera, renderer and orbit controls for the
 * brain viewport. Version 0.1: proves smooth orbit/zoom/pan/reset with a
 * placeholder object. The GLTF brain model loader replaces the placeholder
 * in a later version without touching this scaffolding.
 */
export class BrainViewer {
  constructor(container) {
    this.container = container;
    this.clock = new THREE.Clock();

    this._initScene();
    this._initCamera();
    this._initRenderer();
    this._initLights();
    this._initControls();
    this._initPlaceholder();

    this._onResize = this._onResize.bind(this);
    window.addEventListener("resize", this._onResize);
    this._onResize();

    this._animate = this._animate.bind(this);
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(BACKGROUND_COLOR);
  }

  _initCamera() {
    const { fov, near, far, defaultPosition } = CAMERA;
    this.camera = new THREE.PerspectiveCamera(fov, 1, near, far);
    this.defaultCameraPosition = new THREE.Vector3(...defaultPosition);
    this.defaultTarget = new THREE.Vector3(0, 0, 0);
    this.camera.position.copy(this.defaultCameraPosition);
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);
  }

  _initLights() {
    const hemi = new THREE.HemisphereLight(0xffffff, 0x1a1d24, 1.1);
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(4, 6, 5);
    const fill = new THREE.DirectionalLight(0xffffff, 0.4);
    fill.position.set(-5, -2, -4);
    this.scene.add(hemi, key, fill);
  }

  _initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.copy(this.defaultTarget);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 30;
    this.controls.update();
  }

  _initPlaceholder() {
    const geometry = new THREE.IcosahedronGeometry(1.4, 3);
    const material = new THREE.MeshStandardMaterial({
      color: 0xc9a6a6,
      roughness: 0.6,
      metalness: 0.05,
      flatShading: false,
    });
    this.placeholder = new THREE.Mesh(geometry, material);
    this.scene.add(this.placeholder);
  }

  resetCamera() {
    this.camera.position.copy(this.defaultCameraPosition);
    this.controls.target.copy(this.defaultTarget);
    this.controls.update();
  }

  /** Removes the placeholder (if present) and frames the camera on `root`. */
  setBrainRoot(root) {
    if (this.placeholder) {
      this.scene.remove(this.placeholder);
      this.placeholder.geometry.dispose();
      this.placeholder.material.dispose();
      this.placeholder = null;
    }
    this.scene.add(root);

    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const distance = maxDim * 1.6;

    this.defaultTarget = center.clone();
    this.defaultCameraPosition = center
      .clone()
      .add(new THREE.Vector3(0, maxDim * 0.15, distance));
    this.controls.minDistance = maxDim * 0.1;
    this.controls.maxDistance = maxDim * 8;
    this.resetCamera();
  }

  _onResize() {
    const { clientWidth, clientHeight } = this.container;
    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(clientWidth, clientHeight);
  }

  start() {
    this.renderer.setAnimationLoop(this._animate);
  }

  _animate() {
    const delta = this.clock.getDelta();
    if (this.placeholder) {
      this.placeholder.rotation.y += delta * 0.15;
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    if (this.onFrame) this.onFrame(delta);
  }

  dispose() {
    window.removeEventListener("resize", this._onResize);
    this.renderer.setAnimationLoop(null);
    this.controls.dispose();
    this.renderer.dispose();
  }
}
