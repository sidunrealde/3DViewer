import { type Object3D, Mesh, BufferGeometry } from "three";

/**
 * Preprocess a loaded model for photogrammetry viewing:
 * - Compute vertex normals if missing
 * - Compute bounding box
 */
export function preprocessModel(obj: Object3D): void {
  obj.traverse((child) => {
    if (child instanceof Mesh && child.geometry instanceof BufferGeometry) {
      const geo = child.geometry;

      // Compute vertex normals if not present (common in photogrammetry exports)
      if (!geo.attributes["normal"]) {
        geo.computeVertexNormals();
      }

      // Compute bounding box and sphere for frustum culling
      if (!geo.boundingBox) geo.computeBoundingBox();
      if (!geo.boundingSphere) geo.computeBoundingSphere();

      // Enable shadow casting/receiving
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
}
