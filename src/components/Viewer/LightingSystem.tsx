import { useThree } from "@react-three/fiber";
import { useViewerState } from "@/stores/viewerStore.js";
import { useEffect } from "react";
import {
  MeshBasicMaterial,
  MeshStandardMaterial,
  Texture,
  Mesh,
} from "three";

export default function LightingSystem() {
  const { model } = useViewerState();
  const { invalidate } = useThree();

  // Apply unlit materials — show albedo textures without lighting
  useEffect(() => {
    if (!model) return;
    const obj = model.object;

    obj.traverse((child) => {
      if (child instanceof Mesh) {
        const orig = Array.isArray(child.material) ? child.material[0] : child.material;
        const basic = new MeshBasicMaterial();
        if ("map" in orig && orig.map) {
          basic.map = orig.map as Texture;
        }
        if ("color" in orig && orig instanceof MeshStandardMaterial) {
          basic.color.copy(orig.color);
        }
        child.material = basic;
      }
    });

    invalidate();
  }, [model, invalidate]);

  return <ambientLight intensity={0.1} />;
}
