import { useThree } from "@react-three/fiber";
import { useViewerState } from "@/stores/viewerStore.js";
import { useEffect, useMemo } from "react";
import {
  MeshBasicMaterial,
  MeshNormalMaterial,
  MeshMatcapMaterial,
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
      if (orig) {
        child.material = orig;
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        for (const m of mats) {
          if ("wireframe" in m) (m as Material & { wireframe: boolean }).wireframe = false;
        }
      }
    }
  });
}

function overrideMaterials(obj: Object3D, material: Material) {
  obj.traverse((child) => {
    if (child instanceof Mesh) {
      if (!originalMaterials.has(child)) {
        originalMaterials.set(child, child.material);
      }
      child.material = material;
    }
  });
}

function setWireframe(obj: Object3D, wireframe: boolean) {
  obj.traverse((child) => {
    if (child instanceof Mesh) {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      for (const mat of mats) {
        if ("wireframe" in mat) {
          (mat as Material & { wireframe: boolean }).wireframe = wireframe;
        }
      }
    }
  });
}

export default function LightingSystem() {
  const { lightingPreset, lightIntensity, model, showGroundShadow } = useViewerState();
  const { invalidate } = useThree();

  const unlitMat = useMemo(() => new MeshBasicMaterial(), []);
  const normalMat = useMemo(() => new MeshNormalMaterial(), []);
  const matcapMat = useMemo(() => new MeshMatcapMaterial(), []);

  // Apply material overrides based on preset
  useEffect(() => {
    if (!model) return;
    const obj = model.object;
    saveMaterials(obj);

    switch (lightingPreset) {
      case "unlit":
        // For unlit, we want to show albedo textures without lighting
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
        break;
      case "matcap":
        overrideMaterials(obj, matcapMat);
        break;
      case "normals":
        overrideMaterials(obj, normalMat);
        break;
      case "wireframe":
        restoreMaterials(obj);
        setWireframe(obj, true);
        break;
      default:
        restoreMaterials(obj);
        break;
    }

    invalidate();

    return () => {
      // Restore when preset changes
      restoreMaterials(obj);
    };
  }, [lightingPreset, model, invalidate, unlitMat, normalMat, matcapMat]);

  const isLit = lightingPreset === "studio" || lightingPreset === "environment";

  return (
    <>
      {/* Studio lights — only active in lit modes */}
      {isLit && (
        <>
          <ambientLight intensity={0.4 * lightIntensity} />
          <directionalLight
            position={[5, 8, 5]}
            intensity={1.0 * lightIntensity}
            castShadow={showGroundShadow}
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <directionalLight position={[-3, 4, -5]} intensity={0.5 * lightIntensity} />
          <directionalLight position={[0, -2, 5]} intensity={0.2 * lightIntensity} />
        </>
      )}

      {/* Minimal ambient for non-lit presets so matcap/unlit are visible */}
      {!isLit && <ambientLight intensity={0.1} />}

      {/* Ground shadow plane */}
      {showGroundShadow && isLit && (
        <mesh rotation-x={-Math.PI / 2} position={[0, -1, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <shadowMaterial opacity={0.3} />
        </mesh>
      )}
    </>
  );
}
