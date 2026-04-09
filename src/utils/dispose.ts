import { type Object3D, Mesh, Material, Texture, BufferGeometry, SkinnedMesh } from "three";

/**
 * Deeply dispose all GPU resources (geometries, materials, textures) of a Three.js object tree.
 * Critical for photogrammetry models which can consume hundreds of MB of GPU memory.
 */
export function disposeObject(obj: Object3D): void {
  obj.traverse((child) => {
    if (child instanceof Mesh || child instanceof SkinnedMesh) {
      if (child.geometry instanceof BufferGeometry) {
        child.geometry.dispose();
      }

      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const mat of materials) {
        disposeMaterial(mat);
      }
    }
  });

  obj.removeFromParent();
}

function disposeMaterial(material: Material): void {
  // Iterate all properties looking for textures
  for (const value of Object.values(material)) {
    if (value instanceof Texture) {
      value.dispose();
    }
  }
  material.dispose();
}

/** Revoke any blob/object URLs to free memory */
export function revokeObjectURLs(urls: string[]): void {
  for (const url of urls) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore invalid URLs
    }
  }
}
