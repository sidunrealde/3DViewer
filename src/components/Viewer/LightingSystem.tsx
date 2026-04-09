import { useThree } from "@react-three/fiber";
import { useViewerState } from "@/stores/viewerStore.js";
import { useEffect } from "react";
import {
  MeshBasicMaterial,
  MeshStandardMaterial,
  Material,
  Texture,
  type Object3D,
  Mesh,
} from "three";

// Store original materials so we can restore them when switching presets
const originalMaterials = new WeakMap<Mesh, Material | Material[]>();

function saveMaterials(obj: Object3D) {
  obj.traverse((child) => {
    if (child instanceof Mesh && !originalMaterials.has(child)) {
      originalMaterials.set(child, child.material);
    }
  });
}

function restoreMaterials(obj: Object3D) {
  obj.traverse((child) => {
    if (child instanceof Mesh) {
      const orig = originalMaterials.get(child);
      if (orig) child.material = orig;
    }
  });
}

export default function LightingSystem() {
  const { lightingPreset, model } = useViewerState();
  const { invalidate } = useThree();

  // Apply material overrides based on preset
  useEffect(() => {
    if (!model) return;
    const obj = model.object;
    saveMaterials(obj);

    if (lightingPreset === "unlit") {
      // Show albedo textures without lighting
      obj.traverse((child) => {
        if (child instanceof Mesh) {
          if (!originalMaterials.has(child)) {
            originalMaterials.set(child, child.material);
          }
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
    } else {
      restoreMaterials(obj);
    }

    invalidate();

    return () => {
      restoreMaterials(obj);
    };
  }, [lightingPreset, model, invalidate]);

  return (
    <>
      {/* Studio lights */}
      {lightingPreset === "studio" && (
        <>
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[5, 8, 5]}
            intensity={1.0}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <directionalLight position={[-3, 4, -5]} intensity={0.5} />
          <directionalLight position={[0, -2, 5]} intensity={0.2} />
        </>
      )}

      {/* Minimal ambient for unlit so model is visible */}
      {lightingPreset === "unlit" && <ambientLight intensity={0.1} />}

      {/* Ground shadow plane */}
      {lightingPreset === "studio" && (
        <mesh rotation-x={-Math.PI / 2} position={[0, -1, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <shadowMaterial opacity={0.3} />
        </mesh>
      )}
    </>
  );
}
