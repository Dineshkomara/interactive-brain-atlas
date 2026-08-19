import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const loader = new GLTFLoader();

/**
 * Loads brain.glb and indexes every node carrying a `region_id` glTF extra.
 * Does not touch selection/raycasting — this module's only job is
 * load + index, per the plan's incremental build order (Section 39/43).
 */
export function loadBrain(url, onProgress) {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        const root = gltf.scene;
        const regionIndex = new Map();
        const seenMaterials = new Set();

        root.traverse((obj) => {
          const regionId = obj.userData?.region_id;
          if (regionId) {
            if (regionIndex.has(regionId)) {
              console.warn(`Duplicate region_id "${regionId}" on`, obj.name);
            }
            regionIndex.set(regionId, obj);
          }

          // Z-Anatomy's source materials carry emissiveFactor=[1,1,1], used by
          // its in-Blender highlight toggles. Left as-is it washes every
          // surface to flat white under normal lighting, so neutralize it here.
          const materials = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
          for (const material of materials) {
            if (material.emissive && !seenMaterials.has(material.uuid)) {
              seenMaterials.add(material.uuid);
              material.emissive.set(0x000000);
            }
          }
        });

        resolve({ root, regionIndex });
      },
      onProgress,
      (error) => {
        console.error("Failed to load brain.glb:", error);
        reject(error);
      },
    );
  });
}

/** Walks up the parent chain from `object` to the nearest node with a region_id. */
export function resolveRegionId(object) {
  let node = object;
  while (node) {
    const regionId = node.userData?.region_id;
    if (regionId) return regionId;
    node = node.parent;
  }
  return null;
}
